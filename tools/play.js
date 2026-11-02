// 自動対戦：組閣→案件→地図（全自動）を12月の結末まで進め、エラーと結果を出す。usage: node tools/play.js <index.htmlの絶対パス> <seed> <撮影の頭>  env: LIM=ミリ秒 TR=1 で手順表示 MODE=smart で狙い撃ち（9月から、ふつうの遊説・開発を接戦区へ振り向ける。既定は auto＝ゲームの全自動） DIFF=easy|normal|hard で難易度 FAST=自動進行の待ちを何分の1にするか（既定8、1で従来どおり） PICK=fa で案件の選択肢をゲームの faEventPick（国庫の赤字も見る）で選ぶ（既定は一番上） OL=<西軍党首id> で7月の党首選をその人に固定（fin に ol） RULE=<変則ルールid> TAG=<口ぐせid> GOAL=<国家目標id> VOW=<一枚札id> でその札を選ぶ（結果の fin に rule・tag・goal・vow） KANTEI=1（POLICY=1 も同じ）で地図の月ごとに1回、官邸の政務を使う（審議中が2本未満なら可決の見込みが一番高い法案を提出→票固め・綱紀粛正→残りの政治資本で一番低い指標を上げる指令。国庫が年末まで赤字にならない物だけ（法案は毎月の国庫負担を見込む）。結果の fin に bills＝成立数・cmds＝使った指令の数）
const {chromium}=require('playwright');
(async()=>{const [file,seed,shot]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const FAST=+process.env.FAST||8;const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await p.addInitScript(s=>{let x=+s||1;Math.random=()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296};},seed);
await p.goto('file://'+file);await p.waitForTimeout(1200);
await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});await p.reload();await p.waitForTimeout(1200);
if(process.env.DIFF)await p.evaluate(d=>{diff=d},process.env.DIFF);
/* env OL=<西軍党首id>：7月の党首選を必ずその党首に（難しさの測り比べ用。mitsunari なら続投） */
if(process.env.OL)await p.evaluate(K=>{if(typeof OLEAD==='undefined'||!OLEAD[K])return;oppLeadElect=function(L){if(S.month!==7||S.oppLead)return;const g=K==="mitsunari"?2:5;S.oppLead={k:K,m:S.month};S.oppLeadPend=1;S.oppOrder=[K,...S.oppOrder.filter(x=>x!==K)];S.opp=clamp(S.opp+g);L.push([`西軍党の党首選（${OPP[K].n}・固定）`,`勢い+${g}`]);S.log.push([S.month,`西軍党首選：${OPP[K].n}（固定）`])}},process.env.OL);
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
  /* env KANTEI=1：地図（全自動）の月ごとに1回、官邸の政務を関数で直に使う（画面は地図のまま。#kantei ボタンは押さない） */
  if(ENV.KANTEI&&S&&S.phase==='map'&&S.fullAuto&&S.view==='main'&&!S.done&&S.pend==null&&!S.banter&&window.__kt!==S.month){window.__kt=S.month;const did=[];
   try{const deb=BILLS.filter(b=>S.bills[b.id]&&S.bills[b.id].st==='debate').length;
    if(deb<2&&S.ap>=2&&!S.used.includes('houan')){const pcSum=BILLS.filter(b=>S.bills[b.id]&&S.bills[b.id].st!=='failed').reduce((a,b)=>a+(b.pc||0),0);const c=BILLS.filter(b=>!S.bills[b.id]&&S.month+b.m<=11&&S.kokko+(pcSum+(b.pc||0))*(12-S.month)>=5).sort((a,b)=>passProb(b)-passProb(a))[0];
     if(c&&passProb(c)>=.45){submitBill(c.id);did.push('bill:'+c.id)}}
    const tryCmd=id=>{const c=CMDS.find(x=>x.id===id);if(!c)return false;const {ap,kk}=cmdCost(c);if(S.ap<ap||S.used.includes(id)||(c.once&&S.once.includes(id))||S.kokko+kk<5)return false;
     if(c.sosaiOnly&&!hyogaOk())return false;if(c.manOnly&&!manOn())return false;const a0=S.ap;doCmd(id);if(S.ap<a0){did.push(id);return true}return false};
    tryCmd('hyoga');tryCmd('kouki');
    for(let n=0;n<6&&S.ap>0&&!S.done;n++){const st=S.st||{};const ks=['sup','eco','wel','dip','saf','coh'].sort((a,b)=>(st[a]??50)-(st[b]??50));let ok=false;
     for(const k of ks){const L=CMDS.filter(c=>c.d&&c.d[k]>0&&!['shuno','houan','kaizo','hyoga','kouki','kokusai','chosa'].includes(c.id)).sort((a,b)=>(b.d[k]||0)-(a.d[k]||0));
      for(const c of L){if(tryCmd(c.id)){ok=true;break}}if(ok)break}
     if(!ok)break}
   }catch(e){did.push('err:'+e.message)}
   S.view='main';render();window.__kcmd=(window.__kcmd||0)+did.length;return 'kantei['+did.join(',')+']'}
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
  /* 大臣が去った後の後任の任命（view kaizo）：候補 [data-new] を押す（押さないと上の「支持率」ボタンを押し続けて止まる） */
  for(const s of ['[data-new]','[data-goal]','[data-focus]','[data-pet]','[data-fq]','[data-kj]','[data-kf]','[data-vow]','.choice','#toPolicy','#go','#autoCab','#next','#resume']){if(s==='.choice'&&ENV.PICK==='fa'&&typeof faEventPick==='function'&&pick('.choice[data-i]')){let i=0;try{i=faEventPick()}catch(x){}const c=[...document.querySelectorAll('.choice[data-i="'+i+'"]')].find(vis);if(c){c.click();return '.choice:fa'+i}}const e=pick(s);if(e){e.click();return s}}
  const e=[...document.querySelectorAll('button')].find(e=>vis(e)&&!BL.some(s=>e.matches(s)));if(e){e.click();return 'btn:'+(e.id||e.innerText.slice(0,12))}return '';},[BL,process.env.MODE||'auto',{PICK:process.env.PICK||'',RULE:process.env.RULE||'',TAG:process.env.TAG||'',GOAL:process.env.GOAL||'',VOW:process.env.VOW||'',KANTEI:process.env.KANTEI||process.env.POLICY||''}]);
 if(clicked)last=clicked; if(process.env.TR)console.log(steps,JSON.stringify(st),clicked);
 await p.waitForTimeout(clicked?(FAST>1?120:250):(FAST>1?300:800));}
const fin=await p.evaluate(()=>({ol:S.oppLead?S.oppLead.k:'',diff:S.diff,done:S.done,fall:S.fall||'',seats:S.seats,month:S.month,br:(()=>{try{const R=S.regRes||[];const reg=R.reduce((a,x)=>a+x.w,0);const pr=S.pledgeRes||[];const ok=pr.filter(x=>x.ok).length;return {reg,dif:DIFF[S.diff||'normal'].seat,pl:ok*10-(pr.length-ok)*8+(pr.length&&ok===pr.length?6:0),bill:Object.values(S.bills||{}).filter(b=>b.st==='passed').length*2,kok:S.kokko<0?-10:0,sup:S.st&&S.st.sup,opp:S.opp}}catch(e){return null}})(),img:document.querySelectorAll('img').length,bgi:Object.keys(BGI).length,imgk:Object.keys(IMG).length,rule:S.rule||'',tag:S.tag||'',goal:S.goal||'',vow:S.vow||'',bills:Object.values(S.bills||{}).filter(b=>b.st==='passed').length,cmds:window.__kcmd||0}));
await p.screenshot({path:shot+'-end.png'});
console.log(JSON.stringify({seed,fin,steps,secs:Math.round((Date.now()-t0)/1000),last,errs:errs.slice(0,5)}));await b.close()})();
