'use strict';
// Offline-only. Executes the ACTUAL draft boost-cloud.js with in-memory Supabase and DOM shims.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const target = process.env.BOOST_CLOUD_SOURCE || path.resolve(__dirname, '../assets/js/boost-cloud.js');
if (!fs.existsSync(target)) throw new Error('Actual boost-cloud.js source is required: '+target);
const source = fs.readFileSync(target,'utf8');
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
const journal = () => ({participant:{name:'Test Only',email:'qa@example.invalid'},modules:{module1:{interestScores:{R:5},careers:[{title:'Welder'}],completedAt:'2026-10-01T00:00:00Z'}},progress:{module1:'complete'},portal:{map:{complete:{'m:module1':true}},completed:['module1'],pathway:'explore'}});
function backend(initial=null){
  let seq=initial?1:0;
  return {journey:clone(initial),revision:initial?'r1':null,calls:[],
    async rpc(method,p={}){
      this.calls.push(method);
      if(method==='boost_pinal_load_versioned')return {data:{journey:clone(this.journey),revision:this.revision},error:null};
      if(method==='boost_pinal_save_if_revision'){
        if(p.p_revision!==this.revision)return {data:{saved:false,reason:'revision_changed'},error:null};
        this.journey=clone(p.p_journey);this.revision='r'+(++seq);
        return {data:{saved:true,revision:this.revision,journey:clone(this.journey)},error:null};
      }
      throw Error('Unexpected RPC: '+method);
    }};
}
async function browser(db,{withSession=true,initial=null,storage=null}={}){
  class Storage {
    constructor(data={}){this.data=new Map(Object.entries(data));}
    getItem(k){return this.data.has(k)?this.data.get(k):null;}
    setItem(k,v){this.data.set(String(k),String(v));}
    removeItem(k){this.data.delete(k);}
    key(i){return [...this.data.keys()][i]||null;}
    get length(){return this.data.size;}
  }
  const localStorage=new Storage(storage||{}),sessionStorage=new Storage(),events=[];
  if(initial)localStorage.setItem('pinal_boost_journey_v1',JSON.stringify(initial));
  const user={email:'qa@example.invalid',user_metadata:{full_name:'Test Only'}};
  const c={auth:{async getSession(){return {data:{session:withSession?{user}:null}}}},rpc:(...args)=>db.rpc(...args)};
  const window={BOOST_CONFIG:{cloudEnabled:true,supabaseUrl:'https://offline.invalid',supabaseAnonKey:'offline-only',region:'Pinal County'},supabase:{createClient(){return c}},dispatchEvent(e){events.push({type:e.type,detail:e.detail});},addEventListener(){}};
  const document={readyState:'loading',addEventListener(){},querySelector(){return null;},getElementById(){return null;}};
  const location={hostname:'offline.invalid',pathname:'/unit-test',origin:'https://offline.invalid',href:'https://offline.invalid/unit-test'};
  const context={window,document,Storage,localStorage,sessionStorage,location,navigator:{onLine:true},crypto:webcrypto,Uint8Array,Date,JSON,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},setTimeout,clearTimeout,console,fetch:async()=>{throw Error('Network forbidden in offline QA')}};
  vm.runInNewContext(source,context,{filename:'assets/js/boost-cloud.js'});
  assert.ok(window.PinalBOOSTCloud,'Draft client must export PinalBOOSTCloud');
  await window.PinalBOOSTCloud.ready();
  return {cloud:window.PinalBOOSTCloud,localStorage,events};
}
function recoveries(b){return [...b.localStorage.data.entries()].filter(([k])=>k.startsWith('boost_pinal_browser_recovery_')).map(([,v])=>JSON.parse(v));}
test('initial cloud journey restored without stale local overlay',async()=>{
 const db=backend(journal());const old=journal();old.modules.module1.careers=[{title:'Old browser choice'}];const b=await browser(db,{initial:old});
 assert.equal(JSON.parse(b.localStorage.getItem('pinal_boost_journey_v1')).modules.module1.careers[0].title,'Welder');
 assert.ok(recoveries(b).some(x=>x.journey.modules.module1.careers[0].title==='Old browser choice'));
 assert.deepEqual(db.calls,['boost_pinal_load_versioned']);
});
test('two browsers: stale revision cannot overwrite newer career evidence',async()=>{
 const db=backend(journal());const a=await browser(db);const b=await browser(db);
 const ja=JSON.parse(a.localStorage.getItem('pinal_boost_journey_v1'));ja.modules.module1.careers=[{title:'Electrician'}];a.localStorage.setItem('pinal_boost_journey_v1',JSON.stringify(ja));
 assert.equal(await a.cloud.saveNow(),true);
 const jb=JSON.parse(b.localStorage.getItem('pinal_boost_journey_v1'));jb.modules.module1.careers=[{title:'Machinist'}];b.localStorage.setItem('pinal_boost_journey_v1',JSON.stringify(jb));
 assert.equal(await b.cloud.saveNow(),false);
 assert.equal(db.journey.modules.module1.careers[0].title,'Electrician');
 assert.ok(recoveries(b).some(x=>x.journey.modules.module1.careers[0].title==='Machinist'));
 assert.ok(b.events.some(x=>x.type==='boost-cloud-error'&&x.detail.kind==='conflict'));
 assert.equal(await b.cloud.saveNow(),false,'Paused conflicting session must stay blocked');
});
test('serialized simultaneous saves use successive revisions',async()=>{
 const db=backend(journal());const a=await browser(db);const j=JSON.parse(a.localStorage.getItem('pinal_boost_journey_v1'));j.modules.module1.interestScores.R=6;a.localStorage.setItem('pinal_boost_journey_v1',JSON.stringify(j));
 const writesBefore=db.calls.filter(x=>x==='boost_pinal_save_if_revision').length;
 assert.deepEqual(await Promise.all([a.cloud.saveNow(),a.cloud.saveNow()]),[true,true]);
 assert.equal(db.calls.filter(x=>x==='boost_pinal_save_if_revision').length-writesBefore,2);
 assert.equal(db.journey.modules.module1.interestScores.R,6);
});
test('fresh participant with no work can create isolated first journey',async()=>{
 const db=backend();const b=await browser(db);const j=journal();b.localStorage.setItem('pinal_boost_journey_v1',JSON.stringify(j));
 assert.equal(await b.cloud.saveNow(),true);assert.equal(db.journey.progress.module1,'complete');
});
test('unsynced browser-only work is retained and not silently imported',async()=>{
 const db=backend();const b=await browser(db,{initial:journal()});
 assert.equal(await b.cloud.saveNow(),false);assert.equal(db.journey,null);
 assert.ok(recoveries(b).length>0);
});
test('unauthenticated client never performs writes',async()=>{
 const db=backend();const b=await browser(db,{withSession:false});
 assert.equal(await b.cloud.saveNow(),false);assert.equal(db.journey,null);
 assert.equal(db.calls.filter(x=>x==='boost_pinal_save_if_revision').length,0);
});
