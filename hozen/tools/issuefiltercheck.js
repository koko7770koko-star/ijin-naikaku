// 不具合の一覧：異常50件（A・B棟）で、キーワード欄が打つたびに（350ms 待って）絞れ、棟でも絞れる。
// 棟の絞り込みは設備の場所（棟の下）か、場所の文字に棟の名前があるもの。画面の状態だけで保存は変えない。390px ではみ出さない。
// usage: node hozen/tools/issuefiltercheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('bA','A棟','建屋',''),mk('fA','1F','階','bA'),mk('bB','B棟','建屋',''),mk('fB','1F','階','bB')];
  S.equipment=[{id:'eA',code:'A-1',name:'受電盤A',kind:'分電盤',status:'稼働',locId:'fA',photos:[],docs:[],repairs:[],health:[]},{id:'eB',code:'B-1',name:'受電盤B',kind:'分電盤',status:'稼働',locId:'fB',photos:[],docs:[],repairs:[],health:[]}];
  S.issues=[...Array(50)].map((_,i)=>({id:'i'+i,date:addD(TODAY,-i),title:(i%5===0?'異臭 ':'点検 ')+i,place:i%10===0?'B棟 電気室':'',status:'発見',equipId:i%10===0?'':(i%2?'eA':'eB'),urgency:'中',detail:'',action:'',cause:''}));
  V.isF='all';save();go('issues')});await p.waitForTimeout(300);
 const cnt=()=>p.evaluate(()=>document.querySelectorAll('#app .card .item').length);
 if(await cnt()!==50)bad.push('最初の件数 '+await cnt());
 const t=await p.evaluate(()=>({type:document.querySelector('#isQ')?.type,sel:!!document.querySelector('select[aria-label="棟で絞り込む"]')}));if(t.type!=='search')bad.push('検索欄が search でない');if(!t.sel)bad.push('棟の選択が無い');
 await p.type('#isQ','異臭');await p.waitForTimeout(700);if(await cnt()!==10)bad.push('「異臭」で絞れない '+await cnt());
 if(await p.evaluate(()=>document.activeElement&&document.activeElement.id)!=='isQ')bad.push('絞ったあと入力欄から抜ける');
 await p.fill('#isQ','');await p.dispatchEvent('#isQ','input');await p.waitForTimeout(700);
 await p.selectOption('select[aria-label="棟で絞り込む"]','bA');await p.waitForTimeout(200);const na=await cnt();
 await p.selectOption('select[aria-label="棟で絞り込む"]','bB');await p.waitForTimeout(200);const nb=await cnt();
 // eA は奇数 i（i%10!==0）で 25件、eB は偶数 i で i%10!==0 の 20件、place が B棟 の 5件
 if(na!==25)bad.push('A棟の件数 '+na+'（25のはず）');if(nb!==25)bad.push('B棟の件数 '+nb+'（20＋場所がB棟の5＝25のはず）');
 await p.selectOption('select[aria-label="棟で絞り込む"]','');await p.waitForTimeout(200);if(await cnt()!==50)bad.push('棟：すべてで戻らない');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('はみ出す '+sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
