// 日常点検：基準外の数値を入れて保存すると、日の画面に「異常の記録を開く」が出て、日付・内容を引き継いだ記録窓が開く。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1000);
 const r=await p.evaluate(()=>{const ck=chkDefs()[0];if(!ck)return {err:'点検項目が無い'};S.daily[TODAY]={c:{[ck.id]:'×'}};commitDay(true);go('day',{day:TODAY});return {id:ck.id}});
 if(r.err)bad.push(r.err);
 await p.waitForTimeout(400);
 const btn=await p.evaluate(()=>{const e=[...document.querySelectorAll('#app button')].find(x=>/異常の記録を開く/.test(x.textContent));if(!e)return null;const b=e.getBoundingClientRect();return {h:b.height,w:document.documentElement.scrollWidth}});
 if(!btn)bad.push('異常の記録を開くボタンが出ない');else{if(btn.h<44)bad.push('ボタンが44px未満 '+btn.h);if(btn.w>392)bad.push('横にはみ出す')}
 if(btn){await p.evaluate(()=>[...document.querySelectorAll('#app button')].find(x=>/異常の記録を開く/.test(x.textContent)).click());await p.waitForTimeout(300);
  const f=await p.evaluate(()=>({t:(document.querySelector('#is_title')||{}).value,d:(document.querySelector('#is_detail')||{}).value}));
  if(!f.t||!/日常点検/.test(f.t))bad.push('内容が引き継がれない '+JSON.stringify(f))}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
