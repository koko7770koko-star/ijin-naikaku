// 長い入力の窓（予定・異常・設備・工事・在庫）で、390px の画面の高さが低くても「保存」が画面内にあるかを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:560}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const opens={'予定':"editTask('')",'異常':"editIssue('')",'設備':"editEquip('')"};
 for(const [n,code] of Object.entries(opens)){
  try{await p.evaluate(code);}catch(e){bad.push(n+'：開けない '+e.message);continue}
  await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const m=document.querySelector('#modal');const f=m.querySelector('.mfoot');const bt=f&&[...f.querySelectorAll('button')].find(x=>x.textContent.trim()==='保存');
   if(!bt)return null;const rc=bt.getBoundingClientRect();const mr=m.getBoundingClientRect();return{top:rc.top,bottom:rc.bottom,mb:mr.bottom,sh:m.scrollHeight,ch:m.clientHeight,vh:innerHeight,sw:document.documentElement.scrollWidth}});
  if(!r){bad.push(n+'：保存ボタンが無い');}else{
   if(r.bottom>r.vh+1)bad.push(n+'：保存が画面の外 '+r.bottom+'/'+r.vh);
   if(r.sh<=r.ch)console.log(n+'：この窓は短くて動かさなくても収まる');
   if(r.sw>392)bad.push(n+'：横にはみ出す')}
  await p.evaluate(()=>closeModal(true))}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
