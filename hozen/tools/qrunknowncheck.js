// QR・設備IDで探す：登録の無い番号・壊れた文字・知らない盤のラベル・廃止した設備の番号を読んだとき、エラーにならず分かる言葉で知らせ、
// 登録の無い番号なら「＋ 設備ID「…」で設備を登録」で、その番号が入った設備の追加が開く。保存はしない（押して保存するまで記録は変えない）（hz-v-qr-unknown）。
// usage: node hozen/tools/qrunknowncheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.equipment=[{id:'qe1',code:'E-001',name:'試しの変圧器',kind:'変圧器',status:'稼働',repairs:[]},{id:'qe2',code:'E-OLD',name:'廃止した盤',kind:'盤',status:'廃止',repairs:[]}];save();qrScan()});await p.waitForTimeout(300);
 const before=await p.evaluate(()=>JSON.stringify([S.equipment,S.locs]));
 const toastTxt=()=>p.evaluate(()=>{const t=[...document.querySelectorAll('.toast,#toast')].map(x=>x.textContent).join(' ');return t});
 const has=await p.evaluate(()=>!!document.querySelector('#qr_id'));if(!has)bad.push('設備IDで探す欄が無い');
 // 登録の無い番号
 await p.evaluate(()=>qrOpen('EQ:ZZ-999'));await p.waitForTimeout(300);
 let t=await toastTxt();if(!/ZZ-999.*ありません/.test(t))bad.push('無い番号の知らせ：'+t);
 let r=await p.evaluate(()=>{const b=document.querySelector('#qrAddEq');return b?{t:b.textContent,h:b.getBoundingClientRect().height}:null});
 if(!r)bad.push('「この設備IDで設備を登録」が出ない');else{if(!/ZZ-999/.test(r.t))bad.push('ボタンの言葉 '+r.t);if(r.h<44)bad.push('ボタンが小さい '+r.h)}
 if(r){await p.click('#qrAddEq');await p.waitForTimeout(500);
  const m=await p.evaluate(()=>({open:document.querySelector('#mask').classList.contains('on'),code:(document.querySelector('#e_code')||{value:null}).value,h:(document.querySelector('#modal h3')||{textContent:''}).textContent,view:V.view}));
  if(!m.open||m.code!=='ZZ-999')bad.push('設備の追加にその番号が入らない '+JSON.stringify(m));if(!/設備の追加/.test(m.h))bad.push('開いた窓 '+m.h);
  await p.evaluate(()=>closeModal(true));await p.waitForTimeout(150);
  const again=await p.evaluate(()=>{editEquip();return new Promise(r=>setTimeout(()=>r((document.querySelector('#e_code')||{value:null}).value),400))});if(again!=='')bad.push('次の追加にも前の番号が残る '+again);
  await p.evaluate(()=>closeModal(true))}
 // 壊れた文字・知らない盤・空
 await p.evaluate(()=>{qrScan()});await p.waitForTimeout(200);
 for(const raw of ['<img src=x onerror=alert(1)>','\u0000\u0007ｱｲｳ','BAN:no-such-board','   ']){await p.evaluate(raw=>qrOpen(raw),raw);await p.waitForTimeout(250);t=await toastTxt();if(!t.trim())bad.push('知らせが出ない：'+JSON.stringify(raw))}
 const inj=await p.evaluate(()=>!!document.querySelector('#app img[src="x"],#modal img[src="x"]'));if(inj)bad.push('読んだ文字が HTML として入った');
 // 廃止した設備の番号は、その設備のカルテが開く
 await p.evaluate(()=>{qrScan();qrOpen('E-OLD')});await p.waitForTimeout(300);r=await p.evaluate(()=>({v:V.view,eq:V.eq}));if(r.v!=='equipDetail'||r.eq!=='qe2')bad.push('廃止した設備が開かない '+JSON.stringify(r));
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('はみ出す '+sw);
 const after=await p.evaluate(()=>JSON.stringify([S.equipment,S.locs]));if(after!==before)bad.push('保存していないのに記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
