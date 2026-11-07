// 「探す」で 0 件のとき（異常の一覧・作業管理）：「見つかりません」と「条件を外す」（44px）が出て、押すと一覧が戻るか。
// 未完了だけを見ているときは「完了も含めて探す」も出て、押すと完了の物が見つかるか。390px・文字「特大」で横にはみ出さないか（hz-v-search-empty-clear）。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/searchemptycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 await p.evaluate(()=>{S.issues=[...Array(10)].map((_,i)=>({id:'i'+i,date:TODAY,title:(i<5?'VCB 異音 ':'ELB 動作 ')+i,status:i<5?'完了':'対応中',urgency:'中'}));
  S.works=[...Array(10)].map((_,i)=>({id:'w'+i,date:TODAY,title:(i<5?'VCB 点検 ':'ELB 試験 ')+i,status:i<5?'完了':'予定'}));
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['issues','works'])if(m[x])S[x]=m[x]}S.settings.fscale='xl';try{applyScale()}catch(e){}});
 const rows=()=>p.evaluate(()=>{const a=document.querySelector('#app');return {t:a.innerText,sw:document.documentElement.scrollWidth}});
 for(const [lab,view,F,Q,clr] of [['異常の一覧','issues','isF','isQ','#isQClr'],['作業管理','works','wkF','wkQ','#wkQClr']]){
  // 未完了だけで「VCB」（完了の物にしかない）→ 0 件
  await p.evaluate(([view,F,Q])=>{V[F]='open';V[Q]='vcb';go(view)},[view,F,Q]);
  let r=await rows();if(!r.t.includes('見つかりません'))bad.push(lab+'：0 件のとき「見つかりません」が出ない');
  const h=await p.evaluate(s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().height:0},clr);if(h<44)bad.push(lab+'：「条件を外す」が無いか 44px 未満 '+h);
  if(r.sw>392)bad.push(lab+'：特大で横にはみ出す '+r.sw);
  const all=await p.$('button:has-text("完了も含めて探す")');if(!all)bad.push(lab+'：「完了も含めて探す」が出ない');else{await all.click();r=await rows();if(!/VCB/.test(r.t))bad.push(lab+'：完了も含めても VCB が見つからない')}
  // 条件を外す → 一覧が戻る
  await p.evaluate(([view,F,Q])=>{V[F]='open';V[Q]='無い語';go(view)},[view,F,Q]);await p.click(clr);r=await rows();
  if(!/ELB/.test(r.t))bad.push(lab+'：「条件を外す」で一覧が戻らない');if(await p.evaluate(Q=>V[Q],Q))bad.push(lab+'：探す語が残る');
  // 見つかるときは出ない
  await p.evaluate(([view,F,Q])=>{V[F]='open';V[Q]='elb';go(view)},[view,F,Q]);if(await p.$(clr))bad.push(lab+'：見つかるのに「条件を外す」が出る')}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
