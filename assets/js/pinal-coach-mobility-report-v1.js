(()=>{
'use strict';
let selected=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const number=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
const pct=x=>number(x)===null?'Not recorded':Math.round(Number(x))+'%';
const money=x=>number(x)===null?'Not recorded':'$'+Number(x).toFixed(2)+'/hr';
const row=(label,value)=>'<div class="item"><b>'+esc(label)+'</b>'+esc(value??'Not recorded')+'</div>';
const box=(name,inner)=>'<article class="evidenceCard"><h4>'+esc(name)+'</h4>'+inner+'</article>';
const grid=inner=>'<div class="evidenceGrid">'+inner+'</div>';
const prompts=[
 'Which explored occupation still interests the participant after reviewing duties, work environment and conditions?',
 'Which demonstrated skills may transfer, and what skills or credentials require verification?',
 'Could an adjacent job, advancement or employer-supported development meet the goal without starting over?',
 'Do wages, training time, local openings and the participant’s circumstances support this move?'
];
function modelFrom(raw){
 const m=raw&&typeof raw==='object'?raw:{};
 const compare=m.comparisonBySoc&&typeof m.comparisonBySoc==='object'?m.comparisonBySoc:{};
 if(!Object.keys(compare).length)return null;
 const start=m.startingPoint||{},out=new Map();
 const include=(x,key)=>{
  if(!x||typeof x!=='object')return;
  const soc=String(x.soc||key||'');
  if(!soc||soc===String(start.soc||''))return;
  out.set(soc,{...(out.get(soc)||{}),...x,soc});
 };
 (Array.isArray(m.careers)?m.careers:[]).forEach(x=>include(x));
 Object.entries(compare).forEach(([key,x])=>include(x,key));
 const scoreNames={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
 const top=Object.entries(m.interestScores||{}).filter(([k,v])=>scoreNames[k]&&number(v)!==null)
   .sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3)
   .map(([k,v])=>scoreNames[k]+' ('+v+')');
 const extra=Array.isArray(m.newExplorations)?m.newExplorations.filter(x=>x&&x.title):[];
 const day=m.completedAt?new Date(m.completedAt):null;
 return {start,wage:number(m.currentWage),note:m.workNote||'',careers:[...out.values()],
  skills:Array.isArray(m.selfAssessment)?m.selfAssessment.filter(x=>x?.skill&&x?.use):[],
  top,extra,reflection:m.reflection||'',completed:day&&!Number.isNaN(day.getTime())?day.toLocaleDateString():''};
}
function render(raw){
 const m=modelFrom(raw);
 if(!m)return null;
 selected=m;
 let html='<div class="coachNote"><b>Saved Career Mobility Report</b>'+
  (m.completed?' • '+esc(m.completed):'')+
  '<br>Rendered from Module 3 evidence in the participant’s BOOST journey. The originally printed PDF was not stored.</div>'+
  '<p><button class="btn" type="button" data-boost-mobility-pdf="1">Download Mobility Report (PDF)</button></p>';
 let current=row('Current / recent occupation',m.start.title||m.start.occupation||'Not recorded');
 current+=row('Reported hourly wage',money(m.wage));
 current+=row('Top O*NET interests',m.top.join(' • ')||'Not recorded');
 if(m.note)current+=row('Current work notes',m.note);
 html+=box('1. This Is Where I Am',grid(current));
 let careers='';
 for(const c of m.careers){
  const wage=number(c.earlyCareerWage);
  const difference=wage!==null&&m.wage!==null?(wage>=m.wage?'+':'-')+'$'+Math.abs(wage-m.wage).toFixed(2)+'/hr':'Not recorded';
  const metrics=grid(
   row('O*NET interest alignment',pct(c.interestAlignment))+
   row('Occupational compatibility',pct(c.occupationalCompatibility))+
   row('Transferable skill alignment',pct(c.transferableSkillAlignment))+
   row('Immediate mobility screening',pct(c.mobilityScore))+
   row('Early-career wage estimate',money(c.earlyCareerWage))+
   row('Difference from current wage',difference)+
   row('Job Zone',c.jobZone||'Not recorded'));
  careers+='<div class="evidenceCard" style="margin:10px 0;background:#fff"><h4>'+esc(c.title||'Occupation '+c.soc)+'</h4>'+metrics+'</div>';
 }
 html+=box('2. This Is Where I Am Exploring',careers||'<p>Explored careers were not recorded.</p>');
 let ratings='';
 for(const [label,code] of [['Used regularly','Used Regularly'],['Used sometimes','Used Sometimes'],['Limited experience','Limited Experience']]){
  const list=m.skills.filter(x=>String(x.use).toLowerCase()===code.toLowerCase()).map(x=>x.skill);
  if(list.length)ratings+=row(label,list.join(' • '));
 }
 html+=box('3. What My Skills Contributed',
  '<p>These ratings describe the participant’s reported experience, not verified employer qualifications.</p>'+
  (ratings?grid(ratings):'<p>No skill ratings recorded.</p>'));
 if(m.extra.length)html+=box('Other Opportunities Considered',grid(m.extra.map(x=>row(x.title,'Optional new exploration')).join('')));
 else html+='<p class="coachNote">The saved record does not contain a separate shortlist of optional career suggestions. None have been inferred.</p>';
 html+=box('4. What to Discuss Next',
  '<ul style="padding-left:22px;line-height:1.6">'+prompts.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
  (m.reflection?'<h4>Participant reflection</h4><p style="white-space:pre-wrap">'+esc(m.reflection)+'</p>':'<p class="coachNote">No final reflection saved.</p>'));
 html+='<p class="coachNote"><b>Module 3 contribution:</b> It compared the participant’s interests, skill-use ratings, occupational compatibility, estimated wages and mobility screening for researched careers. The coach should verify gaps, credentials and hiring opportunities before deciding a direction. This is not an eligibility or employment determination.</p>';
 return html;
}
function download(){
 if(!selected)return;
 const PDF=window.jspdf?.jsPDF;
 if(!PDF){alert('PDF export is unavailable; the report remains visible in Coach View.');return}
 const m=selected,doc=new PDF({format:'letter',unit:'pt'});
 let y=52;const margin=46,width=520;
 function write(text,heading=false){
  doc.setFont('helvetica',heading?'bold':'normal');doc.setFontSize(heading?12:10);
  const lines=doc.splitTextToSize(String(text),width);
  for(const line of lines){
   if(y>740){doc.setFontSize(8);doc.text('BOOST • Career Mobility Report',margin,770);doc.addPage();y=52;doc.setFontSize(heading?12:10)}
   doc.text(line,margin,y);y+=heading?18:15;
  }
  y+=heading?7:3;
 }
 write('My Career Mobility Story',true);
 if(m.completed)write('Completed: '+m.completed);
 write('This Is Where I Am',true);
 write('Current occupation: '+(m.start.title||m.start.occupation||'Not recorded'));
 write('Reported hourly wage: '+money(m.wage));
 write('Top O*NET interests: '+(m.top.join(', ')||'Not recorded'));
 if(m.note)write('Work notes: '+m.note);
 write('This Is Where I Am Exploring',true);
 for(const c of m.careers){
  write(c.title||c.soc,true);
  write('Interest: '+pct(c.interestAlignment)+' | Occupational compatibility: '+pct(c.occupationalCompatibility));
  write('Transferable skills: '+pct(c.transferableSkillAlignment)+' | Mobility screening: '+pct(c.mobilityScore));
  write('Early-career wage: '+money(c.earlyCareerWage)+' | Job Zone: '+(c.jobZone||'Not recorded'));
 }
 write('What My Skills Contributed',true);
 for(const x of m.skills)write(x.skill+': '+x.use);
 if(m.extra.length){write('Other Opportunities Considered',true);for(const x of m.extra)write(x.title)}
 write('What to Discuss Next',true);
 for(const q of prompts)write('- '+q);
 if(m.reflection)write('Participant reflection: '+m.reflection);
 write('Skill-use ratings and interest alignment are planning evidence, not qualification or employment guarantees.');
 doc.setFontSize(8);doc.text('BOOST • Career Mobility Report',margin,770);
 doc.save('BOOST-Career-Mobility-Report.pdf');
}
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-boost-mobility-pdf]');
 if(button&&document.getElementById('drawerBody')?.contains(button)){event.preventDefault();download()}
});
window.BOOSTCoachMobilityReport={render,download};
})();