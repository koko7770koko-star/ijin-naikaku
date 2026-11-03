// 承認・確認の記録：prompt を連続で出さず、1つの窓（異常の承認は枠）に名前・役職・コメントと大きいボタンがある。
// 異常の承認・工事の承認と開始・作業標準の承認を通し、保存の形が同じで、390px×低い画面でも「記録」が画面内にあることを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:600}});const p=await c.newPage();const errs=[];let dlg=0;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>{dlg++;d.dismiss().catch(()=>{})});
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const inView=async n=>{const r=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#modal button')].filter(x=>/を記録|^承認$|^差し戻し$/.test(x.textContent.trim()));const bt=bs[bs.length-1];if(!bt)return null;const rc=bt.getBoundingClientRect();return {b:rc.bottom,h:rc.height,vh:innerHeight,sw:document.documentElement.scrollWidth}});
  if(!r)bad.push(n+'：記録のボタンが無い');else{if(r.h<44)bad.push(n+'：ボタンが小さい '+r.h);if(r.sw>392)bad.push(n+'：横にはみ出す')}return r};
 // 1) 異常の承認（枠の中。入力中の内容が消えない）
 await p.evaluate(()=>{S.issues.push({id:'is1',date:TODAY,title:'確認用の異常',place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',approvals:[]});save();editIssue('is1')});await p.waitForTimeout(300);
 await p.fill('#is_title','入力中の題');
 await p.click('text=承認・差し戻しを記録');await p.waitForTimeout(200);
 if(!await p.evaluate(()=>!!document.querySelector('#is_appr #sg_by')))bad.push('異常：承認の枠が出ない');
 await p.fill('#sg_by','');await p.click('#is_appr button:has-text("承認")');await p.waitForTimeout(150);
 if(await p.evaluate(()=>S.issues[0].approvals.length))bad.push('異常：名前なしで記録された');
 await p.fill('#sg_by','確認者');await p.fill('#sg_role','係長');await p.fill('#sg_note','よし');await p.click('#is_appr button:has-text("承認")');await p.waitForTimeout(200);
 const a1=await p.evaluate(()=>{const a=S.issues[0].approvals[0];return {k:a&&Object.keys(a).sort().join(),by:a&&a.by,act:a&&a.act,title:document.querySelector('#is_title').value}});
 if(a1.k!=='act,at,by,method,note,role'||a1.by!=='確認者'||a1.act!=='承認')bad.push('異常：承認の形が違う '+JSON.stringify(a1));if(a1.title!=='入力中の題')bad.push('異常：入力中の内容が消えた');
 await p.click('text=承認・差し戻しを記録');await p.click('#is_appr button:has-text("やめる")');await p.waitForTimeout(150);
 if(await p.evaluate(()=>!!document.querySelector('#sg_by')))bad.push('異常：やめるで枠が閉じない');
 await p.evaluate(()=>closeModal(true));
 // 2) 工事：承認 → 開始
 await p.evaluate(()=>{editWork('')});await p.waitForTimeout(300);await p.fill('#wk_title','確認用の作業');
 await p.evaluate(()=>{saveWork('')});await p.waitForTimeout(200);
 const wid=await p.evaluate(()=>{const w=S.works[S.works.length-1];if(!w)return '';w.status='承認待ち';w.pre=[];w.post=[];save();editWork(w.id);return w.id});await p.waitForTimeout(300);
 if(!wid)bad.push('工事：作れない');else{
  await p.evaluate(id=>workAct(id,'back'),wid);await p.waitForTimeout(300);await inView('差し戻し');
  await p.fill('#sg_by','確認者');await p.click('#modal button:has-text("差し戻しを記録")');await p.waitForTimeout(150);
  if(await p.evaluate(id=>workById(id).approvals.length,wid))bad.push('工事：差し戻しの理由なしで記録された');
  await p.fill('#sg_note','理由');await p.click('#modal button:has-text("差し戻しを記録")');await p.waitForTimeout(300);
  const w1=await p.evaluate(id=>{const w=workById(id);return {st:w.status,k:Object.keys(w.approvals[0]).sort().join(),h:w.hist.at(-1).act}},wid);
  if(w1.st!=='起案'||w1.k!=='act,at,by,method,note,role'||w1.h!=='差し戻し')bad.push('工事：差し戻しの形が違う '+JSON.stringify(w1));
  await p.evaluate(id=>{const w=workById(id);w.status='承認待ち';save();closeModal(true);editWork(id)},wid);await p.waitForTimeout(400);await p.evaluate(id=>workAct(id,'ok'),wid);await p.waitForTimeout(300);await inView('承認');
  await p.fill('#sg_by','確認者');await p.click('#modal button:has-text("承認を記録")');await p.waitForTimeout(300);
  if(await p.evaluate(id=>workById(id).status,wid)!=='承認済み')bad.push('工事：承認で承認済みにならない');
  await p.evaluate(id=>workAct(id,'start'),wid);await p.waitForTimeout(300);
  if(await p.evaluate(()=>!!document.querySelector('#sg_role')))bad.push('工事：開始に役職欄が出る');
  await p.fill('#sg_by','責任者');await p.click('#modal button:has-text("作業開始を記録")');await p.waitForTimeout(300);
  if(await p.evaluate(id=>workById(id).status,wid)!=='実施中')bad.push('工事：開始で実施中にならない');
 }
 // 3) 作業標準の承認
 await p.evaluate(()=>{closeModal(true);S.stds=[{id:'sd1',name:'確認用標準',docNo:'',ver:'1',kinds:['停電作業'],pre:[{text:'確認',req:true}],post:[{text:'確認',req:true}],note:'',approvedBy:'',approvedRole:'',approvedDate:'',hist:[]}];save();editStd('sd1')});await p.waitForTimeout(300);await p.evaluate(()=>approveStd('sd1'));await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.querySelector('#sg_date')&&document.querySelector('#sg_date').type)!=='date')bad.push('標準：承認日が日付の入力でない');await inView('標準の承認');
 await p.fill('#sg_by','承認者');await p.click('#modal button:has-text("承認を記録")');await p.waitForTimeout(300);
 const s1=await p.evaluate(()=>{const t=S.stds[0];return t.approvedBy+':'+t.approvedDate+':'+t.method});if(!/^承認者:\d{4}-\d\d-\d\d:/.test(s1))bad.push('標準：承認の記録が違う '+s1);
 if(dlg)bad.push('prompt/confirm が出た '+dlg);
 if(process.argv[2]){await p.evaluate(()=>{closeModal(true);S.stds[0].approvedBy='';save();editStd('sd1')});await p.waitForTimeout(300);await p.evaluate(()=>approveStd('sd1'));await p.waitForTimeout(300);await p.screenshot({path:process.argv[2]})}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
