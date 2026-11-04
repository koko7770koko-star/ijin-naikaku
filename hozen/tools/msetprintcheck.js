// 測定の設定（mset）を印刷：入力欄・ボタンは出ず、値が文字で出る。画面（screen）では今までどおり入力欄が出て、文字の複製は出ない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:718,height:900}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.healthCfg.age=37;S.chkPre=['停電範囲の確認','検電'];S.chkPost=['復電確認'];go('mset')});await p.waitForTimeout(300);
 const vis=()=>p.evaluate(()=>[...document.querySelectorAll('#app button,#app input,#app select,#app textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).length);
 const ponly=()=>p.evaluate(()=>[...document.querySelectorAll('.ponly')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.textContent));
 if(await vis()<6)bad.push('画面で入力欄・ボタンが出ない');if((await ponly()).length)bad.push('画面に印刷用の文字が出ている');
 await p.emulateMedia({media:'print'});await p.waitForTimeout(100);
 if(await vis())bad.push('印刷に入力欄・ボタンが出る '+await vis());
 const t=(await ponly()).join('|');if(!/37/.test(t)||!/検電/.test(t)||!/復電確認/.test(t))bad.push('印刷に値が文字で出ない '+t);
 await p.emulateMedia({media:'screen'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
