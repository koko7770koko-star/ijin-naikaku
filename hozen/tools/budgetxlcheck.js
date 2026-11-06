// 文字「大」「特大」・360px：予算の表（予算・実績・残）の「残」が右に切れず、金額の「円」が割れず、横にはみ出さないこと。名前は「項目1」の形だけ。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
for(const fsc of ['l','xl']){const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const fy=fyNow();S.budget=[];BUDGET_CATS.slice(0,5).forEach((c,i)=>S.budget.push({id:'bg'+i,fy,cat:c,name:'項目'+(i+1),amount:String(1234567+i)}));S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(400);
 await p.evaluate(()=>go('stock',{stTab:'budget'}));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const o=[];if(document.documentElement.scrollWidth>361)o.push('横にはみ出す');
  document.querySelectorAll('.bgtbl td[data-l]').forEach(e=>{const bb=e.getBoundingClientRect();if(bb.right>360)o.push('右に切れる '+e.dataset.l);if(e.scrollHeight>e.clientHeight+22&&/円/.test(e.innerText)&&e.innerText.split('\n').length>2)o.push('金額が割れる '+e.innerText)});
  if(!document.querySelector('.bgtbl td[data-l]'))o.push('表が無い');return o});
 r.forEach(x=>bad.push(fsc+' '+x));await ctx.close()}
console.log([...new Set(bad)].join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
