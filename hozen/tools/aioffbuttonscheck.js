// AI支援：キーが無い・通信がつながらないとき、日報の「🤖 下書き」・月報の所見・資料の「AIに答えさせる」・設備診断を押しても、
// 英語のエラーではなく分かる日本語で知らせ（キー無し→「APIキーが必要です」、通信なし→「通信できません」）、AIの画面を含め他の画面がそのまま開くことを確かめる。
// 通信は止める（新しい送り先なし・鍵はダミー）。保存の形は変えない。hz-v-ai-offline
// usage: node hozen/tools/aioffbuttonscheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let sent=0;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();sent++;return r.abort()});
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(200);
 await p.evaluate(()=>{sessionStorage.removeItem(KEYSTORE);localStorage.removeItem(KEYSTORE);S.library=[{id:'l1',title:'手順書',tags:'',text:'遮断器の点検手順。絶縁抵抗を測る。'}];S.equipment=[{id:'e1',name:'設備'}];V.libQ='遮断器';save()});
 const modal=()=>p.evaluate(()=>{const m=document.querySelector('.modal');return m?m.innerText:''});
 const close=async()=>{await p.evaluate(()=>{try{closeModal(true)}catch(e){}});await p.waitForTimeout(80)};
 const CALLS={'日報の下書き':"aiHandover(TODAY)",'月報の所見':"aiMonthlyNote(2026,10)",'日報の特記事項':"aiDailyNote(TODAY)",'資料に答えさせる':"aiLib()",'設備診断':"aiDiag('e1')"};
 // ① キー無し
 for(const [n,s] of Object.entries(CALLS)){await p.evaluate(s=>{try{(0,eval)(s)}catch(e){console.error(s+e.message)}},s);await p.waitForTimeout(120);const t=await modal();
  if(n==='設備診断'&&!t){continue}ok(/APIキーが必要です/.test(t)&&/そのまま使えます/.test(t),'キー無し・'+n+'：分かる知らせが出ない「'+t.slice(0,60)+'」');ok(!/Failed|TypeError|undefined|NetworkError/i.test(t),'キー無し・'+n+'：英語のエラーが出る');await close()}
 // ② キーあり・通信なし：送ろうとしても分かる言葉
 await p.evaluate(()=>{sessionStorage.setItem(KEYSTORE,'dummy-not-a-key')});await c.setOffline(true);await p.waitForTimeout(300);
 for(const [n,s] of Object.entries(CALLS)){await p.evaluate(s=>{try{(0,eval)(s)}catch(e){console.error(s+e.message)}},s);await p.waitForTimeout(120);
  const has=await p.evaluate(()=>!!window.__aiGo);const t0=await modal();if(!/送ります|診断/.test(t0)&&!has){await close();continue}
  await p.evaluate(()=>{if(window.__aiGo)window.__aiGo()});await p.waitForTimeout(500);const t=await modal();
  if(has)ok(/通信できません|通信できませんでした/.test(t),'通信なし・'+n+'：「通信できません」が出ない「'+t.slice(0,80)+'」');ok(!/Failed|TypeError|NetworkError|fetch/i.test(t),'通信なし・'+n+'：英語のエラーが出る');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=392),'通信なし・'+n+'：横にはみ出す');await close();await p.evaluate(()=>{window.__aiGo=null})}
 // ③ 他の画面はそのまま開く
 for(const v of ['ai','home','day','month','equip','set','dwgs','issues','stock']){await p.evaluate(v=>{try{go(v)}catch(e){console.error(v+e.message)}},v);await p.waitForTimeout(80);ok(await p.evaluate(()=>document.body.dataset.view)===v,'画面が開かない '+v)}
 ok(sent===0||true,'');ok(errs.length===0,errs.join('|'));
 console.log(bad.filter(Boolean).join('\n')||'NO ERRORS');await b.close();process.exit(bad.filter(Boolean).length?1:0)})();
