// 日報の印刷：予定 15 件（長い備考つき）・異常 5 件・長い特記事項の日で、A4 縦にして ①全件の件名と備考の最後まで紙に出る ②1 件の行が頁の境で割れない
// （件名と備考の終わりが同じ頁）③操作ボタンの文字が紙に出ない ④横に切れない（hz-v-dailyrep-print-a4）
// usage: node hozen/tools/dailyrepmanyprintcheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const ds='2025-06-10';const r={by:'点検者',done:Date.now(),c:{}};numDefs().forEach((n,i)=>r[n.id]=String(10+i));chkDefs().forEach(c=>r.c[c.id]='○');S.daily[ds]=r;
  for(let i=0;i<15;i++)S.tasks.push({id:'dm'+i,date:ds,time:String(8+(i>>1)).padStart(2,'0')+':'+(i%2?'30':'00'),kind:'月次',cat:'',title:'予定'+(i+1)+'番 受変電設備の外観点検',place:'A棟',staff:'担当',attend:'',status:i%3?'完了':'予定',result:i%4?'良':'要観察',
   note:'備考'+(i+1)+'の始め。'+'端子の増し締めと絶縁抵抗の測定を行い、結果を記録した。'.repeat(3)+'備考'+(i+1)+'の終わり',photos:[]});
  for(let i=0;i<5;i++)S.issues.push({id:'dmi'+i,date:ds,title:'異常'+(i+1)+'番 盤内の発熱',place:'A棟 1F',status:'対応中',urgency:'中',detail:'詳細'+(i+1)+'の始め。'+'盤内の温度が高く、端子部の変色を確認した。'.repeat(3)+'詳細'+(i+1)+'の終わり',action:'増し締め',closed:'',photos:[]});
  S.dnotes=S.dnotes||{};S.dnotes[ds]=[...Array(10)].map((_,i)=>'特記'+(i+1)+'行目：受変電設備の点検結果と引き継ぎ事項').join('\n');go('dailyRep',{day:ds})});await p.waitForTimeout(400);
 await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
 const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,btn:[...document.querySelectorAll('#app button,#app .btn')].filter(x=>x.offsetParent&&getComputedStyle(x).visibility!=='hidden').map(x=>x.textContent.trim().slice(0,8))}));
 if(r.btn.length)errs.push('操作ボタンが紙に出る '+r.btn.join(' '));
 const buf=await p.pdf({format:'A4',printBackground:true});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 if(n>4)errs.push('A4 が '+n+' 枚になる（4 枚まで）');
 try{const f=path.join(os.tmpdir(),'dmp'+process.pid+'.pdf');fs.writeFileSync(f,buf);
  const pages=[];for(let i=1;i<=n;i++)pages.push(execSync('pdftotext -f '+i+' -l '+i+' -raw '+f+' -',{encoding:'utf8'}).replace(/\s+/g,''));fs.unlinkSync(f);
  if(process.env.DUMP)console.log(pages.join('\n=====\n'));
  const at=k=>pages.findIndex(t=>t.includes(k));
  for(let i=1;i<=15;i++){const a=at('予定'+i+'番'),z=at('備考'+i+'の終わり');if(a<0)errs.push('紙に出ない：予定'+i+'番');else if(z<0)errs.push('紙に備考の最後が出ない：予定'+i+'番');else if(a!==z)errs.push('予定'+i+'番の行が頁の境で割れる（件名 '+(a+1)+' 枚目・備考の終わり '+(z+1)+' 枚目）')}
  for(let i=1;i<=5;i++){const a=at('異常'+i+'番');if(a<0)errs.push('紙に出ない：異常'+i+'番')}
  for(const k of ['特記1行目','特記10行目'])if(at(k)<0)errs.push('紙に出ない：'+k);
  pages.forEach((t,i)=>{if(t.length<40)errs.push('A4 '+(i+1)+' 枚目がほとんど空')})}catch(e){if(!/not found|ENOENT/.test(String(e.message)))errs.push('pdftotext '+e.message)}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
