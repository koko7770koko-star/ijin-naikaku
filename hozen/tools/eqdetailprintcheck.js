// 設備カルテ（equipDetail）の印刷：修理 10 件・異常 3 件の設備で、A4 縦の幅に収まり、タブ・編集・写真を足す等のボタンが印刷に出ず、
// 1 件の行がページの境で割れず、各ページの下に題とページ番号が出る（@page の余白枠）・PDF にできる・記録は変わらない。usage: node hozen/tools/eqdetailprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{S.equipment=[{id:'ed1',code:'E-001',name:'高圧受電盤 真空遮断器（VCB）および保護継電器一式（長い名前の例）',kind:'受変電',importance:'A',status:'稼働',maker:'○○電機',model:'VCB-7.2kV-600A',serial:'X',installed:'2010-04',life:20,place:'A棟 1階',photos:[],docs:[],repairs:[...Array(10)].map((_,i)=>({id:'rp'+i,date:addD(TODAY,-30*i),kind:'修理',content:'端子の増し締め・清掃・点検（長い内容の例）'+i,cost:12345*i,by:'',photos:[]}))}];
  S.issues=[...Array(3)].map((_,i)=>({id:'ei'+i,src:'manual:ei'+i,date:addD(TODAY,-i),title:'不具合'+i,place:'',detail:'',status:'対応中',action:'',closed:'',photos:[],equipId:'ed1',log:[]}));save();go('equipDetail',{eq:'ed1',eqTab:'ov'});return JSON.stringify(S.equipment)});
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
 
 if(r.n&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push('行がページの境で割れる（break-inside '+r.bi+'）');
 if(!/"counter\(page\)/.test(r.title))bad.push('ページの下に題・ページ番号が出ない '+r.title);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.equipment))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
