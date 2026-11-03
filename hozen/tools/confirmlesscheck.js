// 確認窓を減らした操作の確認：元に戻せる削除（予定・修理履歴・点検項目・測定記録・計画・予算・工具・図面の印・技術資料）は、
// 確認窓を出さずに消え、「元に戻す」で戻る。消すと戻せない物（設備・場所・作業・作業標準・予備品・図面・全消去など）は今までどおり確認が出る。
// usage: node hozen/tools/confirmlesscheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const src=fs.readFileSync(FILE,'utf8');
for(const fn of ['delTask','delRepair','delDef','delMeas','delPlan','delBudget','delTool','delPin','delLib']){const m=src.match(new RegExp('function '+fn+'\\([^)]*\\)\\{[^]*?\\n'));if(!m||/confirm\(/.test(m[0]))bad.push(fn+' に confirm が残っている');}
for(const t of ['この項目を削除しますか？','この案件を削除しますか？','を設備台帳から削除しますか？','場所「','作業「${w.title}」を削除しますか？','予備品「${p.name}」を削除しますか？','作業標準「${t.name}」を削除しますか？','図面「${d.name}」'])if(!src.includes(t))bad.push('残すはずの確認が無い：'+t);
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let dlg=0;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>{dlg++;d.accept().catch(()=>{})});
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const cases=[
  ['予定',()=>{S.tasks=[{id:'t1',date:TODAY,time:'',kind:'臨時',cat:S.settings.cats[0],title:'試験',place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]}]},()=>delTask('t1'),()=>S.tasks.length],
  ['計画',()=>{S.plans=[{id:'p1',title:'計画1'}]},()=>delPlan('p1'),()=>S.plans.length],
  ['予算',()=>{S.budget=[{id:'b1',fy:2026,cat:'修繕費',amount:1}]},()=>delBudget('b1'),()=>S.budget.length],
  ['工具',()=>{S.tools=[{id:'tl1',name:'テスタ'}]},()=>delTool('tl1'),()=>S.tools.length],
  ['技術資料',()=>{S.library=[{id:'l1',title:'資料1',equipIds:[]}]},()=>delLib('l1'),()=>S.library.length]];
 for(const [name,seed,del,cnt] of cases){
  await p.evaluate(seed.toString().replace(/^\(\)=>/,'(()=>')+')()').catch(()=>{});
  const before=await p.evaluate(`(${cnt.toString()})()`);
  if(!before){bad.push(name+'：テストの準備ができない');continue}
  dlg=0;await p.evaluate(`(${del.toString()})()`);await p.waitForTimeout(150);
  const after=await p.evaluate(`(${cnt.toString()})()`);if(dlg)bad.push(name+'：確認窓が出た');if(after!==0)bad.push(name+'：消えていない');
  await p.click('#undobar button').catch(()=>bad.push(name+'：元に戻すが出ない'));await p.waitForTimeout(150);
  const back=await p.evaluate(`(${cnt.toString()})()`);if(back!==before)bad.push(name+'：元に戻せない '+back);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
