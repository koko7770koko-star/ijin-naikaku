// 在庫（予備品）の探す欄の確認（hz-stock-search）：30品目で名前・型式・置き場所で絞れる・0件のとき「条件を外す」（44px以上）で全部に戻る・390pxではみ出さない・保存データは変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.parts=Array.from({length:30},(_,i)=>({id:'p'+i,code:'C'+i,name:(i%2?'ヒューズ':'ランプ')+'-'+i,spec:i%3?'':'型式Z',maker:'',place:i%2?'棚A':'棚B',unit:'個',qty:5,min:'',price:'',equipIds:[],note:''}));V.ptQ='';V.ptLow=0;V.stTab='parts';go('stock')});await p.waitForTimeout(300);
 const before=await p.evaluate(()=>JSON.stringify(S.parts));
 const cnt=()=>p.evaluate(()=>document.querySelectorAll('#app .item').length);
 if(!await p.evaluate(()=>!!document.querySelector('#ptQ')))bad.push('探す欄が出ない');
 const n0=await p.evaluate(()=>S.parts.length);
 await p.fill('#ptQ','ヒューズ');await p.waitForFunction(()=>V.ptQ==='ヒューズ',null,{timeout:3000}).catch(()=>bad.push('入力しても絞れない（oninput）'));await p.waitForTimeout(150);
 const hit=await p.evaluate(()=>document.querySelectorAll('#app .item').length);
 await p.evaluate(()=>{V.ptQ='棚B';render()});await p.waitForTimeout(150);const hb=await cnt();
 if(!(hb>0&&hb<hit+30))bad.push('置き場所で絞れない');
 await p.evaluate(()=>{V.ptQ='ありえない言葉';render()});await p.waitForTimeout(150);
 const bh=await p.evaluate(()=>{const e=document.querySelector('#ptQClr');return e?e.getBoundingClientRect().height:0});
 if(!bh)bad.push('0件で「条件を外す」が出ない');else if(bh<44)bad.push('条件を外すが44px未満');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 if(bh){await p.click('#ptQClr');await p.waitForTimeout(200);if(await p.evaluate(()=>document.querySelector('#ptQ').value))bad.push('探す欄が空にならない');if(await p.evaluate(()=>V.ptQ))bad.push('V.ptQが空にならない')}
 if(await p.evaluate(()=>JSON.stringify(S.parts))!==before)bad.push('保存データが変わった');
 if(n0!==30)bad.push('準備失敗');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
