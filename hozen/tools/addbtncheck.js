// 「＋」だけのボタンを「＋ 追加」に直した画面の確認：予備品・工具・測定記録の雛形・異常の各画面で
// 追加ボタンの文字が出て、40px 以上で、押すと入力画面が開き、はみ出さず、エラーが無いことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 for(const v of ['stock','issues','mtpl']){await p.evaluate(v=>go(v),v);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const bt=[...document.querySelectorAll('#app .hd-row .btn, #app .card .btn')].find(x=>x.textContent.trim()==='＋ 追加');return bt?{h:bt.getBoundingClientRect().height,sw:document.documentElement.scrollWidth}:null});
  if(!r)bad.push(v+'：追加ボタンが見つからない');else{if(r.h<40)bad.push(v+'：小さい '+r.h);if(r.sw>392)bad.push(v+'：はみ出す')}
  await p.click('#app .btn:text-is("＋ 追加")');await p.waitForTimeout(300);if(!await p.evaluate(()=>!!document.querySelector('#modal input,#modal textarea,#modal select')))bad.push(v+'：入力画面が開かない');
  await p.evaluate(()=>closeModal(true))}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
