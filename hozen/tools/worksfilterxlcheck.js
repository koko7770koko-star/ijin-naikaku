// 作業指示の一覧の絞り込み（状態の札・選び・検索）と作業表（14日間）：文字「大」「特大」・360px で、①状態の札の文字が割れない（「承認/済み」など）②押す所が 44px 以上③横にはみ出さない・切れた文字が無い、を確かめる。
// usage: node hozen/tools/worksfilterxlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();const st=['承認待ち','承認済み','実施中','保留','完了','中止'];
  for(let i=0;i<12;i++)S.works.push({id:'wf'+i,no:'W-2026-0'+(10+i),title:'幹線ケーブル更新と高圧受電盤の改修工事 その'+(i+1),kind:'工事',date:addD(TODAY,i),endDate:addD(TODAY,i+(i%3)),start:'09:00',end:'17:00',status:st[i%6],staff:['職員1','職員2'],vendor:'協力会社'+(i%3+1),place:'',equipIds:[],outage:{on:i%4==0},cost:'',approvals:[],content:''});
  go('works')},fs);await p.waitForTimeout(400);
 const probe=()=>p.evaluate(()=>{const app=document.getElementById('app');const small=[],cut=[],wrap=[];
  app.querySelectorAll('button,select,input,.tile,[onclick]').forEach(e=>{if(!e.offsetParent||e.closest('.rep'))return;const q=e.getBoundingClientRect();if(q.height<43.5&&!e.matches('input[type=checkbox],input[type=radio]'))small.push((e.textContent.trim()||e.id||e.tagName).slice(0,10)+' '+Math.round(q.height))});
  app.querySelectorAll('*').forEach(e=>{if(!e.offsetParent)return;const cs=getComputedStyle(e);if(cs.overflow!=='visible'&&e.tagName!=='SELECT'&&e.tagName!=='INPUT'&&e.scrollWidth>e.clientWidth+1)cut.push((e.className||e.tagName)+' 「'+e.textContent.trim().slice(0,8)+'」')});
  app.querySelectorAll('.wkt .tile .tl').forEach(e=>{const R=document.createRange();R.selectNodeContents(e);if(new Set([...R.getClientRects()].map(x=>Math.round(x.top))).size>1)wrap.push(e.textContent)});
  return {small:[...new Set(small)],cut:[...new Set(cut)],wrap,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 for(const [nm,fn] of [['一覧',null],['作業表',()=>go('workSheet')]]){
  if(fn)await p.evaluate(fn);await p.waitForTimeout(300);const r=await probe();
  if(r.small.length)errs.push(tag+nm+'：44px 未満 '+r.small.slice(0,6).join(' | '));
  if(r.cut.length)errs.push(tag+nm+'：切れた文字 '+r.cut.slice(0,4).join(' | '));
  if(r.wrap.length)errs.push(tag+nm+'：状態の札が割れる '+r.wrap.join(' | '));
  if(r.sw>r.cw+1)errs.push(tag+nm+'：横にはみ出す '+r.sw+'>'+r.cw);
  if(shot)await p.screenshot({path:shot+'-'+nm+w+fs+'.png',fullPage:true})}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
