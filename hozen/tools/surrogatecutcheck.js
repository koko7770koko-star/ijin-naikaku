// 絵文字・異体字（2 つで 1 字）を含む文を上限で切るとき（保存の上限 txt・ホームの申し送り 400 字・修正履歴 1000 字・AI の 200 字・AI の処置 200 字・記録の削除の履歴・QR の番号）、
// 半端な片方が残って「�」にならないか（hz-v-surrogate-cut）。保存の形は変えない。外への通信は止める。usage: node hozen/tools/surrogatecutcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const lone=s=>/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s);const R={};
  // ① txt の上限ちょうどに絵文字がまたがる
  R.txt=[399,400,999].map(n=>lone(txt('あ'.repeat(n)+'🔥'+'い',n+1)));R.txtLen=txt('あ'.repeat(399)+'🔥',400).length;
  // ② 復元（validateData）で上限 3000 字の申し送りの境に絵文字
  const T=TODAY,v=validateData({...clone(S),handover:{[T]:{text:'あ'.repeat(2999)+'𠮷𠮷',by:'',at:''}}});R.restore=v.ok?lone(v.data.handover[T].text):'NG';
  // ③ ホームの申し送り（400 字で切る）
  window.save=()=>{};S.handover={[addD(T,-1)]:{text:'あ'.repeat(399)+'🔥🔥🔥',by:'',at:''}};go('home');R.home=lone(document.querySelector('#app').innerText);
  // ④ 修正履歴（1000 字で切る）
  S.history=[];logEdit('daily',T,'メモ','あ'.repeat(999)+'🔥🔥','x');const h=S.history[S.history.length-1];R.hist=h?lone(h.from):'none';
  // ⑤ AI の申し送り・月報の所見の下書きに渡す異常の処置（200 字で切る）（hz-v-dailyrep-print-emoji）
  let cap='';window.aiDraft=(t,q)=>{cap+=q};S.issues=[{id:'i_sg1',date:T,title:'漏電🔥',status:'対応中',priority:'高',action:'あ'.repeat(199)+'🔥🔥'}];
  aiHandover(T);R.aiHand=cap?lone(cap):'none';cap='';aiMonthlyNote(+T.slice(0,4),+T.slice(5,7));R.aiMonth=cap?lone(cap):'none';
  // ⑥ 日常点検の記録を消したときの修正履歴（JSON を 1000 字で切る）
  window.confirm=()=>true;S.daily[T]={note:'あ'.repeat(990)+'🔥🔥🔥'};delDay(T);const h2=S.history[S.history.length-1];R.delDay=h2&&h2.what==='記録の削除'||h2?lone(h2.from):'none';
  // ⑦ QR から設備を足すときの番号（30 字で切る）
  try{closeModal(true)}catch(e){}window.qrStop=()=>{};window.editEquip=()=>{};try{qrAddEquip('A'.repeat(29)+'🔥')}catch(e){}R.qr=typeof EQ_NEW_CODE==='string'?lone(EQ_NEW_CODE):'none';try{closeModal(true)}catch(e){}
  return R});
 console.log(JSON.stringify(r));
 if(r.txt.some(Boolean))bad.push('txt の切り口に半端な字が残る '+JSON.stringify(r.txt));if(r.txtLen!==399)bad.push('txt が上限を超える／足りない '+r.txtLen);
 if(r.restore!==false)bad.push('復元で申し送りの切り口に半端な字が残る '+r.restore);if(r.home)bad.push('ホームの申し送りに「�」の元が出る');if(r.hist!==false)bad.push('修正履歴の切り口に半端な字が残る '+r.hist);
 for(const k of ['aiHand','aiMonth','delDay','qr'])if(r[k]!==false)bad.push(k+' の切り口に半端な字が残る（または確かめられない） '+r[k]);
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
