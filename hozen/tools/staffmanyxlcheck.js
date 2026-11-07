// 人員・資格：40 人・1 人 10 資格（長い名前）で、390px・文字「標準」「特大」でも横にはみ出さず、資格の期限が切れた人・近い人が上に（近い順）来て、ほかの人は今までの順のまま。
// 行を押すとその人の資格の窓が開く。名前は「職員N」の形だけ。保存の形は変えない（hz-v-staff-many-xl）。
// usage: node hozen/tools/staffmanyxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const exp=await p.evaluate(f=>{S.settings.fscale=f;const Q=[...Array(10)].map((_,k)=>'第'+(k+1)+'種の長い名前の資格（高圧受変電設備の保守点検に要るもの）');
  S.quals={};S.qualExp={};for(let i=1;i<=40;i++){const n='職員'+i;S.quals[n]=Q.slice();}
  // 期限：職員30 は切れ（-5日）、職員12 は あと10日、職員5 は あと40日、職員20 は 200日先（上に来ない）
  const T=TODAY;S.qualExp['職員30']={[Q[0]]:addD(T,-5)};S.qualExp['職員12']={[Q[1]]:addD(T,10)};S.qualExp['職員5']={[Q[2]]:addD(T,40)};S.qualExp['職員20']={[Q[3]]:addD(T,200)};
  save();applyFScale();go('staff');return ['職員30','職員12','職員5']},fs);await p.waitForTimeout(300);
 const before=await p.evaluate(()=>JSON.stringify([S.quals,S.qualExp]));
 const r=await p.evaluate(()=>{const card=[...document.querySelectorAll('#app .card')].find(x=>/人員・資格/.test((x.querySelector('h2')||{textContent:''}).textContent));
  const it=[...card.querySelectorAll('.item')];const nm=it.map(x=>((x.querySelector('.ti')||{}).firstChild||{textContent:''}).textContent.trim());
  const over=it.filter(x=>x.scrollWidth>x.clientWidth+2||x.getBoundingClientRect().right>392).length;return {nm,over,sw:document.documentElement.scrollWidth}});
 const q=r.nm.filter(n=>/^職員\d+$/.test(n));if(q.length<40)bad.push(tag+'40人出ない '+q.length);
 if(q.slice(0,3).join(',')!==exp.join(','))bad.push(tag+'期限の近い人が上に来ない '+q.slice(0,5).join(','));
 const rest=q.slice(3).map(n=>+n.slice(2));if(rest.some((v,i)=>i&&v<rest[i-1]))bad.push(tag+'ほかの人の順が変わった');
 if(r.over)bad.push(tag+'行がはみ出す '+r.over);if(r.sw>392)bad.push(tag+'はみ出す '+r.sw);
 await p.evaluate(()=>{const card=[...document.querySelectorAll('#app .card')].find(x=>/人員・資格/.test((x.querySelector('h2')||{textContent:''}).textContent));card.querySelectorAll('.item')[1].click()});await p.waitForTimeout(300);
 const m=await p.evaluate(()=>({on:document.querySelector('#mask').classList.contains('on'),t:document.querySelector('#modal').textContent.slice(0,200),sw:document.documentElement.scrollWidth}));
 if(!m.on||!/職員12/.test(m.t))bad.push(tag+'押してもその人の窓が開かない');
 const after=await p.evaluate(()=>JSON.stringify([S.quals,S.qualExp]));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
