// 日報の印刷：申し送りと特記事項が 30 行ずつある日で、①改行が紙に残る（1 行にくっつかない）②長い欄が丸ごと次の頁へ送られて前の頁が空にならない（各頁に文字がある・前の頁の下が大きく空かない）③最後の行まで紙に出る（hz-v-dailyrep-longnote）
// usage: node hozen/tools/dailyreplongnotecheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const ds='2025-06-10';const r={by:'点検者',done:Date.now(),c:{}};numDefs().forEach((n,i)=>r[n.id]=String(10+i));chkDefs().forEach(c=>r.c[c.id]='○');S.daily[ds]=r;
  for(let i=0;i<3;i++)S.tasks.push({id:'dl'+i,date:ds,time:'1'+i+':00',kind:'月次',cat:'',title:'試しの作業'+i+' 受変電設備の外観点検',place:'',staff:'担当',attend:'',status:'完了',result:'良',note:'',photos:[]});
  const L=n=>[...Array(30)].map((_,i)=>n+(i+1)+'行目の文（長めの文章のテスト：受変電設備の点検結果と引き継ぎ事項）').join('\n');
  S.handover=S.handover||{};S.handover[ds]={text:L('申継'),by:'',at:Date.now()};S.dnotes=S.dnotes||{};S.dnotes[ds]=L('特記');go('dailyRep',{day:ds})});await p.waitForTimeout(400);
 await p.emulateMedia({media:'print'});
 const nl=await p.evaluate(()=>[...document.querySelectorAll('.rep td.obs')].filter(e=>/^(申継|特記)1行目/.test(e.textContent)).map(e=>({h:e.getBoundingClientRect().height,ws:getComputedStyle(e).whiteSpace})));
 if(nl.length!==2)errs.push('申し送りと特記事項の欄が '+nl.length+' 個（2 個のはず）');
 nl.forEach((x,i)=>{if(!/pre/.test(x.ws))errs.push('欄'+(i+1)+'の改行が紙で消える（white-space:'+x.ws+'）');if(x.h<300)errs.push('欄'+(i+1)+'の高さが '+Math.round(x.h)+'px（30 行が出ていない）')});
 const buf=await p.pdf({format:'A4'});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 if(n>4)errs.push('A4 が '+n+' 枚になる（4 枚まで）');
 try{const f=path.join(os.tmpdir(),'dln'+process.pid+'.pdf');fs.writeFileSync(f,buf);
  const all=execSync('pdftotext -layout '+f+' -',{encoding:'utf8'}).replace(/\s+/g,'');
  for(const k of ['申継1行目','申継30行目','特記1行目','特記30行目'])if(!all.includes(k))errs.push('紙に出ない：'+k);
  for(let i=1;i<=n;i++){const t=execSync('pdftotext -f '+i+' -l '+i+' -layout '+f+' -',{encoding:'utf8'});const L=t.split('\n').filter(x=>x.trim()).length;if(L<8)errs.push('A4 '+i+' 枚目の文字が少ない（'+L+' 行）。空に近い頁が出ている')}
  try{const pi=execSync('pdftoppm -v 2>&1 || true',{encoding:'utf8'})}catch(e){}
  fs.unlinkSync(f)}catch(e){if(!/not found|ENOENT/.test(String(e.message)))errs.push('pdftotext '+e.message)}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
