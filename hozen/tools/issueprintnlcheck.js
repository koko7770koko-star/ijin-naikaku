// 異常案件の報告書（printDoc issue）と未完了の異常一覧の印刷（issueList）：内容・原因・処置・再発防止など複数行の欄に入れた改行が紙で消えず、入れたとおりに段を分けて出る（hz-v-issue-print-nl）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof go==='function');
 await p.evaluate(()=>editIssue(null));await p.waitForSelector('#is_title');await p.waitForTimeout(300);
 const ids=await p.evaluate(()=>{document.querySelectorAll('#modal details').forEach(d=>d.open=true);const t=[...document.querySelectorAll('#modal textarea')].filter(e=>e.id.startsWith('is_'));
  document.getElementById('is_title').value='改行の確認';t.forEach((e,i)=>{e.value=`行${i}あ\n行${i}い`;e.dispatchEvent(new Event('input',{bubbles:true}))});return t.map(e=>e.id)});
 await p.evaluate(()=>{const n=S.issues.length;saveIssue('');window.__iid=(S.issues.find(i=>i.title==='改行の確認')||{}).id;window.__ok=S.issues.length>n});
 if(!await p.evaluate(()=>window.__ok))bad.push('異常を保存できない');
 for(const doc of ['issue','issueList']){
  await p.emulateMedia({media:'screen'});
  await p.evaluate(doc=>{try{closeModal(true)}catch(e){}go('printDoc',{doc:{t:doc,id:window.__iid}})},doc);await p.waitForTimeout(500);
  await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
  const res=await p.evaluate(ids=>{const T=document.body.innerText;return ids.map((id,i)=>({id,shown:T.includes(`行${i}あ`),nl:new RegExp(`行${i}あ[ \\t]*\\n[ \\t]*行${i}い`).test(T)}))},ids);
  for(const r of res){if(r.shown&&!r.nl)bad.push(`${doc} の印刷：${r.id} の改行が消えて 1 段になる`)}
  if(!res.some(r=>r.shown))bad.push(`${doc} の印刷：入れた欄が 1 つも出ない`);
  console.log(doc,JSON.stringify(res));}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
