// 予算・費用：1 年度に予算の行 500 件 × 10 年度・設備 2000 台・保全計画 500 件で、予算と実績のタブ・年度の切り替えが 1 秒以内、
// 区分ごとの予算の合計が手で数えた値と同じ、A4 の印刷で幅に収まり PDF にできるか。390px でははみ出さない（hz-v-budget-rows-many）。
// 保存の形は変えない。usage: node hozen/tools/budgetmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=1000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const exp=await p.evaluate(()=>{const fy=fyNow();S.budget=[];for(let y=fy-5;y<fy+5;y++)for(let i=0;i<500;i++)S.budget.push({id:'bg'+y+'_'+i,fy:y,cat:BUDGET_CATS[i%5],name:'内訳'+i,amount:1000*(i+1)});
  S.equipment=[...Array(2000)].map((_,i)=>({id:'be'+i,code:'B-'+i,name:'設備'+i,kind:'受変電',status:'稼働',installed:'2000-04',life:20+(i%40),renewCost:100000,photos:[],repairs:[],docs:[]}));
  S.plans=[...Array(500)].map((_,i)=>({id:'pl'+i,year:fy+(i%10),title:'計画'+i,cost:50000,status:'予定'}));save();
  const sum={};S.budget.filter(x=>x.fy===fy).forEach(x=>sum[x.cat]=(sum[x.cat]||0)+x.amount);return {fy,sum}});
 await p.waitForTimeout(300);const tm={};let s;const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 s=Date.now();await p.evaluate(fy=>{V.bgFy=fy;go('stock',{stTab:'budget'})},exp.fy);await raf();tm.tab=Date.now()-s;
 const tb=await p.evaluate(()=>[...document.querySelectorAll('.bgtbl tr')].map(r=>[...r.children].map(x=>x.textContent.trim())));
 for(const k in exp.sum){const row=tb.find(r=>r[0]===k);const want=exp.sum[k].toLocaleString('ja-JP')+'円';if(!row||row[1]!==want)bad.push(k+' の予算 '+(row&&row[1])+'（手で '+want+'）')}
 const items=await p.evaluate(()=>[...document.querySelectorAll('.item')].filter(x=>/editBudget/.test(x.getAttribute('onclick')||'')).length);if(items!==500)bad.push('予算の行 '+items);
 s=Date.now();await p.evaluate(fy=>{V.bgFy=fy+1;render()},exp.fy);await raf();tm.next=Date.now()-s;
 s=Date.now();await p.evaluate(fy=>{V.bgFy=fy-1;render()},exp.fy);await raf();tm.prev=Date.now()-s;
 await p.evaluate(fy=>{V.bgFy=fy;render()},exp.fy);await raf();
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390px ではみ出す');
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
 const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,W:innerWidth}));if(r.sw>r.W+1)bad.push('A4 の幅からはみ出す '+r.sw);
 s=Date.now();const buf=await p.pdf({preferCSSPageSize:true,printBackground:true}).catch(e=>{bad.push('PDF '+e.message);return null});tm.pdf=Date.now()-s;if(buf&&buf.length<5000)bad.push('PDF が空');
 await p.emulateMedia({media:'screen'});
 for(const k of ['tab','next','prev'])if(tm[k]>LIM)bad.push(k+' '+tm[k]+'ms');
 const sv=await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).budget.length);if(sv!==5000)bad.push('保存の件数 '+sv);
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
