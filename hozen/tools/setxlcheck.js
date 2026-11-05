// 設定（set）の全部のタブ：文字「特大」「大」・360px で ①ページが横にはみ出さない ②箱の外に出る物がない
// ③ボタン・選びが 44px 以上で、文字が切れない（hz-l-set-tabs）。外部への通信は止める
// usage: node hozen/tools/setxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);
  const tabs=await p.evaluate(()=>SET_TABS.map(t=>t[0]));
  for(const t of tabs){
   await p.evaluate(t=>go('set',{setTab:t}),t);await p.waitForTimeout(150);
   const r=await p.evaluate(()=>{const o=[];
    if(document.documentElement.scrollWidth>innerWidth+1)o.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
    document.querySelectorAll('#app button,#app select').forEach(e=>{const q=e.getBoundingClientRect();if(!q.height||getComputedStyle(e).visibility==='hidden')return;const lb=(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,14);
     if(q.height<43.5&&!e.closest('.tblwrap,.tbw,.repscroll'))o.push('44px 未満 '+Math.round(q.height)+'px 「'+lb+'」');
     if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+1)o.push('ボタンの文字が切れる 「'+lb+'」');
     if(e.tagName==='SELECT'){const sp=document.createElement('span');sp.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+getComputedStyle(e).font;sp.textContent=e.options[e.selectedIndex]?e.options[e.selectedIndex].text:'';document.body.appendChild(sp);const w=sp.getBoundingClientRect().width;sp.remove();if(w+34>q.width)o.push('選びの文字が切れる（'+Math.round(w)+'px・箱 '+Math.round(q.width)+'px）「'+sp.textContent.slice(0,14)+'」')}});
    document.querySelectorAll('#app .seg button').forEach(e=>{if(e.scrollHeight>e.clientHeight+1)o.push('タブ・切り替えの文字が上下に切れる 「'+e.textContent.trim().slice(0,12)+'」 '+e.scrollHeight+'>'+e.clientHeight)});
    document.querySelectorAll('#app input:not([type=checkbox]):not([type=radio]):not([type=file]),#app textarea').forEach(e=>{const q=e.getBoundingClientRect();if(q.width&&(q.right>innerWidth+1||q.width<60))o.push('入力欄が はみ出す/細い '+Math.round(q.width)+'px '+(e.id||e.placeholder||''))});
    return [...new Set(o)]});
   r.forEach(x=>errs.push('360px・'+({xl:'特大',l:'大'})[fs]+'・設定 '+t+'・'+x));}
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
