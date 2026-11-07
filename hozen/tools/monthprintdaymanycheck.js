// カレンダーの月の印刷：1 日に予定 40 件が集まった日（ほかの日も 3 件ずつ）がある月で、紙に 40 件全部が出て（「ほか」で省かない：monthprintmanycheck と同じ決まり）、
// マスの文字が切れず、その週の行がページの境で割れず（40 件が同じページ）、A4 3 ページまで、画面は 1 秒以内か（hz-v-calendar-print-many）。
// 保存の形は変えない。usage: node hozen/tools/monthprintdaymanycheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const ms=await p.evaluate(()=>{for(let i=0;i<40;i++)S.tasks.push({id:'pm'+i,date:'2027-01-14',time:'',kind:'月次',cat:'',title:'集中'+(i+1)+'番の盤の月次点検',place:'',staff:'',attend:'',status:i%3?'予定':'完了',result:'',note:''});
  for(let d=1;d<=31;d++)for(let k=0;k<3;k++)S.tasks.push({id:'q'+d+'_'+k,date:'2027-01-'+String(d).padStart(2,'0'),time:'',kind:'月次',cat:'',title:'日'+d+'の点検'+k,place:'',staff:'',attend:'',status:'予定',result:'',note:''});
  V.view='month';V.y=2027;V.m=1;V.sel='2027-01-14';const t=performance.now();render();return performance.now()-t});
 if(ms>1000)errs.push('画面が出るまで '+Math.round(ms)+'ms');
 await p.waitForTimeout(300);if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)errs.push('390px ではみ出す');
 await p.emulateMedia({media:'print'});
 const r=await p.evaluate(()=>({t:document.querySelectorAll('table.mpt .t').length,cut:[...document.querySelectorAll('table.mpt td')].filter(td=>td.scrollHeight>td.clientHeight+2).length,more:/ほか\s*\d+\s*件/.test(document.querySelector('table.mpt')?.textContent||''),tbl:!!document.querySelector('table.mpt')}));
 if(!r.tbl)errs.push('印刷の表が無い');if(r.t!==40+93)errs.push('印刷の表の予定が '+r.t+' 件（133 件のはず）');if(r.cut)errs.push('マスの文字が切れている '+r.cut+' マス');if(r.more)errs.push('「ほか n件」で省かれている');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;if(pages>3)errs.push('印刷が '+pages+' ページ');
 try{const f=path.join(os.tmpdir(),'mpd'+process.pid+'.pdf');fs.writeFileSync(f,buf);
  const pg=[];for(let k=1;k<=pages;k++)pg.push(execSync(`pdftotext -f ${k} -l ${k} -raw ${f} -`,{encoding:'utf8'}).replace(/\s+/g,''));fs.unlinkSync(f);
  const on=n=>pg.findIndex(t=>t.includes('集中'+n+'番'));const first=on(1);
  const miss=[...Array(40)].map((_,i)=>i+1).filter(n=>on(n)<0);if(miss.length)errs.push('紙に出ない予定 '+miss.join(','));
  const split=[...Array(40)].map((_,i)=>i+1).filter(n=>on(n)>=0&&on(n)!==first);if(split.length)errs.push('40 件の日がページの境で割れる（'+split.join(',')+' が別のページ）');
  console.log('印刷 '+pages+' ページ・40 件は '+(first+1)+' ページ目')}catch(e){if(!/not found|ENOENT/.test(String(e.message)))errs.push('pdftotext '+e.message)}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
