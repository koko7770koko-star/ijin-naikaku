// 古い形（schema 2・書き出した日／検査情報／写真の欄なし・設定に apiKey あり）のバックアップを復元しても、
// 確認の件数の表が正しく、復元後に全画面が開き、記録が読み直しで残り、特大の文字でもはみ出さないか（hz-v-settings-backup-old）。
// usage: node hozen/tools/settingsbackupoldcheck.js   （外部への通信は止める。名前は「点検1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(200);
 // 古い形のファイルを作る：今の書き出しから新しい欄を外し、schema 2・日常点検の done を外す
 const old=await p.evaluate(async()=>{
  S.tasks.push({id:'tkO1',date:TODAY,time:'',kind:'定期',cat:S.settings.cats[0],title:'点検1',place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]});
  S.daily[addD(TODAY,-3)]={note:'日常メモ',c:{[S.settings.dchecks[0].id]:'○'}};save();
  const r=await buildBackup();const o=JSON.parse(await r.blob.text());
  for(const k of ['savedAt','app','appVer','backupInfo','integrity','photos','historyArchive','generation'])delete o[k];
  o.schema=2;o.settings.apiKey='SECRET_TEST_KEY';
  for(const r2 of Object.values(o.daily))if(r2&&typeof r2==='object')delete r2.done;
  return o});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sbo-'));const file=path.join(tmp,'old.json');fs.writeFileSync(file,JSON.stringify(old));
 const n=await p.evaluate(()=>({t:S.tasks.length,d:Object.keys(S.daily).length,i:S.items.length}));
 // 空の端末に戻す
 const ctx2=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const q=await ctx2.newPage();q.on('pageerror',e=>errs.push('PAGEERR2 '+e.message));q.on('dialog',d=>d.accept().catch(()=>{}));
 await ctx2.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await q.goto('file://'+FILE);await q.waitForFunction(READY,null,{timeout:15000});await q.evaluate(()=>go('set'));await q.waitForTimeout(400);
 await q.setInputFiles('input[onchange^="restore("]',file,{timeout:5000});
 await q.waitForFunction(()=>/復元の確認|復元できません/.test(document.body.innerText),null,{timeout:15000});
 const txt=await q.evaluate(()=>document.body.innerText);
 ok(/復元の確認/.test(txt),'古い形のファイルが断られた');ok(/記録なし/.test(txt)&&/古い形式/.test(txt),'書き出した日が「記録なし（古い形式）」にならない');
 ok(/検査情報なし/.test(txt),'検査情報なしと出ない');
 const tbl=await q.evaluate(()=>{const R={};document.querySelectorAll('#modal .rep table tr').forEach(tr=>{const td=[...tr.querySelectorAll('td')].map(x=>x.textContent.trim());if(td.length===3)R[td[0]]=td[2]});return R});
 ok(+tbl['予定・実績']===n.t,'件数の表「予定・実績」が違う '+tbl['予定・実績']+' / '+n.t);
 ok(+tbl['日常点検（日数）']===n.d,'件数の表「日常点検」が違う '+tbl['日常点検（日数）']+' / '+n.d);
 ok(+tbl['点検項目']===n.i,'件数の表「点検項目」が違う '+tbl['点検項目']+' / '+n.i);
 ok(await q.evaluate(()=>{const m=document.querySelector('#modal');return m.scrollWidth<=m.clientWidth+1}),'確認の窓が横にはみ出す');
 await q.evaluate(()=>applyRestore());await q.waitForFunction(n=>S.tasks.length===n,n.t,{timeout:15000}).catch(()=>bad.push('復元が終わらない'));await q.waitForTimeout(800);
 ok(await q.evaluate(()=>S.tasks.some(t=>t.id==='tkO1')),'復元後に記録が無い');
 ok(await q.evaluate(()=>(S.schema===3)&&!('apiKey' in S.settings)),'復元後に schema が 3 でない／apiKey が残る');
 ok(await q.evaluate(()=>!JSON.stringify(S).includes('SECRET_TEST_KEY')),'復元後の記録に apiKey が残る');
 ok(await q.evaluate(()=>{const r=S.daily[addD(TODAY,-3)];return r&&r.done}),'古い日常点検が「完了」に移されない');
 const views=await q.evaluate(()=>Object.keys(VIEWS));
 for(const v of views){if(v==='equipDetail'||v==='printDoc')continue;const r=await q.evaluate(v=>{try{go(v)}catch(e){return {e:e.message}}return {n:document.body.innerText.length}},v);if(r.e)bad.push('復元後に画面 '+v+' でエラー '+r.e);else if(r.n<20)bad.push('復元後に画面 '+v+' が空')}
 await q.reload();await q.waitForFunction(READY,null,{timeout:15000});
 ok(await q.evaluate(()=>S.tasks.some(t=>t.id==='tkO1')),'読み直すと記録が消える');
 // 特大の文字でも横にはみ出さない
 await q.evaluate(()=>{S.settings.fscale='xl';save()});await q.reload();await q.waitForFunction(READY,null,{timeout:15000});
 for(const v of ['home','month','day','set']){const w=await q.evaluate(v=>{go(v);return document.documentElement.scrollWidth},v);ok(w<=392,'特大で画面 '+v+' が横にはみ出す '+w)}
 console.log([...errs,...bad].slice(0,15).join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
