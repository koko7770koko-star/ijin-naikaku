// QR ラベルの画面（設備・盤、札の大きさ 中・小）：文字「大」「特大」・360px で、①大きさ・種類のボタンが 44px 以上で割れない②ラベルの文字が札の外へはみ出さない③横にはみ出さない、を確かめる。印刷の見た目は見ない。
// usage: node hozen/tools/qrsheetxlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();
  for(let i=1;i<=12;i++)S.equipment.push({id:'eqq'+i,code:'HV-TR-2026-0'+(10+i),name:'高圧受電設備 変圧器 第'+i+'号（油入自冷式 三相 500kVA）',place:'A棟 地下1階 第1電気室 高圧受電盤'+i,maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[]});
  V.qrKind='';V.qrSz='';go('qr')},fs);await p.waitForTimeout(400);
 const probe=()=>p.evaluate(()=>{const app=document.getElementById('app');const small=[],ov=[],wrap=[];
  app.querySelectorAll('#qrSz button,.card button,select').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(q.height<43.5)small.push((e.textContent.trim()||e.tagName).slice(0,8)+' '+Math.round(q.height))});
  app.querySelectorAll('#qrSz button').forEach(e=>{const R=document.createRange();R.selectNodeContents(e);if(new Set([...R.getClientRects()].map(x=>Math.round(x.top))).size>1)wrap.push(e.textContent.trim())});
  app.querySelectorAll('.qrl').forEach(l=>{const L=l.getBoundingClientRect();l.querySelectorAll('.qrt *').forEach(t=>{const q=t.getBoundingClientRect();if(q.width&&(q.right>L.right+1||q.left<L.left-1))ov.push(t.textContent.slice(0,10))})});
  return {n:app.querySelectorAll('.qrl').length,small:[...new Set(small)],ov:[...new Set(ov)],wrap,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 for(const [nm,fn] of [['設備・中',null],['設備・小',()=>{V.qrSz='s';render()}]]){
  if(fn)await p.evaluate(fn);await p.waitForTimeout(300);const r=await probe();
  if(!r.n)errs.push(tag+nm+'：ラベルが無い');
  if(r.small.length)errs.push(tag+nm+'：44px 未満 '+r.small.slice(0,6).join(' | '));
  if(r.wrap.length)errs.push(tag+nm+'：大きさのボタンが割れる '+r.wrap.join(' | '));
  if(r.ov.length)errs.push(tag+nm+'：ラベルの文字が札の外へ '+r.ov.slice(0,3).join(' | '));
  if(r.sw>r.cw+1)errs.push(tag+nm+'：横にはみ出す '+r.sw+'>'+r.cw);
  if(shot)await p.screenshot({path:shot+'-'+w+fs+(fn?'s':'m')+'.png'})}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
