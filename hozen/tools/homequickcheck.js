// ホームの「よく使う仕事」：今日の点検に残り件数・済みが出る／異常を記録に未完了件数／発電機が1台ならそのまま月次点検の入力が開く（1タップ）／
// 複数台・0台は発電機の一覧へ／4つのボタンが44px以上で390pxではみ出さない。保存の形は変えない。
// usage: node hozen/tools/homequickcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const q=()=>p.evaluate(()=>[...document.querySelectorAll('.hq4 button')].map(x=>{const r=x.getBoundingClientRect();return {t:x.textContent.replace(/\s+/g,''),h:r.height,r:r.right}}));
 let B=await q();if(B.length!==4)bad.push('ボタンが '+B.length);
 B.forEach(x=>{if(x.h<44||x.r>390)bad.push('大きさ/位置 '+JSON.stringify(x))});
 if(!/今日の点検(残り\d+件|入力する)/.test(B[0].t))bad.push('今日の点検の表示 '+B[0].t);
 // 異常と済み
 await p.evaluate(()=>{S.issues=[{id:'i1',date:TODAY,title:'球切れ',place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]}];S.daily[TODAY]={done:true};save();go('home')});await p.waitForTimeout(300);
 B=await q();if(!B[0].t.includes('済み'))bad.push('済みの表示 '+B[0].t);if(!B[3].t.includes('未完了1件'))bad.push('異常の件数 '+B[3].t);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // 発電機：1台 → そのまま入力
 await p.evaluate(()=>{S.equipment=[{id:'g1',code:'G-1',name:'非常用発電機 1号',kind:'発電機',status:'稼働',photos:[],docs:[],repairs:[],health:[]}];save();go('home')});await p.waitForTimeout(300);
 await p.click('.hq4 button:nth-child(3)');await p.waitForTimeout(500);
 const m=await p.evaluate(()=>({modal:document.querySelector('#mask').classList.contains('on'),txt:document.querySelector('#modal').textContent.slice(0,60)}));
 if(!m.modal)bad.push('1台なのに入力が開かない');
 await p.evaluate(()=>closeModal(true));
 // 2台 → 一覧へ
 await p.evaluate(()=>{S.equipment.push({id:'g2',code:'G-2',name:'非常用発電機 2号',kind:'発電機',status:'稼働',photos:[],docs:[],repairs:[],health:[]});save();go('home')});await p.waitForTimeout(300);
 await p.click('.hq4 button:nth-child(3)');await p.waitForTimeout(500);
 const v=await p.evaluate(()=>({view:V.view,modal:document.querySelector('#mask').classList.contains('on')}));if(v.view!=='diag'||v.modal)bad.push('2台のとき一覧に行かない '+JSON.stringify(v));
 // 0台（廃止のみ）
 await p.evaluate(()=>{S.equipment.forEach(e=>e.status='廃止');save();go('home')});await p.waitForTimeout(300);
 await p.click('.hq4 button:nth-child(3)');await p.waitForTimeout(500);
 if(await p.evaluate(()=>V.view)!=='diag')bad.push('0台のとき一覧に行かない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
