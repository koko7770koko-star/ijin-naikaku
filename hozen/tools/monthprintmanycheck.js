// カレンダーの月の印刷：1 日に予定 8 件・件名が長い日がある月で、マスの文字が切れない（紙に全件の件名の最後まで出る）・「ほか」で省かれない・A4 2 ページまで（hz-v-month-print-many）
// usage: node hozen/tools/monthprintmanycheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0);
 const T=[...Array(8)].map((_,i)=>'長い件名の点検'+(i+1)+'（受変電設備の絶縁抵抗測定と端末の増し締め・末尾'+(i+1)+'）');
 await p.evaluate(T=>{T.forEach((t,i)=>S.tasks.push({id:'pm'+i,date:'2027-01-14',time:'',kind:'月次',cat:'',title:t,place:'',staff:'',attend:'',status:'予定',result:'',note:''}));
  S.tasks.push({id:'pm9',date:'2027-01-20',time:'',kind:'月次',cat:'',title:'ふつうの1件',place:'',staff:'',attend:'',status:'予定',result:'',note:''});
  V.view='month';V.y=2027;V.m=1;V.sel='2027-01-14';render()},T);await p.waitForTimeout(300);
 await p.emulateMedia({media:'print'});
 const r=await p.evaluate(()=>({t:document.querySelectorAll('table.mpt .t').length,cut:[...document.querySelectorAll('table.mpt td')].filter(td=>td.scrollHeight>td.clientHeight+2).length,more:/ほか\s*\d+\s*件/.test(document.querySelector('table.mpt')?.textContent||''),tbl:!!document.querySelector('table.mpt')}));
 if(!r.tbl)errs.push('印刷の表が無い');if(r.t!==9)errs.push('印刷の表の予定が '+r.t+' 件（9 件のはず）');if(r.cut)errs.push('マスの文字が切れている '+r.cut+' マス');if(r.more)errs.push('「ほか n件」で省かれている');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;if(pages>2)errs.push('印刷が '+pages+' ページになる（長い件名が8件の日があっても2ページまで）');
 try{const f=path.join(os.tmpdir(),'mpm'+process.pid+'.pdf');fs.writeFileSync(f,buf);const txt=execSync('pdftotext -layout '+f+' -',{encoding:'utf8'}).replace(/\s+/g,'');fs.unlinkSync(f);
  T.forEach((t,i)=>{if(!txt.includes('末尾'+(i+1)+'）'))errs.push('紙に件名の最後が出ない：'+(i+1)+' 件目')})}catch(e){if(!/not found|ENOENT/.test(String(e.message)))errs.push('pdftotext '+e.message)}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
