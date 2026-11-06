// 設備カルテの印刷：設備の備考・修理履歴の内容が 40 行あるとき、①改行が紙に残る（1 行にくっつかない）②最後の行まで紙に出る③前の頁が空にならない（各頁に文字がある）（hz-v-eqcard-longrow）
// usage: node hozen/tools/eqcardlongrowcheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:718,height:1047}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const L=n=>[...Array(40)].map((_,i)=>n+(i+1)+'行目の文（長めの文章のテスト：受変電設備の修理内容）').join('\n');
  S.equipment=[{id:'ed0',code:'E-001',name:'設備1',kind:'受変電',importance:'A',status:'稼働',maker:'',model:'',serial:'',installed:'2010-04',life:20,place:'',note:L('備考'),photos:[],docs:[],repairs:[{id:'r1',date:'2026-10-01',kind:'修理',content:L('修理'),vendor:'',cost:'',photos:[]},{id:'r2',date:'2026-09-01',kind:'故障',content:'短い内容',vendor:'',cost:'',photos:[]}],health:[]}];S.issues=[];save();go('equipDetail',{eq:'ed0',eqTab:'rec'})});
 await p.waitForTimeout(300);await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
 const ws=await p.evaluate(()=>{const o=[];for(const e of document.querySelectorAll('#app .item .ti'))if(/^修理：修理1行目/.test(e.textContent))o.push(getComputedStyle(e).whiteSpace+'|'+Math.round(e.getBoundingClientRect().height));return o});
 if(ws.length<1)errs.push('修理履歴の長い行が出ない');else{const [w,h]=ws[ws.length-1].split('|');if(!/pre/.test(w))errs.push('修理履歴の改行が紙で消える（white-space:'+w+'・高さ '+h+'px）')}
 await p.evaluate(()=>go('equipDetail',{eq:'ed0',eqTab:'ov'}));await p.waitForTimeout(250);
 const nb=await p.evaluate(()=>{const t=[...document.querySelectorAll('#app td,#app .meta,#app .obs,#app p,#app div')].find(e=>e.children.length===0&&/^備考1行目/.test(e.textContent.trim()));return t?getComputedStyle(t).whiteSpace+'|'+Math.round(t.getBoundingClientRect().height):'none'});
 if(nb==='none')errs.push('設備の備考が出ていない');else if(!/pre/.test(nb.split('|')[0]))errs.push('設備の備考の改行が紙で消える（white-space:'+nb+'）');
 for(const [tab,keys] of [['rec',['修理1行目','修理40行目','短い内容']],['ov',['備考1行目','備考40行目']]]){
  await p.evaluate(t=>go('equipDetail',{eq:'ed0',eqTab:t}),tab);await p.waitForTimeout(250);
  const buf=await p.pdf({format:'A4'});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
  try{const f=path.join(os.tmpdir(),'ecl'+process.pid+'.pdf');fs.writeFileSync(f,buf);
   const all=execSync('pdftotext -raw '+f+' -',{encoding:'utf8'}).replace(/\s+/g,'');
   for(const k of keys)if(!all.includes(k))errs.push('紙に出ない（'+tab+'）：'+k);
   for(let i=1;i<n;i++){const t=execSync('pdftotext -f '+i+' -l '+i+' -raw '+f+' -',{encoding:'utf8'});const L=t.split('\n').filter(x=>x.trim()).length;if(L<8)errs.push('A4 '+i+' 枚目（'+tab+'）の文字が少ない（'+L+' 行）。前の頁が空に近い')}
   fs.unlinkSync(f)}catch(e){if(!/not found|ENOENT/.test(String(e.message)))errs.push('pdftotext '+e.message)}}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
