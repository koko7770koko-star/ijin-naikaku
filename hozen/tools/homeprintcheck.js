// ホームを印刷（朝礼で配る）：ボタン・入力欄・読み込み中の表示が紙に出ない／A4 718px 幅ではみ出さない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:718,height:900}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const d=TODAY;S.tasks=S.tasks||[];S.issues=[];for(let i=0;i<5;i++)S.issues.push({id:'i'+i,title:'異常'+i,status:'未対応',urgency:'高',date:d,equipIds:[],due:d});go('home')});await p.waitForTimeout(500);
 await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
 const vis=await p.evaluate(()=>[...document.querySelectorAll('#app button,#app input,#app select,#app textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'}).map(e=>(e.className+'|'+(e.textContent||e.id||e.tagName)).trim().slice(0,28)));
 if(vis.length)bad.push('印刷にボタン・押せる物が出る '+vis.length+'：'+vis.slice(0,8).join('｜'));
 const txt=await p.evaluate(()=>document.querySelector('#app').innerText);
 if(/読み込み中|取得中/.test(txt))bad.push('「読み込み中」が紙に出る');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>722)bad.push('横にはみ出す '+await p.evaluate(()=>document.documentElement.scrollWidth));
 await p.emulateMedia({media:'screen'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
