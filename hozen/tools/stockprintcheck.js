// 予備品（stock）の一覧の印刷：予備品 60 品目（長い品名・在庫不足あり）で、A4 縦の幅に収まり、検索・CSV・少ない物だけ・発注メモ・−＋のボタンが印刷に出ず、
// 1 件の行がページの境で割れず、各ページの下に題とページ番号が出る（@page の余白枠）・PDF にできる・記録は変わらない。usage: node hozen/tools/stockprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const mk=(id,name,qty,min)=>({id,code:'',name,spec:'',maker:'',place:'',unit:'個',qty,min,price:'',equipIds:[],note:''});
  S.parts=[...Array(60)].map((_,i)=>mk('sp'+i,i%6===0?'高圧カットアウト用ヒューズ 6.6kV 3A 限流形（長い品名の例・型番 XXXX-XXXX-XXXX）':'予備品'+i,i%5,i%10===0?8:''));save();V.ptQ='';V.ptLow=0;go('stock',{stTab:'parts'});return JSON.stringify(S.parts)});
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
 if(r.n<60)bad.push('60品目が出ない '+r.n);
 if(r.n&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push('行がページの境で割れる（break-inside '+r.bi+'）');
 if(!/"counter\(page\)/.test(r.title))bad.push('ページの下に題・ページ番号が出ない '+r.title);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.parts))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
