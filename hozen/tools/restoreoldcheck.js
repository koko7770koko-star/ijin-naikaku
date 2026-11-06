// 古い形の記録（works・meas・locs・budget・handover・dnotes などの項目が無い／空）を localStorage に入れて開き、全画面と印刷用の画面（報告書の各種類・作業表・日報・設備カルテ・ホーム・カレンダー）を画面と印刷（emulateMedia print）で開いてエラーが出ない・記録が消えない（hz-v-restore-old）
// usage: node hozen/tools/restoreoldcheck.js   （外部への通信はすべて止めて確かめる）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const KEY='hospElecSched_v1',MARK='RESTOREOLD_MARK';
const CASES=[
 {name:'設定・設備・異常・予定だけ（works・meas・locs・budget・handover・dnotes・moves・parts・tools・plans が無い）',
  ls:{[KEY]:JSON.stringify({settings:{name:MARK},tasks:[{id:'t1',date:'2026-11-03',title:MARK}],issues:[{id:'i1',title:MARK,date:'2026-11-01',detail:'a\nb'}],equipment:[{id:'e1',name:MARK,kind:'発電機'}],daily:{'2026-11-03':{}}})}},
 {name:'項目を消した記録（works の staff・meas の rows・issues の approvals・equipment の repairs・health が無い／空）',
  ls:{[KEY]:JSON.stringify({settings:{name:MARK},works:[{id:'w1',title:MARK,date:'2026-11-03'}],meas:[{id:'m1',equipId:'e1',date:'2026-11-02',rows:[{name:'x',v:1}]}],issues:[{id:'i1',title:MARK}],equipment:[{id:'e1',name:MARK}],stds:[{id:'s1',name:MARK}],budget:[{id:'b1',cat:'修繕費'}],handover:null,dnotes:[]})}}];
(async()=>{const b=await chromium.launch();const bad=[];
 for(const c of CASES){
  const ctx=await b.newContext({viewport:{width:720,height:1000}});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('CONSOLE '+m.text())});
  p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.waitForFunction(()=>localStorage.getItem('kinmuhyo_v1')!=null,null,{timeout:15000}).catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(ls=>{localStorage.clear();for(const k in ls)localStorage.setItem(k,ls[k])},c.ls);await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(500);
  const steps=[];
  for(const v of await p.evaluate(()=>Object.keys(VIEWS)))if(v!=='printDoc'&&v!=='equipDetail')steps.push(`go('${v}')`);
  steps.push("go('equipDetail',{eq:'e1',eqTab:'rec'})","go('equipDetail',{eq:'e1',eqTab:'ov'})","go('dailyRep',{day:'2026-11-03'})","go('workSheet')");
  for(const t of ['issue','meas','work','std','issueList'])steps.push(`go('printDoc',{doc:{t:'${t}',id:'${{issue:'i1',meas:'m1',work:'w1',std:'s1'}[t]||''}'}})`);
  for(const mode of ['screen','print']){
   await p.emulateMedia({media:mode});
   for(const s of steps){const e0=errs.length;await p.evaluate(s=>{try{(0,eval)(s)}catch(e){console.error(s+' '+e.message)}},s);await p.waitForTimeout(40);
    const vw=await p.evaluate(()=>document.body.dataset.view),want=(s.match(/^go\('(\w+)'/)||[])[1];if(want&&want!==vw&&want!=='workSheet')errs.push('画面が開かない '+s+' → '+vw);
    if(mode==='print'&&!errs.length){try{await p.pdf({format:'A4'})}catch(e){errs.push('PDF '+s+' '+e.message)}}}}
  await p.emulateMedia({media:'screen'});
  await p.evaluate(()=>{try{save()}catch(e){console.error('save '+e.message)}});await p.waitForTimeout(500);
  await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(400);
  const kept=await p.evaluate(m=>JSON.stringify(JSON.parse(localStorage.getItem('hospElecSched_v1')||'{}')).includes(m),MARK);if(!kept)errs.push('記録が消えた／変わった');
  console.log((errs.length?'NG ':'OK ')+c.name+(errs.length?'\n   '+errs.slice(0,6).join('\n   '):''));if(errs.length)bad.push(c.name);
  await ctx.close()}
 console.log(bad.length?'FAILED '+bad.length+' 件':'ALL OK');await b.close();process.exit(bad.length?1:0)})();
