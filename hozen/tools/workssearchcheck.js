// 作業管理の確認：作業が300件（未完了240）あっても開くのが速く（300ms以内）、キーワード欄で件名・番号・担当から絞れ（1文字ごとに待ち時間を置いて描画）、
// 絞った件数が出る・欄を空にすると戻る・390pxではみ出さないことを確かめる。保存の形は変えない。usage: node hozen/tools/workssearchcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>{S.works=[...Array(300)].map((_,i)=>({id:'w'+i,no:'W'+String(i+1).padStart(3,'0'),title:'作業'+i+'（名前の長い作業 受変電設備の絶縁抵抗測定と清掃）',kind:'点検',status:['起案','承認待ち','承認済み','実施中','完了'][i%5],date:addD(TODAY,i%40-10),start:'09:00',endDate:'',end:'17:00',equipIds:[],locId:'',place:'A棟',staff:['職員'+(i%6+1)],vendor:i%7?'':'○○電気工事（株）',vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''}));save();return JSON.stringify(S.works)});
 const t0=Date.now();await p.evaluate(()=>go('works'));await p.waitForSelector('#wkQ');const ms=Date.now()-t0;if(ms>300)bad.push('開くのが遅い '+ms+'ms');
 await p.fill('#wkQ','');await p.focus('#wkQ');await p.keyboard.type('W001');await p.waitForTimeout(700);
 let r=await p.evaluate(()=>({n:document.querySelectorAll('#app .item').length,t:document.querySelector('#app').innerText.match(/作業指示\s*(\d+)件/),q:document.getElementById('wkQ').value,foc:document.activeElement&&document.activeElement.id}));
 if(r.n!==1)bad.push('「W001」で '+r.n+' 件（1件のはず）');if(r.q!=='W001')bad.push('入力が消えた '+r.q);if(r.foc!=='wkQ')bad.push('描画のあと入力欄から外れた');
 await p.fill('#wkQ','○○電気工事');await p.waitForTimeout(700);r=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(r<30)bad.push('協力会社で絞れない '+r);
 await p.fill('#wkQ','職員3');await p.waitForTimeout(700);r=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(r<30)bad.push('担当で絞れない '+r);
 await p.fill('#wkQ','');await p.waitForTimeout(700);r=await p.evaluate(()=>({n:document.querySelectorAll('#app .item').length,sw:document.documentElement.scrollWidth}));if(r.n<100)bad.push('空にしても戻らない '+r.n);if(r.sw>392)bad.push('横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 const after=await p.evaluate(()=>JSON.stringify(S.works));if(after!==before)bad.push('検索で記録が変わった');
 console.log('open ms',ms);console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
