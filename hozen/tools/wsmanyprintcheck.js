// 作業表（workSheet）の印刷（hz-works-sheet-print-nobg）：作業40件（長い件名）の14日分を、背景のグラフィックなし（printBackground:false）でPDFにして、
// 2ページ目以降にも表の見出し（日付・時間・作業・担当）が文字で出る・各行の件名が1ページの中で割れない・背景色だけの印が無い。
const {chromium}=require('playwright');const path=require('path');const cp=require('child_process');const fs=require('fs');const os=require('os');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{S.works=[...Array(40)].map((_,i)=>({id:'w'+i,no:'W'+String(i+1).padStart(3,'0'),title:'作業'+String(i+1).padStart(2,'0')+'号 受変電設備の絶縁抵抗測定と清掃（名前の長い作業）',kind:'点検',status:i%3?'承認済み':'実施中',date:addD(TODAY,i%14),start:'09:00',endDate:i%7===0?addD(TODAY,(i%14)+1):'',end:'17:00',equipIds:[],locId:'',place:'A棟',staff:['職員'+(i%6+1),'職員'+(i%6+2)],vendor:i%2?'○○電気工事（株）':'',vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:i%5===0,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''}));go('workSheet');});await p.waitForTimeout(500);
 await p.waitForTimeout(500);
 const n=await p.evaluate(()=>document.querySelectorAll('.rep tbody tr').length);if(n<40)bad.push('作業が '+n+' 行（40のはず）');
 await p.setViewportSize({width:718,height:1000});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:false});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wsm-'));const f=path.join(dir,'a.pdf');fs.writeFileSync(f,buf);
 const txt=cp.execFileSync('pdftotext',['-layout',f,'-'],{encoding:'utf8'});const pages=txt.split('\f').filter(s=>s.trim());
 console.log('pages',pages.length);
 if(pages.length<2)bad.push('2ページ以上にならない');
 pages.forEach((pg,i)=>{if(!/日付/.test(pg)||!/担当/.test(pg))bad.push((i+1)+'ページ目に表の見出しが出ない')});
 for(let i=1;i<=40;i++){const k='作業'+String(i).padStart(2,'0')+'号';const hit=pages.filter(pg=>pg.includes(k)).length;if(hit!==1)bad.push(k+' が '+hit+' ページに出る（1ページのはず）')}
 const bg=await p.evaluate(()=>[...document.querySelectorAll('.rep td,.rep th')].filter(e=>{const s=getComputedStyle(e);return s.color==='rgb(255, 255, 255)'}).length);if(bg)bad.push('白い文字（背景なしで消える）が '+bg+' 件');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
