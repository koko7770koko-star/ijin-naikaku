// 不具合の記録：よく使う言い方を押すと「内容」に入る・続けて押すと足される・同じ物は重ねない・44px・はみ出さない・保存の形は変わらない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.issues=['配管の結露','配管の結露','空調の停止'].map((t,k)=>({id:'q'+k,date:TODAY,title:t,place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:''}));editIssue()});await p.waitForTimeout(500);
 const bs=await p.evaluate(()=>[...document.querySelectorAll('#is_phr button')].map(x=>({t:x.textContent,h:x.getBoundingClientRect().height})));
 if(bs.length<8)bad.push('候補が少ない '+bs.length);
 if(bs.some(x=>x.h<44))bad.push('44px未満');
 if(!bs.some(x=>x.t==='配管の結露'))bad.push('過去に2回あった件名が候補に出ない');
 if(bs.some(x=>x.t==='空調の停止'))bad.push('1回だけの件名が候補に出る');
 await p.click('#is_phr button:has-text("球切れ")');await p.click('#is_phr button:has-text("発熱")');await p.click('#is_phr button:has-text("発熱")');
 const v=await p.inputValue('#is_title');if(v!=='球切れ、発熱')bad.push('入り方が違う '+v);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 await p.evaluate(()=>{closeModal(true);editIssue('q2')});await p.waitForTimeout(400);
 if(await p.evaluate(()=>!!document.getElementById('is_phr')))bad.push('編集のとき候補が出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
