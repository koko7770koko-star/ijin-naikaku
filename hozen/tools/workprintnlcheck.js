// 作業報告書の印刷（printDoc work）：作業内容・結果に入れた改行が紙で消えず、入れたとおりに段を分けて出る（hz-v-works-print-nl）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof go==='function');
 await p.evaluate(()=>editWork(null));await p.waitForSelector('#wk_title');await p.waitForTimeout(300);
 const ids=await p.evaluate(()=>{document.querySelectorAll('#modal details').forEach(d=>d.open=true);const o=document.getElementById('wk_out');if(o&&o.type==='checkbox'&&!o.checked){o.checked=true;o.dispatchEvent(new Event('change',{bubbles:true}));o.dispatchEvent(new Event('input',{bubbles:true}))}const t=[...document.querySelectorAll('#modal textarea')].filter(e=>e.id.startsWith('wk_'));
  $('#wk_title').value='改行の確認';t.forEach((e,i)=>{e.value=`行${i}あ\n行${i}い`;e.dispatchEvent(new Event('input',{bubbles:true}))});return t.map(e=>e.id)});
 await p.evaluate(()=>{const n=(S.works||[]).length;saveWork('');window.__wid=(S.works[S.works.length-1]||{}).id;window.__ok=S.works.length>n});
 if(!await p.evaluate(()=>window.__ok))bad.push('作業指示を保存できない');
 await p.evaluate(()=>{try{closeModal(true)}catch(e){}go('printDoc',{doc:{t:'work',id:window.__wid}})});await p.waitForTimeout(500);
 await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const res=await p.evaluate(ids=>{const T=document.body.innerText;return ids.map((id,i)=>{const s=(S.works.find(w=>w.id===window.__wid)||{});const shown=T.includes(`行${i}あ`);return {id,shown,nl:new RegExp(`行${i}あ[ \\t]*\\n[ \\t]*行${i}い`).test(T)}})},ids);
 for(const r of res){if(!r.shown&&/content|result/.test(r.id))bad.push(`印刷：${r.id} が出ない`);if(r.shown&&!r.nl)bad.push(`印刷：${r.id} の改行が消えて 1 段になる`)}
 console.log(JSON.stringify(res));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
