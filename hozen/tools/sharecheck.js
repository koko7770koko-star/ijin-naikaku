// 報告書の「共有」の確認：月報・年報・日報・作業予定表・作業書に「📤 共有」があり、押すと端末の共有（navigator.share）に
// 画面の文字（操作ボタンを除く）が渡る。共有が無い端末ではコピー→ファイル保存に落ちる。新しい通信先は足さない。390px ではみ出さない。
// usage: node hozen/tools/sharecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{window.__sh=null;navigator.share=async d=>{window.__sh=d}});
 for(const v of ['report','dailyRep','workSheet']){
  await p.evaluate(v=>{V.rmode='m';go(v)},v);await p.waitForTimeout(300);
  const n=await p.evaluate(()=>[...document.querySelectorAll('#app button')].filter(x=>x.textContent.includes('共有')).map(x=>x.getBoundingClientRect().height));
  if(n.length!==1){bad.push(v+'：共有ボタンが '+n.length+' 個');continue}if(n[0]<40)bad.push(v+'：共有ボタンが低い '+n[0]);
  await p.evaluate(()=>{window.__sh=null});await p.click('#app button:has-text("共有")');await p.waitForTimeout(300);
  const d=await p.evaluate(()=>window.__sh);if(!d||!d.text||d.text.length<30)bad.push(v+'：共有に文字が渡らない '+JSON.stringify(d).slice(0,80));
  else{if(/📤|印刷／PDF|前の2週/.test(d.text))bad.push(v+'：操作ボタンの文字が混ざる');if(!d.title.includes(await p.evaluate(()=>TODAY)))bad.push(v+'：題に日付が無い')}
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(v+'：はみ出す '+sw);
 }
 // 共有が使えない端末：コピーに落ちる／コピーも無ければファイル保存
 await p.evaluate(()=>{navigator.share=undefined;window.__cp=null;Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__cp=t}},configurable:true})});
 await p.evaluate(()=>{go('dailyRep')});await p.waitForTimeout(300);await p.click('#app button:has-text("共有")');await p.waitForTimeout(300);
 if(!await p.evaluate(()=>window.__cp&&window.__cp.length>30))bad.push('共有なしでコピーに落ちない');
 await p.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});window.__sv=null;window.hzSave=async(n,bl)=>{window.__sv=n;return true}});
 await p.click('#app button:has-text("共有")');await p.waitForTimeout(300);if(!await p.evaluate(()=>/\.txt$/.test(window.__sv||'')))bad.push('コピーも無いときにファイル保存に落ちない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
