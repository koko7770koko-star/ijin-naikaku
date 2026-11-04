// 入力の窓の見出し（label）と入力欄が結ばれている確認：8つの窓で、見える入力欄（hidden・チェック・ラジオ以外）の半分以上でなく「見出しが前にある欄」すべてに名前（labels か aria-label）がある。
// usage: node hozen/tools/modallabelcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const wins=['editTask(null,TODAY)','editIssue(null,{})','editEquip()','editMeas(null,{})','editWork()','editPart()','editTool()','editLib()'];
 for(const w of wins){try{await p.evaluate(x=>{closeModal&&closeModal();eval(x)},w)}catch(e){errs.push(w+'：開けない '+e.message);continue}await p.waitForTimeout(150);
  const r=await p.evaluate(()=>{let bad=[],linked=0,tot=0;document.querySelectorAll('#modal label').forEach(l=>{if(l.querySelector('input,select,textarea'))return;let el=l.nextElementSibling;if(!el&&l.parentElement&&l.parentElement.tagName==='DIV')el=l.parentElement.nextElementSibling;const c=el&&(/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)?el:el.querySelector&&el.querySelector('input:not([type=hidden]),select,textarea'));if(!c||/^(hidden|checkbox|radio)$/.test(c.type))return;tot++;if(c.labels&&c.labels.length||c.getAttribute('aria-label'))linked++;else bad.push(l.textContent.trim().slice(0,12))});
   const l0=[...document.querySelectorAll('#modal label')].find(l=>l.htmlFor);let focus=true;if(l0){l0.click();focus=document.activeElement&&document.activeElement.id===l0.htmlFor||l0.control===document.activeElement}return{tot,linked,bad,focus}});
  if(r.bad.length)errs.push(w+'：名前の無い欄 '+r.bad.length+'（'+r.bad.slice(0,4).join('・')+'）');if(!r.tot)errs.push(w+'：見出しと欄が見つからない');if(!r.focus)errs.push(w+'：見出しを押しても欄に入らない')}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
