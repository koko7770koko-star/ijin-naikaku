// 予算・費用（stock の budget）の印刷：桁の多い予算（12,345,678 円）と実績・設備更新の計画で、表が A4 縦の幅に収まり金額が折れず、年度の切り替え・＋予算・更新計画のボタンが印刷に出ず、年度の題は残り、
// 1 件の行がページの境で割れず、各ページの下に題とページ番号が出る（@page の余白枠）・PDF にできる・記録は変わらない。usage: node hozen/tools/budgetprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const fy=fyNow();S.budget=BUDGET_CATS.map((c,i)=>({id:'bg'+i,fy,cat:c,name:'予算'+i,amount:12345678*(i+1),note:''}));
  S.equipment=[...Array(12)].map((_,i)=>({id:'be'+i,code:'B-'+i,name:'受変電設備 高圧受電盤'+i,kind:'受変電',status:'稼働',installed:'2000-04',life:20+i,renewCost:98765432,photos:[],repairs:[],docs:[]}));
  save();V.bgFy=fy;go('stock',{stTab:'budget'});return JSON.stringify(S.budget)});
 await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
  const ctl=[...document.querySelectorAll('#app button,#app select,#app input,#app .tile,#app label.btn')].filter(vis).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'')).trim().slice(0,16));
  const rows=[...document.querySelectorAll('#app .item, #app tbody tr')].filter(vis);const bi=rows[0]?getComputedStyle(rows[0]).breakInside:'none';
  return {sw:document.documentElement.scrollWidth,W,over,ctl,bi,n:rows.length,title:document.getElementById('pageStyle').textContent}});
 if(r.sw>r.W+1||r.over.length)bad.push('A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
 if(r.ctl.length)bad.push('印刷に操作の部品が残る '+r.ctl.join('|'));
 if(r.n<4)bad.push('表の行が出ない '+r.n);const nw=await p.evaluate(()=>[...document.querySelectorAll('#app table td')].filter(td=>/円/.test(td.textContent)&&td.getClientRects().length>1).length);if(nw)bad.push('金額が折れる '+nw);const yt=await p.evaluate(()=>/年度/.test(document.querySelector('#app').innerText));if(!yt)bad.push('年度の題が出ない');
 if(r.n&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push('行がページの境で割れる（break-inside '+r.bi+'）');
 if(!/"counter\(page\)/.test(r.title))bad.push('ページの下に題・ページ番号が出ない '+r.title);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.budget))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
