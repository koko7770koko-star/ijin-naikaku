// 数の読み取り：設備台帳・予備品の CSV を読み戻すとき、全角の数字（１２．５）・桁区切りのカンマ（1,200）・全角マイナスも半角の数として読む。
// 画面の数値欄は type=number（ブラウザが半角の数以外を受けない）ことも確かめる。保存される値は数のまま（形は変えない）。
// usage: node hozen/tools/zenkakucheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const eq='区分,設備ID,設備名称,設置場所,メーカー,型式,製造番号,設置年月,点検周期,日付,種類,内容,業者・対応者,費用,備考,階層,種別,重要度,状態,耐用年数,更新予定,更新費用\r\n設備,E-1,分電盤,,,,,,,,,,,,,,,,,２０,２０３０,"1,200,000"\r\n履歴,E-1,分電盤,,,,,,,2026-01-05,修理,増し締め,,"３，０００",\r\n';
 const r=await p.evaluate(t=>{const P=planEquipCsv(t);return {life:P.eqs[0].o.life,y:P.eqs[0].o.renewYear,cost:P.eqs[0].o.renewCost,rc:P.reps[0]&&P.reps[0].o.cost,skip:P.skip.length}},eq);
 if(r.life!==20||r.y!==2030||r.cost!==1200000||r.rc!==3000||r.skip)bad.push('設備台帳の全角・カンマ '+JSON.stringify(r));
 const st='品番,品名,仕様,メーカー,保管場所,在庫,単位,最低在庫,単価,使用設備\r\nF-1,ヒューズ,,,,"１２",本,"５",1 200,\r\n';
 const r2=await p.evaluate(t=>{const P=planStockCsv(t);return {n:P.items.length,qty:P.items[0]&&P.items[0].qty,min:P.items[0]&&P.items[0].o.min,price:P.items[0]&&P.items[0].o.price,skip:P.skip.length}},st);
 if(r2.n!==1||r2.qty!==12||r2.min!==5||r2.price!==1200||r2.skip)bad.push('予備品の全角 '+JSON.stringify(r2));
 // 数でない値は今までどおり読み飛ばす
 const r3=await p.evaluate(t=>planStockCsv(t).skip.length,'品番,品名,仕様,メーカー,保管場所,在庫,単位,最低在庫,単価,使用設備\r\nF-2,x,,,,abc,,,,\r\n');if(r3!==1)bad.push('数でない値を飛ばさない');
 // 画面の数値欄は type=number
 const t=await p.evaluate(()=>{go('day',{day:TODAY});const n=numDefs()[0];const e=document.getElementById('n_'+n.id);return e&&e.type});if(t!=='number')bad.push('日常点検の数値欄が type=number でない '+t);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
