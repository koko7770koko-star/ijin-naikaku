// バックアップ→空の端末に復元→元どおりか、壊れたファイルを断れるか を確かめる。
// usage: node hozen/tools/backupcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
async function open(b){const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(2000);return {ctx,p,errs}}
const snap=p=>p.evaluate(()=>({tasks:S.tasks.map(t=>t.id+'|'+t.title+'|'+t.date),daily:Object.keys(S.daily).sort(),issues:S.issues.map(i=>i.id+'|'+i.title),equip:(S.equipment||[]).map(e=>e.id+'|'+e.name),
  photoIds:[...referencedPhotos()].sort(),shift:hasShift()?SHIFT.members().join(','):null,apiKey:S.settings.apiKey||''}));
(async()=>{const b=await chromium.launch();
 const A=await open(b);
 // 元の端末：記録を入れる
 const seeded=await A.p.evaluate(async(PNG)=>{
  S.settings.apiKey='SECRET_TEST_KEY';
  S.tasks.push({id:'tkA1',date:'2026-05-01',time:'09:00',kind:'月次',cat:'受変電',title:'テスト点検○○',place:'○○室',staff:'',attend:'',status:'予定',result:'',note:'',photos:['phA1']});
  S.issues.push({id:'isA1',date:'2026-05-02',title:'テスト異常',place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]});
  S.equipment=S.equipment||[];S.equipment.push({id:'eqA1',code:'T-1',name:'テスト設備',place:'',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[]});
  S.daily['2026-05-03']=Object.assign({},S.daily['2026-05-03']||{},{note:'日常メモ'});
  PH['phA1']=PNG;await idb('p','readwrite',s=>s.put(PNG,'phA1'));save();return true},PNG).catch(e=>{bad.push('記録の投入に失敗 '+e.message);return false});
 await A.p.waitForTimeout(600);
 const before=await snap(A.p);
 const built=await A.p.evaluate(async()=>{const r=await buildBackup();return {text:await r.blob.text(),info:r.info}}).catch(e=>{bad.push('buildBackup 失敗 '+e.message);return null});
 if(!built){console.log(bad.join('\n'));process.exit(1)}
 ok(built.info.complete,'バックアップが不完全と判定された');
 ok(!built.text.includes('SECRET_TEST_KEY'),'バックアップに API キーが入っている');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bk-'));const good=path.join(tmp,'good.json');fs.writeFileSync(good,built.text);
 // 空の端末（別のブラウザ文脈）に復元
 const B=await open(b);
 const emptyN=await B.p.evaluate(()=>S.tasks.length+Object.keys(S.daily).length);
 await B.p.evaluate(()=>go('set'));await B.p.waitForTimeout(500);await B.p.setInputFiles('input[onchange^="restore("]',good,{timeout:5000});
 await B.p.waitForTimeout(800);
 ok(await B.p.evaluate(()=>/復元の確認/.test(document.body.innerText)),'復元の確認が出ない');
 {const t=await B.p.evaluate(()=>document.querySelector('.modal,#modal,body').innerText);ok(/書き出した日：\s*20\d\d/.test(t),'復元の確認に書き出した日が出ない');ok(/設備/.test(t),'復元の確認に設備の件数が出ない')}
 await B.p.evaluate(()=>applyRestore());await B.p.waitForTimeout(1500);
 const after=await snap(B.p);
 for(const k of ['tasks','daily','issues','equip','photoIds']){ok(JSON.stringify(before[k])===JSON.stringify(after[k]),'復元後に '+k+' が元と違う：'+JSON.stringify(before[k])+' → '+JSON.stringify(after[k]))}
 ok(after.apiKey==='','復元後に API キーが現れた');
 const photo=await B.p.evaluate(async()=>{delete PH['phA1'];await loadPhotos(['phA1']);return PH['phA1']});ok(photo&&photo.startsWith('data:image/png'),'復元後に写真が読めない');
 // 保存して読み直しても残る
 await B.p.reload();await B.p.waitForTimeout(1500);
 const re=await snap(B.p);ok(JSON.stringify(re.tasks)===JSON.stringify(before.tasks),'復元後に再読み込みすると記録が消えた');
 {const o=JSON.parse(built.text);delete o.savedAt;const f=path.join(tmp,'nodate.json');fs.writeFileSync(f,JSON.stringify(o));await B.p.evaluate(()=>closeModal(true));await B.p.evaluate(()=>go('set'));await B.p.waitForTimeout(300);await B.p.setInputFiles('input[onchange^="restore("]',f,{timeout:5000});await B.p.waitForTimeout(800);const t=await B.p.evaluate(()=>document.body.innerText);ok(/書き出した日：\s*記録なし/.test(t),'日付の無い古いファイルで「記録なし」が出ない');await B.p.evaluate(()=>{PENDING_RESTORE=null;closeModal(true)})}
 // 壊れたファイルを断れるか（今の記録は変わらない）
 const cases={trunc:built.text.slice(0,Math.floor(built.text.length/2)),notjson:'これは記録ではありません',empty:'',array:'[1,2,3]',tamper:built.text.replace('テスト点検○○','書き換え点検')};
 for(const [k,txt] of Object.entries(cases)){const f=path.join(tmp,k+'.json');fs.writeFileSync(f,txt);
  const n0=await B.p.evaluate(()=>JSON.stringify(S.tasks));
  await B.p.evaluate(()=>go('set'));await B.p.waitForTimeout(300);await B.p.setInputFiles('input[onchange^="restore("]',f,{timeout:5000});await B.p.waitForTimeout(600);
  const t=await B.p.evaluate(()=>document.body.innerText);
  const refused=/復元できません/.test(t),warned=/検査値が一致しません|⛔/.test(t);
  if(k==='tamper')ok(warned,'書き換えたファイルに警告が出ない');else ok(refused,'壊れたファイル('+k+')を断らない');
  await B.p.evaluate(()=>{PENDING_RESTORE=null;closeModal(true)});
  ok(n0===await B.p.evaluate(()=>JSON.stringify(S.tasks)),'壊れたファイル('+k+')で記録が変わった');}
 const errs=[...A.errs,...B.errs];console.log('復元前後の件数',JSON.stringify({tasks:before.tasks.length,photos:before.photoIds.length,emptyN}));
 console.log([...errs,...bad].slice(0,15).join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
