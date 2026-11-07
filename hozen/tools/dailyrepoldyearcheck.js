// 日報：去年の 12/31 を開くと、上の日付の切り替え（‹ ›）と A4 の印刷の見出しに年が出て、次の日（1/1）・前の日へ移ると、その日の特記事項・異常が出るか。今年の日付には年を出さない（hz-v-dailyrep-oldyear）。
// usage: node hozen/tools/dailyrepoldyearcheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execSync}=require('child_process');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const Y=await p.evaluate(()=>{const y=+TODAY.slice(0,4)-1,a=y+'-12-31',n=(y+1)+'-01-01',pv=y+'-12-30';S.dnotes=S.dnotes||{};S.dnotes[a]='大みそかの特記事項X';S.dnotes[n]='元日の特記事項Y';S.dnotes[pv]='前の日の特記事項Z';
  S.issues=(S.issues||[]).concat([{id:'isY1',date:a,title:'大みそかの異常',place:'',status:'対応中',action:'',closed:'',detail:''}]);save();return y});
 const before=await p.evaluate(()=>JSON.stringify([S.daily,S.dnotes,S.issues]));
 const look=()=>p.evaluate(()=>({day:V.day,lab:(document.querySelector('#app .mnav .t')||{textContent:''}).textContent.trim(),ta:(document.querySelector('#app textarea')||{value:''}).value,body:document.querySelector('#app').textContent,sw:document.documentElement.scrollWidth}));
 await p.evaluate(y=>go('dailyRep',{day:y+'-12-31'}),Y);await p.waitForTimeout(200);let r=await look();
 if(!r.lab.startsWith(Y+'/12/31'))bad.push('12/31 の見出しに年が無い：'+r.lab);if(r.ta!=='大みそかの特記事項X')bad.push('12/31 の特記事項：'+r.ta);if(!/大みそかの異常/.test(r.body))bad.push('12/31 の異常が出ない');
 if(!r.body.includes(Y+'/12/31'))bad.push('日報の見出しに年月日が無い');if(r.sw>392)bad.push('はみ出す '+r.sw);
 // 印刷（A4）
 try{await p.emulateMedia({media:'print'});const buf=await p.pdf({format:'A4'});await p.emulateMedia({media:'screen'});const f=path.join(os.tmpdir(),'drold'+process.pid+'.pdf');fs.writeFileSync(f,buf);
  const t=execSync('pdftotext -layout '+f+' -',{encoding:'utf8'}).replace(/\s+/g,'');fs.unlinkSync(f);
  if(!t.includes(Y+'/12/31'))bad.push('印刷に '+Y+'/12/31 が無い');if(!t.includes('大みそかの特記事項X'))bad.push('印刷に特記事項が無い')}catch(e){if(!/not found|ENOENT/.test(String(e.message)))bad.push('pdf '+e.message)}
 // 次の日（年をまたぐ）
 await p.evaluate(()=>document.querySelectorAll('#app .mnav button')[1].click());await p.waitForTimeout(200);r=await look();
 if(r.day!==(Y+1)+'-01-01')bad.push('次の日が '+r.day);if(r.ta!=='元日の特記事項Y')bad.push('1/1 の特記事項：'+r.ta);
 const thisY=await p.evaluate(()=>TODAY.slice(0,4));const want=String(Y+1)===thisY?'1/1':(Y+1)+'/1/1';if(!r.lab.startsWith(want))bad.push('1/1 の見出し：'+r.lab+'（'+want+' のはず）');
 if(/大みそかの異常/.test(r.body)===false)bad.push('1/1 に前の日から続く対応中の異常が出ない');
 // 前の日へ 2 回（12/31 → 12/30）
 await p.evaluate(()=>document.querySelectorAll('#app .mnav button')[0].click());await p.waitForTimeout(150);await p.evaluate(()=>document.querySelectorAll('#app .mnav button')[0].click());await p.waitForTimeout(150);r=await look();
 if(r.day!==Y+'-12-30')bad.push('前の日が '+r.day);if(r.ta!=='前の日の特記事項Z')bad.push('12/30 の特記事項：'+r.ta);if(/大みそかの異常/.test(r.body))bad.push('12/30 にまだ無い異常が出る');
 // 今日には年を出さない
 await p.evaluate(()=>go('dailyRep',{day:TODAY}));await p.waitForTimeout(150);r=await look();if(/^\d{4}\//.test(r.lab))bad.push('今日の見出しに年が出る：'+r.lab);
 const after=await p.evaluate(()=>JSON.stringify([S.daily,S.dnotes,S.issues]));if(after!==before)bad.push('見ただけで記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
