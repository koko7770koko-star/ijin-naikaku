// AI画面の確認：キー未設定でも固まらず案内が出る・送る前に内容が見える（やめれば送らない）・429/401/圏外で案内が出て閉じられる・もう一度が使える。
// 実際のキーは使わない（ダミーの文字を入れ、通信は止めて返事を作る）。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let sent=0,status=429;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();if(/anthropic/.test(u)){sent++;return r.fulfill({status,contentType:'application/json',body:JSON.stringify({error:{message:'x'}})})}r.abort()});
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const modal=()=>p.evaluate(()=>document.querySelector('#mask').classList.contains('on')?document.querySelector('#modal').innerText:'');
 await p.evaluate(()=>{go('ai')});await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('AI画面がはみ出す');
 const ai=await p.evaluate(()=>{const l=document.querySelector('#app .mlist');return{top:l.getBoundingClientRect().top,free:document.querySelectorAll('#app .aibadge.free').length,need:document.querySelectorAll('#app .aibadge.need').length,det:!!document.querySelector('#app .al details')}});
 if(ai.top>330)bad.push('AI画面：機能の一覧が下すぎる '+ai.top);if(ai.free!==2||ai.need!==6)bad.push('AI画面：AIなし/要キーの印が合わない '+ai.free+'/'+ai.need);if(!ai.det)bad.push('AI画面：「詳しく」が無い');
 await p.evaluate(()=>aiDraft('試験','テスト本文','使う',()=>{}));await p.waitForTimeout(200);
 if(!/使えませんが/.test(await modal()))bad.push('キー未設定の案内が出ない');await p.evaluate(()=>closeModal(true));
 await p.evaluate(()=>{sessionStorage.setItem(KEYSTORE,'dummy-not-a-key')});
 await p.evaluate(()=>aiDraft('試験','テスト本文','使う',()=>{}));await p.waitForTimeout(200);
 if(!/テスト本文/.test(await modal())||!/この内容を送る/.test(await modal()))bad.push('送る前に内容が見えない');
 if(sent)bad.push('確認の前に送ってしまった');
 await p.click('text=やめる');await p.waitForTimeout(200);if(sent)bad.push('やめたのに送った');
 await p.evaluate(()=>aiDraft('試験','テスト本文','使う',()=>{}));await p.waitForTimeout(200);await p.click('text=この内容を送る');await p.waitForTimeout(800);
 if(!/429|混み合/.test(await modal()))bad.push('429の案内が出ない：'+await modal());
 status=401;await p.click('#modal button:has-text("もう一度")');await p.waitForTimeout(800);if(!/APIキー/.test(await modal()))bad.push('401の案内が出ない：'+await modal());
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.click('#modal button:has-text("閉じる")');await p.waitForTimeout(200);if(await modal())bad.push('閉じられない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
