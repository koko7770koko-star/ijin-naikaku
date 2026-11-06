// QRラベルを 20 台分と 60 台分（頁をまたぐ）、実際に A4 の PDF にして確かめる（hz-v-qr-print-many）：ラベルが頁の境で割れず（各設備の番号と名前が同じ頁に全部ある）、
// 30 字の長い設備名が最後の字まで紙に出る。保存の形は変えない。
// usage: node hozen/tools/qrprintpdfcheck.js   （pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[],errs=[];
(async()=>{const b=await chromium.launch();for(const CNT of [20,60]){const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 // 名前は「設備」の形で 30 字（最後の 2 字を番号ごとに変えて、途中で切れたら分かるようにする）
 const names=Array.from({length:CNT},(_,i)=>{const t='設備'+(i+1)+'番の長い名前の受変電設備高圧受電盤動力分電盤';const tail='末'+String.fromCharCode(0x30A2+i%40)+(i>=40?'弐':'');return (t+'ーーーーーーーーーーーーーーーー').slice(0,30-tail.length)+tail});
 await p.evaluate(N=>{S.equipment=N.map((n,i)=>({id:'eq'+i,code:'Q-'+String(i+1).padStart(3,'0'),name:n,locId:'',place:'',kind:'',importance:'',status:'稼働',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}));go('qr')},names);
 await p.waitForTimeout(400);
 const f=path.join(os.tmpdir(),'qrprintpdf-'+process.pid+'.pdf');await p.pdf({path:f,format:'A4',printBackground:true});
 try{const np=+(/Pages:\s+(\d+)/.exec(execSync('pdfinfo '+f,{encoding:'utf8'}))||[])[1];const pages=[];
  for(let i=1;i<=np;i++)pages.push(execSync('pdftotext -f '+i+' -l '+i+' -raw '+f+' -',{encoding:'utf8'}).replace(/\s+/g,''));
  names.forEach((n,i)=>{const code='Q-'+String(i+1).padStart(3,'0');const pc=pages.findIndex(t=>t.includes(code));
   if(pc<0)return bad.push(CNT+'台・'+code+'：紙に番号が無い');
   if(!pages[pc].includes(n))bad.push(CNT+'台・'+code+'：名前が最後まで同じ頁に無い（頁の境で割れた・切れた）「'+n+'」');
   if(pages.filter(t=>t.includes(code)).length>1)bad.push(CNT+'台・'+code+'：同じラベルが 2 頁に出る')});
  console.log(CNT+'台：頁数 '+np);
 }catch(e){bad.push('pdftotext '+e.message)}finally{try{fs.unlinkSync(f)}catch(_){}}
 await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
