// 天気・警報：つながらないとき、ホームが「取得しています…」のまま残らず短い1行と再取得ボタンになる。他の機能は動く。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.settings.wx={on:true,lat:35,lng:135,label:'テスト',pref:'大阪府'};go('home')});
 await p.waitForTimeout(1500);
 const t=await p.evaluate(()=>{const e=document.querySelector('#app');return {txt:(e.innerText.match(/☀ 天気[\s\S]{0,120}/)||[''])[0],btn:[...e.querySelectorAll('button')].some(x=>/再取得/.test(x.textContent)),w:document.documentElement.scrollWidth}});
 if(/取得しています/.test(t.txt))bad.push('読み込み中のまま残る: '+t.txt);
 if(!/取得できませんでした/.test(t.txt))bad.push('失敗の1行が出ない: '+t.txt);
 if(!t.btn)bad.push('再取得ボタンが無い');
 if(t.w>392)bad.push('横にはみ出す '+t.w);
 await p.evaluate(()=>go('month'));await p.waitForTimeout(300);
 if(await p.evaluate(()=>V.view)!=='month')bad.push('天気が失敗しても他の画面が開かない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
