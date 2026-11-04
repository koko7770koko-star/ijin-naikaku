// 画面の入力欄に名前がある確認：全画面（VIEWS）を 390px で開き、見える input/select/textarea（hidden・ボタン類以外）すべてに
// 名前（label・aria-label・title・aria-labelledby）があること。窓の中は modallabelcheck.js が見る。
// usage: node hozen/tools/screenlabelcheck.js [--list]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const views=await p.evaluate(()=>Object.keys(VIEWS));let total=0;
 for(const v of views){try{await p.evaluate(x=>{closeModal&&closeModal();go(x)},v);await p.waitForTimeout(200)}catch(e){continue}
  const r=await p.evaluate(()=>[...document.querySelectorAll('#app input,#app select,#app textarea')].filter(e=>!/^(hidden|button|submit|reset|file)$/.test(e.type)&&e.getBoundingClientRect().width>0&&!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.title).map(e=>e.tagName.toLowerCase()+'#'+(e.id||'')+'.'+(e.type||'')+' '+(e.placeholder||'').slice(0,14)));
  total+=r.length;if(r.length){errs.push(v+'：名前の無い欄 '+r.length);if(process.argv.includes('--list'))r.forEach(x=>console.log('  '+v+' '+x))}}
 console.log(errs.join('\n')||'NO ERRORS（'+views.length+' 画面）');await b.close();process.exit(errs.length?1:0)})();
