// 予備品：出庫で記録上の在庫より多い数を入れたとき、1回目は知らせだけで記録しない・もう一度押すと在庫 0 で記録（マイナスにならない）。0・空は断る。保存の形は変わらない
// usage: node hozen/tools/stocknegcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.parts=[{id:'p1',code:'',name:'ヒューズ 10A',spec:'',maker:'',place:'',unit:'個',qty:3,min:'',price:'',equipIds:[],note:''}];S.moves=[];save();go('stock',{stTab:'parts'})});await p.waitForTimeout(300);
 const keys0=await p.evaluate(()=>Object.keys(S.parts[0]).sort().join());
 const st=()=>p.evaluate(()=>({q:S.parts[0].qty,m:S.moves.length,last:S.moves[S.moves.length-1],w:(document.querySelector('#sm_w')||{}).innerText||'',open:!!document.querySelector('#sm_n')}));
 const press=async v=>{if(!await p.evaluate(()=>!!document.querySelector('#modal #sm_n')&&document.querySelector('#sm_n').offsetParent!==null)){errs.push('出庫の窓が閉じている（記録された）');console.log(errs.join('\n'));await b.close();process.exit(1)}await p.fill('#sm_n',v);await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal button')].find(x=>/出庫を記録/.test(x.innerText));b.click()});await p.waitForTimeout(250)};
 await p.evaluate(()=>stockMove('p1','出庫'));await p.waitForTimeout(200);
 // 0 と空は断る
 await press('0');let r=await st();if(r.m!==0||r.q!==3)errs.push('0 で記録された');
 await press('');r=await st();if(r.m!==0||r.q!==3)errs.push('空で記録された');
 // 多すぎ：1回目は記録しない
 await press('5');r=await st();
 if(r.m!==0||r.q!==3)errs.push('1回目で記録された '+JSON.stringify(r));if(!/記録上の在庫は 3個/.test(r.w))errs.push('在庫の数の知らせが出ない: '+r.w);if(!r.open)errs.push('窓が閉じた');
 // 数を変えたらもう一度知らせ（別の数で2回目扱いにしない）
 await press('6');r=await st();if(r.m!==0)errs.push('数を変えた1回目で記録された');
 // 同じ数で2回目 → 0 で記録
 await press('6');r=await st();
 if(r.q!==0)errs.push('在庫が 0 にならない '+r.q);if(r.m!==1||!r.last||r.last.after!==0||r.last.qty!==6||r.last.type!=='出庫')errs.push('入出庫の記録が違う '+JSON.stringify(r.last));
 // 0 のあとさらに出庫してもマイナスにならない
 await p.evaluate(()=>stockMove('p1','出庫'));await p.waitForTimeout(200);await press('2');await press('2');r=await st();
 if(r.q<0||!Number.isFinite(r.q))errs.push('マイナス／NaN '+r.q);
 // 普通の出庫・入庫・棚卸はそのまま
 await p.evaluate(()=>{S.parts[0].qty=10;save();stockMove('p1','出庫')});await p.waitForTimeout(200);await press('4');r=await st();if(r.q!==6)errs.push('普通の出庫が違う '+r.q);
 await p.evaluate(()=>stockMove('p1','入庫'));await p.waitForTimeout(200);await p.fill('#sm_n','1.5');await p.evaluate(()=>{[...document.querySelectorAll('#modal button')].find(x=>/入庫を記録/.test(x.innerText)).click()});await p.waitForTimeout(250);r=await st();if(r.q!==7.5)errs.push('小数の入庫が違う '+r.q);
 await p.evaluate(()=>stockMove('p1','棚卸'));await p.waitForTimeout(200);await p.fill('#sm_n','0');await p.evaluate(()=>{[...document.querySelectorAll('#modal button')].find(x=>/棚卸を記録/.test(x.innerText)).click()});await p.waitForTimeout(250);r=await st();if(r.q!==0)errs.push('棚卸 0 ができない '+r.q);
 if(await p.evaluate(()=>Object.keys(S.parts[0]).sort().join())!==keys0)errs.push('部品の項目が変わった');
 const saved=await p.evaluate(()=>{const k=Object.keys(localStorage).find(k=>/hospElecSched_v1/.test(k));return k?JSON.parse(localStorage.getItem(k)):null});
 if(!saved)errs.push('保存が見つからない');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))errs.push('横にはみ出す');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
