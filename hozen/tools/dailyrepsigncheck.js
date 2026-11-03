// 日報の印の欄の確認（hz-dailyrep-sign）：印刷の紙の右上に「承認・確認・作成」の印の欄（.stamp）が出て、空の欄が3つあり、A4 の幅に収まる。画面 390px ではみ出さない。保存データは変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>go('dailyRep'));await p.waitForTimeout(300);
 const st=await p.evaluate(()=>{const t=document.querySelector('#app .rep .stamp');if(!t)return null;return{th:[...t.querySelectorAll('th')].map(e=>e.textContent.trim()),td:t.querySelectorAll('td').length}});
 if(!st)bad.push('日報に印の欄が無い');else{if(st.th.join(',')!=='承認,確認,作成')bad.push('印の欄の見出しが違う：'+st.th.join(','));if(st.td!==3)bad.push('印の空欄が3つでない')}
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 await p.emulateMedia({media:'print'});await p.setViewportSize({width:794,height:1123});await p.waitForTimeout(150);
 const pr=await p.evaluate(()=>{const t=document.querySelector('#app .rep .stamp'),r=t&&t.getBoundingClientRect();return r?{w:r.width,h:r.height,right:r.right,vis:getComputedStyle(t).display!=='none'}:null});
 if(!pr||!pr.vis)bad.push('印刷で印の欄が出ない');else if(pr.right>794||pr.h<20)bad.push('印刷で印の欄が崩れる：'+JSON.stringify(pr));
 const pdf=await p.pdf({format:'A4'});if(!pdf||pdf.length<1000)bad.push('PDFが作れない');
 if(await p.evaluate(()=>JSON.stringify(S))!==before)bad.push('保存データが変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
