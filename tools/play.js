// 自動対戦：組閣→案件→地図（全自動）を12月の結末まで進め、エラーと結果を出す。usage: node tools/play.js <index.htmlの絶対パス> <seed> <撮影の頭>  env: LIM=ミリ秒 TR=1 で手順表示 FAST=自動進行の待ちを何分の1にするか（既定8、1で従来どおり）
const {chromium}=require('playwright');
(async()=>{const [file,seed,shot]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const FAST=+process.env.FAST||8;const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.addInitScript(s=>{let x=+s||1;Math.random=()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296};},seed);
await p.goto('file://'+file);await p.waitForTimeout(1200);
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});await p.reload();await p.waitForTimeout(1200);
await p.evaluate(F=>{if(F>1&&typeof faWait==='function'){const o=faWait;faWait=(k,ms)=>o(k,ms/F)}},FAST);
await p.screenshot({path:shot+'-title.png'});
const BL=['#setBtn','#howBtn','#book','#faStop','#kantei','#pp','#spd','#viewCab','#recTap','#back','#bkBack','#backMap','#cancelKaizo','#cancelSel','#again','#re'];
let steps=0,shots={},t0=Date.now(),last='';
while(Date.now()-t0<(+process.env.LIM||600000)){steps++;
 const st=await p.evaluate(()=>typeof S!=='undefined'&&S?{done:!!S.done,ph:S.phase,view:S.view,m:S.month,fa:!!S.fullAuto,d:Math.round(S.day||0),pa:!!S.paused,pe:S.pend,bt:!!S.banter,sp:S.speed}:null);
 if(st&&st.done&&await p.$('#seatCount')){await p.waitForTimeout(2500);break}
 if(st&&!shots[st.ph]&&st.ph){shots[st.ph]=1;await p.screenshot({path:shot+'-'+st.ph+'.png'})}
 const clicked=await p.evaluate(BL=>{const vis=e=>e&&e.offsetParent&&!e.disabled&&!e.hidden;
  const pick=s=>[...document.querySelectorAll(s)].find(vis);
  if(S&&S.phase==='map'&&!S.fullAuto){const f=pick('#fullAuto');if(f){f.click();return 'fullAuto'}}
  if(S&&S.phase==='map'&&S.fullAuto){S.speed=4;try{DAY_SEC=0.3}catch(e){}return ''}
  for(const s of ['[data-goal]','[data-focus]','[data-pet]','[data-fq]','[data-kj]','[data-kf]','[data-vow]','.choice','#toPolicy','#go','#autoCab','#next','#resume']){const e=pick(s);if(e){e.click();return s}}
  const e=[...document.querySelectorAll('button')].find(e=>vis(e)&&!BL.some(s=>e.matches(s)));if(e){e.click();return 'btn:'+(e.id||e.innerText.slice(0,12))}return '';},BL);
 if(clicked)last=clicked; if(process.env.TR)console.log(steps,JSON.stringify(st),clicked);
 await p.waitForTimeout(clicked?(FAST>1?120:250):(FAST>1?300:800));}
const fin=await p.evaluate(()=>({done:S.done,fall:S.fall||'',seats:S.seats,month:S.month,img:document.querySelectorAll('img').length,bgi:Object.keys(BGI).length,imgk:Object.keys(IMG).length}));
await p.screenshot({path:shot+'-end.png'});
console.log(JSON.stringify({seed,fin,steps,secs:Math.round((Date.now()-t0)/1000),last,errs:errs.slice(0,5)}));await b.close()})();
