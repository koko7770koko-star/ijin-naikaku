// 在庫（go('stock')）：予備品 1000 品・入出庫 2 万件のとき、予備品の一覧の表示と「探す」がそれぞれ 0.5 秒以内、
// 在庫表の印刷が A4 縦の幅に収まり、操作の部品が出ず、1 件の行が頁の境で割れず、PDF にでき、記録は変わらない（hz-v-stock-print-many）。
// usage: node hozen/tools/stockprintmanycheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=500;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const mk=(id,name,qty,min)=>({id,code:'P'+id,name,spec:'',maker:'',place:'棚'+(id.length%9),unit:'個',qty,min,price:'',equipIds:[],note:''});
  S.parts=[...Array(1000)].map((_,i)=>mk('pm'+i,i%7===0?'高圧カットアウト用ヒューズ 6.6kV 3A 限流形（長い品名の例・型番 XXXX-XXXX-XXXX）'+i:'予備品'+i,i%5,i%10===0?8:''));
  S.moves=[...Array(20000)].map((_,i)=>({id:'mv'+i,partId:'pm'+(i%1000),date:addD(TODAY,-(i%700)),type:i%3?'出庫':'入庫',qty:1,after:1,ref:'',by:'担当',note:''}));
  save();V.ptQ='';V.ptLow=0;V.mvAll=false;return JSON.stringify([S.parts,S.moves].map(a=>a.length))});
 const t0=Date.now();await p.evaluate(()=>go('stock',{stTab:'parts'}));await p.waitForSelector('#ptQ');const ms=Date.now()-t0;
 if(ms>LIM)bad.push(`予備品の一覧が ${LIM}ms 以内に出ない ${ms}ms`);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 const t1=Date.now();const n=await p.evaluate(()=>{const e=document.getElementById('ptQ');e.value='ヒューズ';e.dispatchEvent(new Event('input',{bubbles:true}));return 0});await p.waitForFunction(()=>/\d+品目/.test(document.querySelector('#app').innerText)&&document.querySelectorAll('#app .item').length<400,null,{timeout:5000}).catch(()=>{});const ms2=Date.now()-t1;
 if(ms2>LIM+300)bad.push(`「探す」が ${LIM}ms 前後で終わらない ${ms2}ms（入力待ちの時間を含む）`);
 await p.evaluate(()=>{V.ptQ='';render()});await p.waitForTimeout(300);
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
  const ctl=[...document.querySelectorAll('#app button,#app select,#app input,#app label.btn')].filter(vis).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'')).trim().slice(0,16));
  const rows=[...document.querySelectorAll('#app .item')].filter(vis);const bi=rows[0]?getComputedStyle(rows[0]).breakInside:'none';
  return {sw:document.documentElement.scrollWidth,W,over,ctl,bi,n:rows.length}});
 if(r.sw>r.W+1||r.over.length)bad.push('A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
 if(r.ctl.length)bad.push('印刷に操作の部品が残る '+r.ctl.join('|'));
 if(r.n<1000)bad.push('予備品 1000 品が全部は出ない '+r.n);
 if(r.n&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push('行がページの境で割れる（break-inside '+r.bi+'）');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 console.log('一覧',ms,'ms 探す',ms2,'ms 行',r.n,'PDF',buf.length);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify([S.parts,S.moves].map(a=>a.length)))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
