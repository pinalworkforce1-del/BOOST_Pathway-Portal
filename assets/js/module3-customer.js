(function(){
'use strict';

const INTEREST_NAMES={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function first(root,sel){try{return root?.querySelector(sel)||null}catch(_){return null}}
function all(root,sel){try{return [...root.querySelectorAll(sel)]}catch(_){return[]}}
function setText(el,text){if(el&&clean(el.textContent)!==clean(text))el.textContent=text}
function findByText(root,selector,re){return all(root,selector).find(el=>re.test(clean(el.textContent)))||null}

function addStyles(d){
 if(d.getElementById('boostM3CustomerStyles'))return;
 const s=d.createElement('style');s.id='boostM3CustomerStyles';s.textContent=`
 body.boostM3Customer{background:#eef4f8}
 body.boostM3Customer .hero{padding:34px 16px 30px}
 body.boostM3Customer .hero h1{max-width:900px;font-size:clamp(2rem,5.4vw,3.8rem)}
 body.boostM3Customer .hero p{font-size:1.04rem;line-height:1.6;max-width:850px}
 .boostM3Intro{padding:6px 0}
 .boostM3Eyebrow{font-size:.75rem;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#2a9d8f;margin-bottom:5px}
 .boostM3Intro h2{font-size:clamp(1.65rem,3vw,2.35rem);margin:.2rem 0 .55rem;color:#0b3158}
 .boostM3Intro>p{font-size:1.04rem;line-height:1.62;max-width:900px;color:#425b70}
 .boostFourQuestions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0 17px}
 .boostQuestion{border:1px solid #d6e3eb;background:#f8fbfd;border-radius:14px;padding:14px;min-height:110px}
 .boostQuestion b{display:block;color:#0b3158;margin-bottom:5px;font-size:1rem}.boostQuestion span{font-size:.85rem;color:#617589}
 .boostStartBtn{border:0;border-radius:11px;background:#0b3158;color:#fff;padding:13px 18px;font-weight:900;cursor:pointer;font-size:.95rem}
 .boostStartBtn:hover,.boostStartBtn:focus{background:#154f7b;outline:3px solid rgba(42,157,143,.22)}
 .boostCoach{margin:15px 0;padding:14px 16px 14px 18px;border-radius:14px;background:#eef8f6;border:1px solid #c9e6df;border-left:5px solid #2a9d8f;color:#284b5d;line-height:1.52}
 .boostCoach b{color:#176e69}.boostCoach small{display:block;margin-top:4px;color:#60778a}
 #boostM3StrengthCounter{margin:13px 0 16px;padding:14px;border-radius:14px;background:#f7fafc;border:1px solid #d8e3ec}
 .boostStrengthTop{display:flex;justify-content:space-between;gap:10px;align-items:center;font-weight:900;color:#0b3158}
 .boostStrengthTrack{height:8px;margin-top:9px;background:#e1e9ef;border-radius:999px;overflow:hidden}.boostStrengthFill{height:100%;background:#2a9d8f;border-radius:999px;transition:width .25s ease}
 .boostStrengthMessage{font-size:.84rem;color:#60778a;margin-top:7px}
 body.boostM3Customer #occupationalValue{display:none!important}
 body.boostM3Customer .capabilityGuide{background:#f7fafc}
 body.boostM3Customer .skillcard{transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
 body.boostM3Customer .skillcard:focus-within{border-color:#2a9d8f;box-shadow:0 0 0 3px rgba(42,157,143,.12)}
 body.boostM3Customer .skillcard .radios label{font-size:.82rem}
 .boostMobilityMap{margin:16px 0 18px;padding:17px;border-radius:17px;background:linear-gradient(135deg,#f7fbff,#f4faf8);border:1px solid #cfe0e9}
 .boostMobilityMap h3{margin:0 0 4px;color:#0b3158}.boostMobilityMap>p{margin:0 0 13px;color:#60778a;font-size:.9rem}
 .boostRouteTrack{display:grid;grid-template-columns:1.05fr auto 1fr 1fr 1fr;gap:8px;align-items:stretch}
 .boostRoute{padding:12px;border-radius:12px;background:#fff;border:1px solid #d7e2e9}.boostRoute.start{background:#0b3158;color:#fff}.boostRoute b{display:block;font-size:.88rem;margin-bottom:4px}.boostRoute span{display:block;font-size:.76rem;line-height:1.4;color:#60778a}.boostRoute.start span{color:#d9e9f5}.boostRouteArrow{display:flex;align-items:center;justify-content:center;font-weight:900;color:#7790a4;font-size:1.2rem}
 .boostSimpleMetrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:11px 0}
 .boostSimpleMetric{padding:9px 10px;background:#f7fafc;border:1px solid #e0e8ee;border-radius:10px;min-width:0}.boostSimpleMetric span{display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.04em;color:#708397;font-weight:800}.boostSimpleMetric b{display:block;margin-top:2px;color:#17324d;overflow-wrap:anywhere}
 .boostEvidenceToggle{border:1px solid #b9cad7;background:#fff;color:#0b3158;border-radius:9px;padding:8px 10px;font-weight:900;cursor:pointer;font-size:.78rem;margin:4px 0 8px}
 .boostCustomerCard .compareMetric,.boostCustomerCard .dualScore,.boostCustomerCard>.reason,.boostCustomerCard>.whyBox,.boostCustomerCard>.analysisGrid,.boostCustomerCard>.alignList,.boostCustomerCard>.gapList,.boostCustomerCard>.badge{display:none!important}
 .boostCustomerCard.boostShowEvidence .compareMetric,.boostCustomerCard.boostShowEvidence .dualScore,.boostCustomerCard.boostShowEvidence>.reason,.boostCustomerCard.boostShowEvidence>.whyBox,.boostCustomerCard.boostShowEvidence>.analysisGrid,.boostCustomerCard.boostShowEvidence>.alignList,.boostCustomerCard.boostShowEvidence>.gapList,.boostCustomerCard.boostShowEvidence>.badge{display:initial!important}
 .boostCustomerCard.boostShowEvidence .compareMetric{display:grid!important}.boostCustomerCard.boostShowEvidence .dualScore,.boostCustomerCard.boostShowEvidence>.analysisGrid{display:grid!important}.boostCustomerCard.boostShowEvidence>.reason,.boostCustomerCard.boostShowEvidence>.whyBox,.boostCustomerCard.boostShowEvidence>.alignList,.boostCustomerCard.boostShowEvidence>.gapList{display:block!important}
 .boostStorySummary{margin:15px 0 16px}.boostStoryLead{font-size:1rem;line-height:1.55;color:#425b70;margin-bottom:13px}.boostStoryGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.boostStoryCard{background:#f7fafc;border:1px solid #dce6ed;border-radius:12px;padding:13px}.boostStoryCard span{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#6d8193;font-weight:900;margin-bottom:4px}.boostStoryCard b{color:#17324d;line-height:1.4}
 .boostEvidenceDetails{margin:14px 0;border:1px solid #d5e1e8;border-radius:12px;background:#fbfdff}.boostEvidenceDetails>summary{cursor:pointer;padding:12px 14px;font-weight:900;color:#0b3158}.boostEvidenceDetails>#reportBody{padding:0 14px 14px}
 .boostReportNext{margin:15px 0 2px;padding:15px;border-radius:13px;background:#eef8f6;border-left:5px solid #2a9d8f}.boostReportNext b{color:#176e69}.boostReportNext button{margin-top:10px}
 body.boostM3Customer .footer{font-size:.68rem;opacity:.72}
 @media(max-width:850px){.boostFourQuestions{grid-template-columns:repeat(2,1fr)}.boostRouteTrack{grid-template-columns:1fr}.boostRouteArrow{transform:rotate(90deg);min-height:20px}.boostStoryGrid{grid-template-columns:1fr}}
 @media(max-width:560px){.boostFourQuestions{grid-template-columns:1fr}.boostSimpleMetrics{grid-template-columns:1fr}.boostStrengthTop{align-items:flex-start;flex-direction:column}}
 @media print{.boostEvidenceDetails>summary{display:none!important}.boostEvidenceDetails>#reportBody{display:block!important}.boostReportNext button{display:none!important}}
 `;d.head.appendChild(s);
}

function setupHero(d){
 const hero=first(d,'.hero');if(!hero)return;
 const h1=first(hero,'h1');if(h1)setText(h1,'Where Can My Experience Take Me?');
 const p=first(hero,'p');if(p)setText(p,'You may already have more career options than you realize. BOOST will help you see what you already bring, where those strengths may have value now, and what you may want to build next.');
 const brand=first(hero,'.brand');if(brand)setText(brand,'BOOST • Module 3 • Career Mobility');
}

function setupIntro(d){
 let panel=findByText(d,'section.panel.noPrint',/career can grow like a honeycomb/i);if(!panel||panel.dataset.boostCustomerIntro)return;
 panel.dataset.boostCustomerIntro='1';
 panel.innerHTML=`<div class="boostM3Intro"><div class="boostM3Eyebrow">Start Here</div><h2>Your experience can travel.</h2><p>Jobs have different titles, but many use the same kinds of skills and experiences. In this activity, we'll look at what you already bring, careers you may be able to pursue now, and careers that may take a little more preparation. <b>You don't need to understand job codes, career clusters, or workforce terminology.</b> BOOST will handle that part.</p><div class="boostFourQuestions"><div class="boostQuestion"><b>What do I already bring?</b><span>Recognize the experience and strengths you've already built.</span></div><div class="boostQuestion"><b>What could I do now?</b><span>See careers where your existing experience may already have value.</span></div><div class="boostQuestion"><b>Where could I move?</b><span>Explore careers where what you've learned may transfer.</span></div><div class="boostQuestion"><b>What might I need to build?</b><span>See which goals may take some additional preparation.</span></div></div><button class="boostStartBtn" type="button">SHOW ME WHAT I BRING →</button></div>`;
 first(panel,'.boostStartBtn')?.addEventListener('click',()=>d.getElementById('setup')?.scrollIntoView({behavior:'smooth',block:'start'}));
}

function setupStartingPoint(d){
 const p=d.getElementById('setup');if(!p||p.dataset.boostCustomerSetup)return;p.dataset.boostCustomerSetup='1';
 setText(first(p,'.step'),'Step 1 • Start With Where You Are');setText(first(p,'h2'),'Start With Where You Are');
 const occLabel=findByText(p,'label',/what do you do now|most recently/i);if(occLabel)setText(occLabel,'What kind of work are you doing now, or what have you done most recently?');
 const noteLabel=findByText(p,'label',/optional note/i);if(noteLabel)setText(noteLabel,'Anything about that work you want BOOST to know? (optional)');
 const wageLabel=findByText(p,'label',/hourly wage/i);if(wageLabel.innerHTML='Current or last hourly wage <span class="muted">(optional — helps compare opportunities)</span>';
 const load=d.getElementById('loadSkills');if(load)setText(load,'SHOW ME WHAT I BRING →');
 const selected=d.getElementById('selectedOcc');if(selected&&!d.getElementById('boostM3StartCoach')){const coach=d.createElement('div');coach.id='boostM3StartCoach';coach.className='boostCoach';coach.innerHTML='<b>Rosie • BOOST Guide</b><br>Your job title is only the starting point. Next, we’ll look at the things you’ve actually done — because those experiences can have value in more than one kind of work.';selected.insertAdjacentElement('afterend',coach)}
}

function setupSkills(d){
 const p=d.getElementById('skills');if(!p)return;
 setText(first(p,'.step'),'Step 2 • What Do You Already Bring?');setText(first(p,'h2'),'What Do You Already Bring?');
 const sub=first(p,'.sub');if(sub)setText(sub,'Think about everything you have done — paid work, military service, volunteering, caregiving, school, side work, or other responsibilities. Tell BOOST how often you have actually used each experience.');
 const guide=first(p,'.capabilityGuide');if(guide&&!guide.dataset.boostCustomerGuide){guide.dataset.boostCustomerGuide='1';const gp=first(guide,'p');if(gp)setText(gp,'There are no perfect answers here. We are simply identifying experience you can carry with you.');}
 let counter=d.getElementById('boostM3StrengthCounter');if(!counter){counter=d.createElement('div');counter.id='boostM3StrengthCounter';counter.innerHTML='<div class="boostStrengthTop"><span>My Experience Toolkit</span><span data-boost-strength-count>0 strengths identified</span></div><div class="boostStrengthTrack"><div class="boostStrengthFill" data-boost-strength-fill style="width:0%"></div></div><div class="boostStrengthMessage" data-boost-strength-message>Choose the answer that best reflects your real experience.</div>';const grid=d.getElementById('skillgrid');grid?.insertAdjacentElement('beforebegin',counter)}
 const cont=d.getElementById('continueBtn');if(cont)setText(cont,'SHOW ME WHERE THESE CAN TAKE ME →');
 relabelSkillChoices(d);updateStrengthCounter(d);
}

function relabelSkillChoices(d){
 all(d,'#skillgrid input[type="radio"][name^="sk"]').forEach(inp=>{
   const lab=inp.closest('label');if(!lab||lab.dataset.boostRelabeled)return;lab.dataset.boostRelabeled='1';
   const map={'Used Regularly':'Yes — I use this often','Used Sometimes':'Sometimes','Limited Experience':'Not much yet','Not Sure':'Not sure'};
   const text=map[inp.value]||inp.value;lab.childNodes.forEach(n=>{if(n.nodeType===3)n.nodeValue=''});lab.appendChild(d.createTextNode(' '+text));
 });
 all(d,'#skillgrid .skillcard').forEach(card=>{const p=findByText(card,'p',/what it means:/i);if(p&&p.innerHTML)p.innerHTML=p.innerHTML.replace(/What it means:/i,'In everyday terms:');const ex=first(card,'.example');if(ex&&ex.innerHTML)ex.innerHTML=ex.innerHTML.replace(/Think about your work:/i,"Think about where you've used this:")});
}

function updateStrengthCounter(d){
 const radios=all(d,'#skillgrid input[type="radio"][name^="sk"]');if(!radios.length)return;
 const names=[...new Set(radios.map(x=>x.name))],checked=names.map(n=>d.querySelector(`input[name="${n}"]:checked`)).filter(Boolean);
 const strengths=checked.filter(x=>x.value==='Used Regularly'||x.value==='Used Sometimes').length,total=names.length,answered=checked.length,pct=total?Math.round(answered/total*100):0;
 const count=d.querySelector('[data-boost-strength-count]'),fill=d.querySelector('[data-boost-strength-fill]'),msg=d.querySelector('[data-boost-strength-message]');
 if(count)count.textContent=`${strengths} ${strengths===1?'strength':'strengths'} identified`;if(fill)fill.style.width=pct+'%';
 if(msg)msg.textContent=answered===total&&total?`You already bring ${strengths} transferable ${strengths===1?'strength':'strengths'}. Let’s see where ${strengths===1?'it can':'they can'} take you.`:`${answered} of ${total} experiences reviewed. Keep going — your toolkit is taking shape.`;
}

function setupDecision(d){
 const p=d.getElementById('decision');if(!p)return;
 setText(first(p,'.step'),'Step 3 • Choose What You Want to Explore');setText(first(p,'h2'),'How do you want to look at your options?');
 const choices=all(p,'.choice');
 if(choices[0]){setText(first(choices[0],'.mode'),'OPEN TO POSSIBILITIES');setText(first(choices[0],'h3'),'See Where My Experience Can Take Me');setText(first(choices[0],'p'),'I’m open to possibilities. Show me careers where what I already bring may have value.');const b=d.getElementById('openMode');if(b)setText(b,'SHOW ME MY OPTIONS')}
 if(choices[1]){setText(first(choices[1],'.mode'),'I HAVE A CAREER IN MIND');setText(first(choices[1],'h3'),'Explore a Career I Already Have in Mind');setText(first(choices[1],'p'),'Keep this career in the comparison and show me how my experience, interests, and local opportunity line up — plus other options worth seeing.');const b=d.getElementById('targetMode');if(b)setText(b,'CHECK THIS CAREER')}
}

function translateVisibleLanguage(root){
 if(!root)return;
 const reps=[
  [/WORK NOW \/ occupationally adjacent/gi,'WORK NOW'],
  [/occupationally adjacent/gi,'similar work'],
  [/Occupationally Adjacent/g,'Similar Work'],
  [/occupational similarity/gi,'how much of your experience transfers'],
  [/occupational value/gi,'what your experience already gives you'],
  [/Immediate Mobility/g,'What You Already Bring'],
  [/Career Fit/g,'Overall Fit'],
  [/Interest Alignment/g,'Matches Your Interests'],
  [/interest alignment/g,'match to your interests'],
  [/Transferable Skill Alignment/g,'What You Already Bring'],
  [/transferable-skill alignment/g,'what you already bring'],
  [/transferable skill alignment/g,'what you already bring'],
  [/preference signal/gi,'interest match'],
  [/Preparation Distance/g,'What You May Need to Build'],
  [/preparation distance/gi,'what you may need to build'],
  [/Preparation signal/g,'Preparation'],
  [/Regional jobs/g,'Jobs in this region'],
  [/Projected growth/g,'Future outlook'],
  [/25th percentile/g,'Typical starting wage'],
  [/CREATE MY CAREER MOBILITY PLAN/g,'CREATE MY MOBILITY STORY'],
  [/UPDATE MY CAREER MOBILITY/g,'UPDATE MY OPTIONS'],
  [/BACK TO EXPLORATION CHOICES/g,'BACK TO MY OPTIONS']
 ];
 const walker=root.ownerDocument.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
 while((n=walker.nextNode())){const parent=n.parentElement;if(!parent||/^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(parent.tagName))continue;let v=n.nodeValue,next=v;reps.forEach(([r,to])=>next=next.replace(r,to));if(next!==v)n.nodeValue=next}
}

function metric(card,re){
 for(const row of all(card,'.compareMetric,.analysisCell')){const t=clean(row.textContent);if(re.test(t)){const b=first(row,'b');if(b)return clean(b.textContent);const m=t.match(/(?:\s|:)(\$?[\d,.]+%?(?:\/hr)?|Strong|Some|Limited|Established|Closer \/ Accessible|Development Needed)\s*$/i);if(m)return m[1]}}
 const t=clean(card.textContent),m=t.match(re);return m&&m[1]?clean(m[1]):'';
}
function scoreWord(v){const n=parseFloat(String(v).replace(/[^\d.\-]/g,''));if(!Number.isFinite(n))return v||'';if(n>=70)return'Strong';if(n>=55)return'Some';return'Less';}
function opportunityWord(card){const t=clean(card.textContent);if(/\bH3\b|\b3H\b|Strong Regional Opportunity/i.test(t))return'Strong';if(/\bH2\b|\b2H\b|Established Regional Opportunity/i.test(t))return'Established';if(/\+H\b|Limited Regional/i.test(t))return'Limited';if(/regional opportunity/i.test(t))return'Review';return''}

function enhanceCareerCards(d){
 all(d,'#cards .card').forEach(card=>{
  if(card.dataset.boostCustomerCard)return;card.dataset.boostCustomerCard='1';card.classList.add('boostCustomerCard');
  const title=first(card,'h3');if(!title)return;
  const skill=metric(card,/What You Already Bring\s*([\d.]+)?/i)||metric(card,/Transferable[^\d]*([\d.]+)/i);
  const interest=metric(card,/Matches Your Interests\s*([\d.]+)?/i)||metric(card,/Interest[^\d]*([\d.]+)/i);
  const wage=metric(card,/Typical starting wage\s*(\$?[\d,.]+(?:\/hr)?)/i)||metric(card,/25th percentile\s*(\$?[\d,.]+(?:\/hr)?)/i);
  const opp=opportunityWord(card);
  const metrics=d.createElement('div');metrics.className='boostSimpleMetrics';
  const vals=[['What you already bring',scoreWord(skill)],['Matches your interests',scoreWord(interest)],['Regional opportunity',opp],['Typical starting wage',wage]].filter(x=>x[1]);
  metrics.innerHTML=vals.map(([k,v])=>`<div class="boostSimpleMetric"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  if(vals.length)title.insertAdjacentElement('afterend',metrics);
  const toggle=d.createElement('button');toggle.type='button';toggle.className='boostEvidenceToggle';toggle.setAttribute('aria-expanded','false');toggle.textContent='SEE THE EVIDENCE ↓';
  toggle.addEventListener('click',()=>{const on=card.classList.toggle('boostShowEvidence');toggle.setAttribute('aria-expanded',String(on));toggle.textContent=on?'HIDE THE EVIDENCE ↑':'SEE THE EVIDENCE ↓'});
  if(vals.length)metrics.insertAdjacentElement('afterend',toggle);else title.insertAdjacentElement('afterend',toggle);
 });
}

function setupResults(d){
 const p=d.getElementById('results');if(!p)return;
 const step=first(p,'.step');if(step)setText(step,'Step 4 • See Where Your Experience Can Take You');
 const note=findByText(p,'.note',/how to read the evidence/i);if(note&&!note.dataset.boostCustomerNote){note.dataset.boostCustomerNote='1';note.className='boostCoach';note.innerHTML='<b>Rosie • BOOST Guide</b><br>You do not need to study every score. Start with the three routes below. BOOST has done the detailed comparison in the background, and you can open <b>See the evidence</b> whenever you want the details.'}
 if(!d.getElementById('boostMobilityMap')){
  const map=d.createElement('div');map.id='boostMobilityMap';map.className='boostMobilityMap';map.innerHTML='<h3>Your Mobility Map</h3><p>These are different ways your experience may create options. They are not instructions or a required ladder.</p><div class="boostRouteTrack"><div class="boostRoute start"><b>WHERE I AM NOW</b><span>Your current or recent experience.</span></div><div class="boostRouteArrow">→</div><div class="boostRoute"><b>WORK NOW</b><span>Careers where your existing experience may already have value.</span></div><div class="boostRoute"><b>MOVE NOW</b><span>Careers where what you’ve learned may help you make a move.</span></div><div class="boostRoute"><b>BUILD TOWARD</b><span>Careers that interest you but may require something more.</span></div></div>';
  const cards=d.getElementById('cards');cards?.insertAdjacentElement('beforebegin',map);
 }
 translateVisibleLanguage(p);enhanceCareerCards(d);
}

function sectionNames(root,re){
 const h=all(root,'h2,h3').find(x=>re.test(clean(x.textContent)));if(!h)return[];let n=h.nextElementSibling,names=[];
 while(n&&!/^H[23]$/.test(n.tagName)){names.push(...all(n,'.compareCard h3,.demoCard b').map(x=>clean(x.textContent)));if(n.matches?.('.compareGrid'))names.push(...all(n,'h3').map(x=>clean(x.textContent)));n=n.nextElementSibling}
 return [...new Set(names.filter(Boolean))].slice(0,3);
}
function selectedStrengths(d){return all(d,'#skillgrid .skillcard').map(card=>{const c=first(card,'input[type="radio"]:checked');if(!c||!(c.value==='Used Regularly'||c.value==='Used Sometimes'))return'';return clean(first(card,'h3')?.textContent)}).filter(Boolean).slice(0,5)}
function topInterests(readJourney){try{const j=readJourney?.()||{},s=j.modules?.module1?.interestScores||{};return Object.entries(s).filter(([,v])=>Number.isFinite(Number(v))).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,3).map(([k])=>INTEREST_NAMES[k]||k)}catch(_){return[]}}

function enhanceReport(d,readJourney){
 const section=d.getElementById('reportSection'),report=d.getElementById('report'),body=d.getElementById('reportBody');if(!section||!report||!body||section.classList.contains('hidden'))return;
 setText(first(report,'.step'),'BOOST • Module 3');setText(first(report,'h2'),'My Career Mobility Story');const sub=first(report,'.sub');if(sub)setText(sub,'Here is the simple story of where you are, what you already bring, and where your experience may take you.');
 translateVisibleLanguage(body);
 let details=d.getElementById('boostM3EvidenceDetails');if(!details){details=d.createElement('details');details.id='boostM3EvidenceDetails';details.className='boostEvidenceDetails';const sum=d.createElement('summary');sum.textContent='View My Detailed Evidence';body.parentNode.insertBefore(details,body);details.appendChild(sum);details.appendChild(body)}
 let summary=d.getElementById('boostM3StorySummary');if(!summary){summary=d.createElement('div');summary.id='boostM3StorySummary';summary.className='boostStorySummary';details.insertAdjacentElement('beforebegin',summary)}
 const current=clean(d.getElementById('occSearch')?.value)||'My current or recent work';
 const strengths=selectedStrengths(d),work=sectionNames(body,/WORK NOW/i),move=sectionNames(body,/MOVE NOW/i),build=sectionNames(body,/BUILD TOWARD/i),interests=topInterests(readJourney);
 const cards=[
  ['Where I am now',current],
  ['What I already bring',strengths.length?strengths.join(', '):'Transferable experience I confirmed in this activity'],
  ['What I could pursue now',work.length?work.join(', '):'See the detailed evidence for the options BOOST surfaced'],
  ['Where I could move',move.length?move.join(', '):'My transferable experience may open additional options'],
  ['What I may need to build',build.length?`Additional preparation may be useful for ${build.join(', ')}`:'BOOST will flag meaningful preparation needs before any training decision'],
  ['What interests me',interests.length?interests.join(', '):'My O*NET interests remain part of the comparison']
 ];
 summary.innerHTML='<div class="boostStoryLead"><b>You may already have more options than you realized.</b> BOOST compared your experience with the careers you explored and the local labor market. The detailed calculations are still available below, but this is the part to take with you.</div><div class="boostStoryGrid">'+cards.map(([k,v])=>`<div class="boostStoryCard"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')+'</div>';
 let next=d.getElementById('boostM3ReportNext');if(!next){next=d.createElement('div');next.id='boostM3ReportNext';next.className='boostReportNext';next.innerHTML='<b>Rosie • BOOST Guide</b><br>You don’t have to decide everything here. BOOST will carry what you learned into <b>Decide</b>, where you can look at what makes sense next.<br><button type="button" class="btn">SAVE MY STORY &amp; CONTINUE →</button>';const reflection=first(report,'.reportbox');(reflection||details).insertAdjacentElement('afterend',next);first(next,'button')?.addEventListener('click',()=>{try{window.parent.document.getElementById('finishBtn')?.click()}catch(_){}})}
}

function inject(frame,readJourney){
 if(!frame?.contentDocument)return;const d=frame.contentDocument;if(!d.body||d.body.dataset.boostM3Customer)return;d.body.dataset.boostM3Customer='1';d.body.classList.add('boostM3Customer');
 addStyles(d);setupHero(d);setupIntro(d);setupStartingPoint(d);setupSkills(d);setupDecision(d);setupResults(d);enhanceReport(d,readJourney);translateVisibleLanguage(d.body);
 d.addEventListener('change',e=>{if(e.target?.matches?.('#skillgrid input[type="radio"][name^="sk"]'))updateStrengthCounter(d)},true);
 let pending=false;const refresh=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;setupSkills(d);setupDecision(d);setupResults(d);enhanceReport(d,readJourney);translateVisibleLanguage(d.body)})};
 const obs=new MutationObserver(refresh);obs.observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}

window.BOOSTModule3Customer={inject};
})();