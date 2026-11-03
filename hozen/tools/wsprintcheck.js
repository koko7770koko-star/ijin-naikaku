// 作業表（14日間）の印刷の確認：作業40件の2週間を A4 縦の PDF にして、PDFにできる・表の見出しが thead（次のページにも出る）・行がページの境で割れない設定・
// 列が細くなりすぎない・390px でも横にはみ出さないことを確かめる。usage: node hozen/tools/wsprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>{S.works=[...Array(40)].map((_,i)=>({id:'w'+i,no:'W'+String(i+1).padStart(3,'0'),title:'作業'+i+'（名前の長い作業 受変電設備の絶縁抵抗測定と清掃）',kind:'点検',status:i%3?'承認済み':'実施中',date:addD(TODAY,i%14),start:'09:00',endDate:i%7===0?addD(TODAY,(i%14)+1):'',end:'17:00',equipIds:[],locId:'',place:'A棟',staff:['職員'+(i%6+1),'職員'+(i%6+2)],vendor:i%2?'○○電気工事（株）':'',vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:i%5===0,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''}));go('workSheet');return JSON.stringify(S.works)});await p.waitForTimeout(500);
 const sc=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,n:document.querySelectorAll('.rep tbody tr').length}));
 if(sc.n<40)bad.push('作業が '+sc.n+' 行（40のはず）');if(sc.sw>392)bad.push('390pxで横にはみ出す '+sc.sw);
 await p.setViewportSize({width:718,height:1000});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const t=document.querySelector('.rep table');const o={thead:!!(t&&t.querySelector('thead')),tr:getComputedStyle(t.querySelector('tbody tr')).breakInside,hd:getComputedStyle(t.querySelector('thead')).display,narrow:[],sw:document.documentElement.scrollWidth,over:t.getBoundingClientRect().right>innerWidth+1};
  for(const c of t.querySelectorAll('thead th')){const w=c.getBoundingClientRect().width;if(w<28)o.narrow.push(c.textContent+':'+Math.round(w))}return o});
 if(!r.thead)bad.push('見出しが thead でない');if(r.hd!=='table-header-group')bad.push('見出しが次のページに出ない設定でない '+r.hd);if(r.tr!=='avoid')bad.push('行が割れる設定 '+r.tr);if(r.narrow.length)bad.push('列が細い '+r.narrow.join(' '));if(r.over||r.sw>722)bad.push('印刷幅ではみ出す');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<5000)bad.push('PDFが作れない');
 const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;console.log('pages',pages);if(pages<2)bad.push('40件が1ページに収まるはずがない（表示が切れている？）');
 if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 const after=await p.evaluate(()=>JSON.stringify(S.works));if(after!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
