// 工事・作業：「作業完了を記録」を押し間違えたとき、直後の「元に戻す」で実施中に戻せる。
// 戻すと状態・経過（hist）が完了の前に戻り、保存の形は変わらない。時間が過ぎて他の変更が入ったら戻さない。ボタンは44px以上・390pxで横はみ出しなし。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const run=async(mode)=>{
  await p.evaluate(()=>{S.works=[];editWork('');});await p.waitForTimeout(300);
  await p.evaluate(()=>{const w=WK;w.id='wk_undo';w.title='試験作業';w.status='実施中';w.result='異常なし';w.pre.forEach(x=>x.done=true);w.post.forEach(x=>x.done=true);w.hist=[{at:nowIso(),act:'作業開始',from:'承認済み',to:'実施中',by:'試験者',note:''}];S.works.push(w);save();closeModal(true);render()});
  await p.waitForTimeout(200);
  await p.evaluate(()=>editWork('wk_undo'));await p.waitForTimeout(300);
  await p.evaluate(()=>workAct('wk_undo','done'));await p.waitForTimeout(400);
  await p.evaluate(()=>{document.querySelector('#sg_by').value='試験者';signGo('完了')});await p.waitForTimeout(500);
  const a=await p.evaluate(()=>{const w=workById('wk_undo'),e=document.getElementById('undobar'),bt=e&&e.querySelector('button');return {st:w.status,n:w.hist.length,on:!!e&&e.classList.contains('on'),h:bt?bt.getBoundingClientRect().height:0,t:e?e.textContent:'',sw:document.documentElement.scrollWidth,iw:innerWidth}});
  ok(a.st==='完了'&&a.n===2,mode+'：完了にならない '+JSON.stringify(a));ok(a.on&&/元に戻す/.test(a.t),mode+'：元に戻すが出ない');ok(a.h>=44,mode+'：ボタンが小さい '+a.h);ok(a.sw<=a.iw,mode+'：横にはみ出す');
  if(mode==='戻す'){
   await p.evaluate(()=>document.querySelector('#undobar button').click());await p.waitForTimeout(500);
   const r=await p.evaluate(()=>{const w=workById('wk_undo'),raw=JSON.parse(localStorage.getItem('hospElecSched_v1')).works.find(x=>x.id==='wk_undo');return {st:w.status,n:w.hist.length,rawSt:raw.status,rawN:raw.hist.length,keys:Object.keys(w).sort().join()}});
   ok(r.st==='実施中'&&r.n===1,mode+'：戻らない '+JSON.stringify(r));ok(r.rawSt==='実施中'&&r.rawN===1,mode+'：保存が戻らない');
   await p.evaluate(()=>closeModal(true));
  }else{
   // 戻す前に別の変更が入ったときは戻さない
   await p.evaluate(()=>{const w=workById('wk_undo');w.hist.push({at:nowIso(),act:'別の記録',from:'完了',to:'完了',by:'x',note:''})});
   await p.evaluate(()=>document.querySelector('#undobar button').click());await p.waitForTimeout(400);
   const r=await p.evaluate(()=>({st:workById('wk_undo').status}));ok(r.st==='完了',mode+'：他の変更が入ったのに戻した');
   await p.evaluate(()=>closeModal(true));
  }};
 await run('戻す');await run('変更あり');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
