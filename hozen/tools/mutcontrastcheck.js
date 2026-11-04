// 標準（昼）の明るさで、補足の灰色の文字（--mut の色）と month の「今日」(.tdl)・凡例（.lgd .lg）・延期・中止の予定（.cal .t.ex）の比が 4.5 以上か。全 VIEWS ＋ shift、360px・特大と 390px・標準。
// usage: node hozen/tools/mutcontrastcheck.js [--list]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[],bad=new Map();let n=0;
 for(const [w,fs] of [[360,'xl'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(fs=>{document.documentElement.classList.remove('night');if(fs)document.documentElement.setAttribute('data-fs',fs);else document.documentElement.removeAttribute('data-fs')},fs);
 const vs=await p.evaluate(()=>Object.keys(VIEWS).filter(v=>!['printDoc','qr'].includes(v)));vs.push('shift');
 for(const v of vs){await p.evaluate(v=>{try{go(v,{day:TODAY})}catch(e){}},v);await p.waitForTimeout(200);
  await p.evaluate(()=>document.documentElement.classList.remove('night'));
  const r=await p.evaluate(()=>{
   const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
   const lum=([r,g,b])=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
   const bgOf=e=>{for(;e;e=e.parentElement){const a=rgb(getComputedStyle(e).backgroundColor);if(a.length===3||(a.length===4&&a[3]>=.99))return a;}return [255,255,255]};
   const pr=document.createElement('span');pr.style.color='var(--mut)';document.body.appendChild(pr);const mut=getComputedStyle(pr).color;pr.remove();
   const out=[];
   document.querySelectorAll('body *').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;
    const own=[...e.childNodes].some(t=>t.nodeType===3&&t.textContent.trim());if(!own)return;
    const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity<.99)return;
    if(!(cs.color===mut||e.matches('.tdl,.lgd .lg,.cal .t.ex')))return;
    const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
    const g=bgOf(e),l1=lum(rgb(cs.color)),l2=lum(g);const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
    out.push([(e.className&&e.className.baseVal===undefined?e.className:e.tagName)+'',(e.textContent||'').trim().slice(0,10),+ratio.toFixed(2),'rgb('+g.join(',')+')'])});
   return out});
  for(const [cl,t,ratio,bg] of r){n++;if(ratio<4.5){const k=v+' .'+cl+' on '+bg;if(!bad.has(k))bad.set(k,w+'px'+(fs?'・特大':'')+' '+k+' 「'+t+'」 比 '+ratio)}}}
 await c.close()}
 if(!n)errs.push('対象が見つからない');
 const L=[...bad.values()];if(process.argv.includes('--list'))console.log(L.join('\n'));
 console.log([...errs,...(L.length?[L.length+' か所で比が 4.5 未満（--list で一覧）。例：'+L.slice(0,3).join(' / ')]:[])].join('\n')||'NO ERRORS ('+n+' 件)');await b.close();process.exit(errs.length||L.length?1:0)})();
