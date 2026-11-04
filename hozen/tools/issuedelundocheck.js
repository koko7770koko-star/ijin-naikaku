// 不具合：写真付き・履歴付き・設備に結んだ案件を削除して「元に戻す」を押すと、写真（IndexedDB の実体）・履歴・設備・並びが元どおりで、開き直しても残る。2回押しても二重にならない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const ready=()=>p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.goto('file://'+FILE);await ready();
 const pid=await p.evaluate(async()=>{const id=await putPhoto('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==');
  S.equipment=S.equipment||[];S.equipment.push({id:'eqdu1',name:'確認用の盤',photos:[],repairs:[]});
  const mk=(id,t)=>({id,src:'manual:'+id,date:TODAY,title:t,place:'',detail:'',status:'対応中',action:'',closed:'',photos:[],equipId:'',log:[]});
  S.issues.push(mk('du0','前'));S.issues.push({...mk('du1','写真つき'),photos:[id],equipId:'eqdu1',log:[{at:new Date().toISOString(),from:'',to:'発見',by:'',note:'登録'},{at:new Date().toISOString(),from:'発見',to:'対応中',by:'',note:'手配'}]});S.issues.push(mk('du2','後'));
  save();go('issues');return id});
 await p.waitForTimeout(300);
 const before=await p.evaluate(()=>({ids:S.issues.map(i=>i.id),one:JSON.stringify(S.issues.find(i=>i.id==='du1'))}));
 await p.evaluate(()=>{editIssue('du1')});await p.waitForTimeout(300);
 await p.evaluate(()=>delIssue('du1'));await p.waitForTimeout(300);
 ok(await p.evaluate(()=>!S.issues.some(i=>i.id==='du1')),'消えていない');
 const btn=await p.$('#undobar.on button');ok(!!btn,'元に戻すが出ない');
 if(btn){await btn.click();await p.waitForTimeout(300);
  const after=await p.evaluate(()=>({ids:S.issues.map(i=>i.id),one:JSON.stringify(S.issues.find(i=>i.id==='du1'))}));
  ok(after.one===before.one,'中身が戻らない '+after.one);
  ok(JSON.stringify(after.ids)===JSON.stringify(before.ids),'並びが変わる '+after.ids.join(','));
  await p.evaluate(()=>{const b=document.querySelector('#undobar button');if(b)b.onclick&&b.onclick()});await p.waitForTimeout(200);
  ok(await p.evaluate(()=>S.issues.filter(i=>i.id==='du1').length===1),'二度押しで二重になる');
  await p.reload();await ready();await p.waitForTimeout(300);
  const r=await p.evaluate(async(pid)=>{const i=S.issues.find(x=>x.id==='du1');const data=await idb('p','readonly',s=>s.get(pid));return {i:!!i,ph:i&&i.photos[0]===pid,eq:i&&i.equipId,log:i&&i.log.length,data:!!data}},pid);
  ok(r.i&&r.ph&&r.eq==='eqdu1'&&r.log===2,'開き直すと戻っていない '+JSON.stringify(r));ok(r.data,'写真の実体が無い');}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
