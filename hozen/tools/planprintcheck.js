// 長期保全計画（plan）の印刷：計画 40 件（長い件名つき）・点検期限・測定の周期のどのタブでも、A4 縦の幅に収まり、1 件の行がページの境で割れず、
// 印刷にボタンが残らず、各ページの下に題（画面名）とページ番号が出る（@page の余白枠）・PDF にできる・記録は変わらない。usage: node hozen/tools/planprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const fy=fyNow();S.plans=[];for(let i=0;i<40;i++)S.plans.push({id:'pp'+i,title:(i%5===0?'受変電設備 高圧真空遮断器の更新と保護継電器の取り替え・試験一式（長い件名の例）':'計画'+i),equipId:'',year:fy+(i%11),kind:'更新',cost:1000000+i*12345,status:i%3?'計画':'予算化',note:''});
  save();V.plTab='renew';go('plan');return JSON.stringify(S.plans)});
 await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});
 for(const tab of ['renew','legal','measdue']){
  await p.evaluate(t=>{V.plTab=t;render()},tab);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
   const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
   const btns=[...document.querySelectorAll('#app button')].filter(vis).map(e=>e.textContent.trim().slice(0,12));
   const item=document.querySelector('#app .item');const bi=item?getComputedStyle(item).breakInside:'none';
   const tabsVis=[...document.querySelectorAll('#app .tabs16, #app [role=tablist]')].some(vis);return {sw:document.documentElement.scrollWidth,W,over,btns,bi,tabsVis,title:document.getElementById('pageStyle').textContent,items:document.querySelectorAll('#app .item').length}});
  if(r.sw>r.W+1||r.over.length)bad.push(tab+'：A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
  if(r.btns.length)bad.push(tab+'：印刷にボタンが残る '+r.btns.join('|'));
  if(r.items&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push(tab+'：行がページの境で割れる（break-inside '+r.bi+'）');
  if(!/保全計画\s*"counter\(page\)/.test(r.title))bad.push(tab+'：ページの下に題・ページ番号が出ない '+r.title);
  if(tab==='renew'&&r.items<40)bad.push('40件が出ない '+r.items);
  if(tab==='renew'){const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf)}
 }
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.plans))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
