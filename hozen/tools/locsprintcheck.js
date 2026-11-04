// 場所の階層（locs）の印刷：棟 3・階 2・電気室 1・盤 2 で、たたんだ棟も印刷の間だけ全部開いて紙に出て（印刷が終わると元の開閉に戻る）、A4 縦の幅に収まり、＋・⋯・並べ替え・たたむ等のボタンが印刷に出ず、
// 1 件の行がページの境で割れず、各ページの下に題とページ番号が出る（@page の余白枠）・PDF にできる・記録は変わらない。usage: node hozen/tools/locsprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const L=[];let n=0;const id=()=>'lc'+(n++);
  for(const bn of ['A棟','B棟','C棟']){const b=id();L.push({id:b,name:bn,type:'建屋',parent:'',note:''});for(const fn of ['1階','2階']){const f=id();L.push({id:f,name:fn,type:'階',parent:b,note:''});const r=id();L.push({id:r,name:'第1電気室',type:'電気室',parent:f,note:''});for(const pn of ['動力盤-1','電灯盤-1'])L.push({id:id(),name:pn,type:'盤',parent:r,note:''})}}
  S.locs=L;save();go('locs');L.filter(l=>l.type==='建屋').forEach(l=>V['lo_'+l.id]=false);V['lo_lc0']=true;render();return JSON.stringify(S.locs)});
 await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 const shown0=await p.evaluate(()=>document.querySelectorAll('#app .locn').length);
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
  const ctl=[...document.querySelectorAll('#app button,#app select,#app input,#app .tile,#app label.btn')].filter(vis).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'')).trim().slice(0,16));
  const rows=[...document.querySelectorAll('#app .item, #app tbody tr')].filter(vis);const bi=rows[0]?getComputedStyle(rows[0]).breakInside:'none';
  return {sw:document.documentElement.scrollWidth,W,over,ctl,bi,n:rows.length,title:document.getElementById('pageStyle').textContent}});
 if(r.sw>r.W+1||r.over.length)bad.push('A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
 if(r.ctl.length)bad.push('印刷に操作の部品が残る '+r.ctl.join('|'));
 const all=await p.evaluate(()=>document.querySelectorAll('#app .locn').length);if(all!==27)bad.push('印刷で全部の場所が出ない '+all+'/27（画面では '+shown0+'）');if(shown0>=27)bad.push('たたんだ状態が作れていない');
 if(r.n&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push('行がページの境で割れる（break-inside '+r.bi+'）');
 if(!/"counter\(page\)/.test(r.title))bad.push('ページの下に題・ページ番号が出ない '+r.title);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:'screen'});const back=await p.evaluate(()=>document.querySelectorAll('#app .locn').length);if(back!==shown0)bad.push('印刷の後に開閉が戻らない '+back+'/'+shown0);
 if(await p.evaluate(()=>JSON.stringify(S.locs))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
