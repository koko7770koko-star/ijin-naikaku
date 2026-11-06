// 日常点検：「点検を完了する」→「この内容で完了」の後、①上の札が「完了」・知らせが出る ②「次にすること」（申し送りを書く・ホームへ）が画面の中に見える
// ③「申し送りを書く」で申し送りの欄に移って書ける ④ボタンは 44px 以上・390px ではみ出さない ⑤保存の形は変わらない（hz-v-day-done-jump）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const ds=TODAY;delete S.daily[ds];go('day',{day:ds});const r=dayRec();numDefs().forEach((n,i)=>r[n.id]=String(10+i));r.c={};chkDefs().forEach(c=>r.c[c.id]='○');r.by='点検者';save();render()});await p.waitForTimeout(300);
 if(await p.$('#dayNext'))bad.push('完了の前から「次にすること」が出る');
 const keys0=await p.evaluate(()=>Object.keys(S.daily[TODAY]).sort().join(','));
 await p.evaluate(()=>finishDay());await p.waitForTimeout(300);
 await p.click('text=この内容で完了');await p.waitForTimeout(700);
 const r=await p.evaluate(()=>{const e=document.querySelector('#dayNext');if(!e)return null;const b=e.getBoundingClientRect();
  return {top:b.top,bottom:b.bottom,vh:innerHeight,bs:[...e.querySelectorAll('button')].map(x=>({t:x.textContent.trim(),h:x.getBoundingClientRect().height})),sw:document.documentElement.scrollWidth,done:!!S.daily[TODAY].done,toast:(document.querySelector('.toast')||{}).textContent||''}});
 if(!r)bad.push('完了の後に「次にすること」が出ない');else{
  if(!r.done)bad.push('完了にならない');
  if(r.top<0||r.bottom>r.vh)bad.push('「次にすること」が画面の外 '+JSON.stringify({top:r.top,bottom:r.bottom}));
  if(r.bs.length!==2||!/申し送り/.test(r.bs[0].t)||!/ホーム/.test(r.bs[1].t))bad.push('ボタンが違う '+JSON.stringify(r.bs));
  if(r.bs.some(x=>x.h<44))bad.push('ボタンが 44px 未満');
  if(r.sw>392)bad.push('横にはみ出す');
  if(!/完了/.test(r.toast))bad.push('完了の知らせが出ない '+r.toast)}
 const keys1=await p.evaluate(()=>Object.keys(S.daily[TODAY]).filter(k=>!['done','doneBy'].includes(k)).sort().join(','));
 if(keys1!==keys0.split(',').filter(k=>!['done','doneBy','mod'].includes(k)).join(','))bad.push('保存の形が変わった '+keys0+' → '+keys1);
 await p.click('#dayNext button:nth-child(2)');await p.waitForTimeout(500);
 const f=await p.evaluate(()=>{const t=document.querySelector('#ho_text');const b=t&&t.getBoundingClientRect();return {focus:document.activeElement===t,inView:!!b&&b.top>=0&&b.bottom<=innerHeight}});
 if(!f.focus)bad.push('「申し送りを書く」で申し送りの欄に移らない');if(!f.inView)bad.push('申し送りの欄が画面の外');
 await p.click('#dayNext button:nth-child(3)');await p.waitForTimeout(400);
 if(await p.evaluate(()=>V.view)!=='home')bad.push('「ホームへ」でホームが開かない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
