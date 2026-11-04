// 設定（set の全タブ）と測定のひな形（mtpl）を印刷：入力欄・ボタンは出ず、値が文字で出る。画面では今までどおり入力欄が出る
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:718,height:900}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const vis=()=>p.evaluate(()=>[...document.querySelectorAll('#app button,#app input,#app select,#app textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).map(e=>e.tagName+'#'+e.id+':'+(e.textContent||'').slice(0,10)));
 const ponly=()=>p.evaluate(()=>[...document.querySelectorAll('.ponly')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.textContent).join('|'));
 const ovf=()=>p.evaluate(()=>[...document.querySelectorAll('#app *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&e.getBoundingClientRect().width>0).length);
 for(const [v,tab] of [['set','data'],['set','basic'],['set','items'],['set','link'],['mtpl']]){
  await p.emulateMedia({media:'screen'});
  await p.evaluate(([v,t])=>{S.settings.name='○○総合病院';go(v,t?{setTab:t}:undefined)},[v,tab]);await p.waitForTimeout(250);
  const n=(await vis()).length;if(n<1)bad.push(v+':'+tab+' 画面で部品が出ない');if(await ponly())bad.push(v+':'+tab+' 画面に印刷用の文字が出ている');
  await p.emulateMedia({media:'print'});await p.waitForTimeout(100);
  const left=await vis();if(left.length)bad.push(v+':'+tab+' 印刷に入力欄・ボタンが出る '+left.slice(0,4).join(','));
  if(await ovf())bad.push(v+':'+tab+' 印刷で右にはみ出す');
  if(v==='set'&&tab==='basic'&&!/○○総合病院/.test(await ponly()))bad.push('基本の施設名が文字で出ない');
 }
 await p.emulateMedia({media:'screen'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
