// 記号だけのボタンに名前があるか：390px で全画面（VIEWS）と夜勤シフト表を開き、見えている button・[onclick] のうち、
// 文字（字・数字）が無い物には aria-label か title があること（読み上げで「ボタン」としか言わない物を無くす）。たたんだ中の物（innerText が空）は除く。（hz-a11y-icon-btn）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const f=`(()=>{const o=[];document.querySelectorAll('button,[role=button],[onclick]').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;if(e.getAttribute('aria-label')||e.title)return;const it=(e.innerText||'').trim(),tc=(e.textContent||'').trim();if(!it&&tc)return;/* たたんだ中 */if(!/[\\p{L}\\p{N}]/u.test(it))o.push(e.tagName+' '+JSON.stringify(it).slice(0,12)+' '+String(e.getAttribute('onclick')||'').slice(0,40))});return [...new Set(o)]})()`;
 const vs=await p.evaluate(()=>Object.keys(VIEWS).filter(v=>!['printDoc','qr'].includes(v)));vs.push('shift');
 for(const v of vs){await p.evaluate(v=>{try{go(v,{day:TODAY})}catch(e){}},v);await p.waitForTimeout(200);const r=await p.evaluate(f);if(r.length)bad.push(v+'：名前の無い記号だけのボタン '+r.join(' | '))}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
