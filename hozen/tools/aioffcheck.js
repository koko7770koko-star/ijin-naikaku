// AI支援の確認：キー未設定・通信なしのとき、AIが要る機能の印が「🔑 キー未設定」「📵 今は通信なし」に変わり、AIなしで使える2つ（履歴検索・技術資料）はそのまま使えることを確かめる。
// 通信は止める（新しい送り先なし）。390pxではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let sent=0;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();sent++;return r.abort()});
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const badges=()=>p.evaluate(()=>({need:[...document.querySelectorAll('#app .aibadge.need')].map(e=>e.textContent),free:[...document.querySelectorAll('#app .aibadge.free')].map(e=>e.textContent),sw:document.documentElement.scrollWidth}));
 await p.evaluate(()=>{sessionStorage.removeItem(KEYSTORE);localStorage.removeItem(KEYSTORE);go('ai')});await p.waitForTimeout(300);
 let r=await badges();if(r.need.length!==6||!r.need.every(t=>/キー未設定/.test(t)))bad.push('キー未設定の印が出ない：'+r.need.join('|'));if(r.free.length!==2||!r.free.every(t=>/AIなしで使える/.test(t)))bad.push('AIなしの印が変わった');if(r.sw>392)bad.push('横にはみ出す');
 await p.evaluate(()=>{sessionStorage.setItem(KEYSTORE,'dummy-not-a-key');render()});await p.waitForTimeout(200);
 r=await badges();if(!r.need.every(t=>/APIキーが要る/.test(t)))bad.push('キーがあるのに未設定と出る：'+r.need.join('|'));
 await c.setOffline(true);await p.waitForTimeout(400);
 r=await badges();if(!r.need.every(t=>/通信なし/.test(t)))bad.push('通信なしの印が出ない：'+r.need.join('|'));if(r.sw>392)bad.push('通信なしで横にはみ出す');
 await p.evaluate(()=>go('lib'));await p.waitForTimeout(300);if(!/技術資料/.test(await p.evaluate(()=>document.querySelector('#app').innerText)))bad.push('通信なしで技術資料が開かない');
 await p.evaluate(()=>aiSearchHist('VCB'));await p.waitForTimeout(300);if(!await p.evaluate(()=>document.querySelector('#mask').classList.contains('on')))bad.push('通信なしで履歴検索が開かない');
 if(sent)bad.push('外に送ろうとした '+sent);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
