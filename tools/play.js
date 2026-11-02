// 自動対戦：組閣→案件→地図（全自動）を12月の結末まで進め、エラーと結果を出す。usage: node tools/play.js <index.htmlの絶対パス> <seed> <撮影の頭>  env: LIM=ミリ秒 TR=1 で手順表示 MODE=smart で狙い撃ち（9月から、ふつうの遊説・開発を接戦区へ振り向ける。既定は auto＝ゲームの全自動） DIFF=easy|normal|hard で難易度 FAST=自動進行の待ちを何分の1にするか（既定8、1で従来どおり） 11月などに大臣が辞めて後任の任命（kaizo）が出たら ◎ の人を起用。PICK=fa で案件の選択肢をゲームの faEventPick（国庫の赤字も見る）で選ぶ（既定は一番上） RULE=<変則ルールid> TAG=<口ぐせid> GOAL=<国家目標id> VOW=<一枚札id> でその札を選ぶ（結果の fin に rule・tag・goal・vow）
const {chromium}=require('playwright');
(async()=>{const [file,seed,shot]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const FAST=+process.env.FAST||8;const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.addInitScript(s=>{let x=+s||1;Math.random=()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296};},seed);
await p.goto('file://'+file);await p.waitForTimeout(1200);
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});await p.reload();await p.waitForTimeout(1200);
if(process.env.DIFF)await p.evaluate(d=>{diff=d},process.env.DIFF);
await p.evaluate(F=>{if(F>1&&typeof faWait==='function'){const o=faWait;faWait=(k,ms)=>o(k,ms/F)}},FAST);
await p.screenshot({path:shot+'-title.png'});
const BL=['#setBtn','#howBtn','#book','#faStop','#kantei','#pp','#spd','#viewCab','#recTap','#back','#bkBack','#backMap','#cancelKaizo','#cancelSel','#again','#re','#share'];
let steps=0,shots={},t0=Date.now(),last='';
while(Date.now()-t0<(+process.env.LIM||600000)){steps++;
 const st=await p.evaluate(()=>typeof S!=='undefined'&&S?{done:!!S.done,fall:S.fall||'',ph:S.phase,view:S.view,m:S.month,fa:!!S.fullAuto,d:Math.round(S.day||0),pa:!!S.paused,pe:S.pend,bt:!!S.banter,sp:S.speed}:null);
 if(st&&st.done&&(st.fall||await p.$('#seatCount'))){await p.waitForTimeout(2500);break}
 if(st&&!shots[st.ph]&&st.ph){shots[st.ph]=1;await p.screenshot({path:shot+'-'+st.ph+'.png'})}
 const clicked=await p.evaluate(([BL,MODE,ENV])=>{const vis=e=>e&&e.offsetParent&&!e.disabled&&!e.hidden;
  const pick=s=>[...document.querySelectorAll(s)].find(vis);
  if(S&&S.phase==='map'&&!S.fullAuto){const f=pick('#fullAuto');if(f){f.click();return 'fullAuto'}}
  if(S&&S.phase==='map'&&S.fullAuto){S.speed=4;try{DAY_SEC=0.3}catch(e){}
   if(MODE==='smart'&&!S.pend&&!S.banter&&S.month>=9){/* 狙い撃ち：9月から。危機の対処・西軍との論戦・説得・外遊はゲームの全自動の選択に任せ、ふつうの遊説・開発だけを接戦区へ振り向ける（同じ地方に固まらないよう、送った数の少ない接戦区から順に） */
    let L=[];try{L=sekRegs()}catch(e){}
    if(L.length){const load={};for(const P of Object.values(S.pc)){const t=P.task;if(t&&t.r)load[t.r]=(load[t.r]||0)+1}
     for(const k of Object.keys(S.pc)){const P=S.pc[k];if(P.task||(P.path&&P.path.length))continue;if(S.auto&&!S.auto[k])continue;
      const b=autoPick(k);if(!b)continue;let r=b.r,a=b.a;
      const keep=['fix','scout','gaiyu','ninja'].includes(a.id)||(a.id==='rally'&&oppIn(r).length)||L.some(x=>x.r===r);
      if(!keep){const x=[...L].sort((p,q)=>(load[p.r]||0)-(load[q.r]||0)||q.sw-p.sw)[0];const A=actionsFor(k,x.r);const ra=A.find(y=>y.id==='rally');if(ra){r=x.r;a=ra}}
      dispatch(k,r,a,true);P.task.dur*=1.3;P.task.auto=1;load[r]=(load[r]||0)+1}}}
   return ''}
  /* env RULE・TAG：組閣画面（#go が見えている間）で変則ルール・口ぐせを選ぶ。ボタンが無ければ変数を直接入れる */
  if(pick('#go')){for(const [v,sel,nm] of [[ENV.RULE,'data-rule','ruleSel'],[ENV.TAG,'data-pmtag','pmTag']]){if(!v)continue;let cur='';try{cur=eval(nm)}catch(e){}if(cur===v)continue;
    const b=pick(`[${sel}="${v}"]`);if(b){b.click();return sel+'='+v}try{eval(nm+'='+JSON.stringify(v))}catch(e){}}}
  /* env GOAL・VOW：その id の札があれば最初の物の代わりに押す */
  const G=ENV.GOAL&&pick(`[data-goal="${ENV.GOAL}"]`);if(G){G.click();return 'goal='+ENV.GOAL}
  const V=ENV.VOW&&pick(`[data-vow="${ENV.VOW}"]`);if(V){V.click();return 'vow='+ENV.VOW}
  if(S&&S.view==='kaizo'){/* 後任の任命（大臣が辞めて空席）：◎（派閥に合う）の人を先に、いなければ先頭。任意の改造なら「やめる」 */const N=[...document.querySelectorAll('[data-new]')].filter(vis);const n=N.find(e=>e.querySelector('.kz-m.ok'))||N[0];if(n){n.click();return 'kaizo:'+n.dataset.new}const ck=pick('#cancelKaizo');if(ck){ck.click();return '#cancelKaizo'}}
  for(const s of ['[data-goal]','[data-focus]','[data-pet]','[data-fq]','[data-kj]','[data-kf]','[data-vow]','.choice','#toPolicy','#go','#autoCab','#next','#resume']){if(s==='.choice'&&ENV.PICK==='fa'&&typeof faEventPick==='function'&&pick('.choice[data-i]')){let i=0;try{i=faEventPick()}catch(x){}const c=[...document.querySelectorAll('.choice[data-i="'+i+'"]')].find(vis);if(c){c.click();return '.choice:fa'+i}}const e=pick(s);if(e){e.click();return s}}
  const e=[...document.querySelectorAll('button')].find(e=>vis(e)&&!BL.some(s=>e.matches(s)));if(e){e.click();return 'btn:'+(e.id||e.innerText.slice(0,12))}return '';},[BL,process.env.MODE||'auto',{PICK:process.env.PICK||'',RULE:process.env.RULE||'',TAG:process.env.TAG||'',GOAL:process.env.GOAL||'',VOW:process.env.VOW||''}]);
 if(clicked)last=clicked; if(process.env.TR)console.log(steps,JSON.stringify(st),clicked);
 await p.waitForTimeout(clicked?(FAST>1?120:250):(FAST>1?300:800));}
const fin=await p.evaluate(()=>({diff:S.diff,done:S.done,fall:S.fall||'',seats:S.seats,month:S.month,br:(()=>{try{const R=S.regRes||[];const reg=R.reduce((a,x)=>a+x.w,0);const pr=S.pledgeRes||[];const ok=pr.filter(x=>x.ok).length;return {reg,dif:DIFF[S.diff||'normal'].seat,pl:ok*10-(pr.length-ok)*8+(pr.length&&ok===pr.length?6:0),bill:Object.values(S.bills||{}).filter(b=>b.st==='passed').length*2,kok:S.kokko<0?-10:0,sup:S.st&&S.st.sup,opp:S.opp}}catch(e){return null}})(),img:document.querySelectorAll('img').length,bgi:Object.keys(BGI).length,imgk:Object.keys(IMG).length,rule:S.rule||'',tag:S.tag||'',goal:S.goal||'',vow:S.vow||''}));
await p.screenshot({path:shot+'-end.png'});
console.log(JSON.stringify({seed,fin,steps,secs:Math.round((Date.now()-t0)/1000),last,errs:errs.slice(0,5)}));await b.close()})();
