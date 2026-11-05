// 測定のひな形の編集窓（項目 10 行・長い項目名・単位・管理値）：文字「大」「特大」・360px で、①項目名・単位・管理値の入力と単位の文字が割れない・窓の外へはみ出さない②押す所が 44px 以上③窓の下のボタンが隠れない、を確かめる。保存の形は見るだけで変えない。
// usage: node hozen/tools/mtpleditxlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();
  S.mtpl.push({id:'mtx',type:'その他',name:'接地抵抗の測定（設備1）',cycleM:12,kind:'',cond:'',rows:[...Array(10)].map((_,i)=>({name:'接地抵抗（A種）'+(i+1),unit:'Ω',min:'',max:10,ck:i%5===4}))});
  go('mtpl');editMtpl('mtx')},fs);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const m=document.querySelector('.modal')||document.querySelector('#modal');if(!m)return null;const M=m.getBoundingClientRect();const small=[],ov=[],cut=[];
  m.querySelectorAll('button,input,select').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(q.height<43.5)small.push((e.getAttribute('aria-label')||e.textContent.trim()||e.id||e.tagName).slice(0,10)+' '+Math.round(q.height));if(q.right>M.right+1||q.left<M.left-1)ov.push((e.getAttribute('aria-label')||e.textContent.trim()||e.id||e.tagName).slice(0,10))});
  m.querySelectorAll('.mtrow span.muted').forEach(s=>{const R=document.createRange();R.selectNodeContents(s);const tops=new Set([...R.getClientRects()].map(x=>Math.round(x.top)));if(tops.size>1)cut.push(s.textContent.slice(0,6))});
  const foot=[...m.querySelectorAll('button')].filter(e=>e.textContent.trim()==='保存')[0];
  return {n:m.querySelectorAll('.mtrow').length,small:[...new Set(small)],ov:[...new Set(ov)],cut:[...new Set(cut)],foot:!!foot,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 if(!r){errs.push(tag+'：窓が開かない');await c.close();continue}
 if(r.n!==10)errs.push(tag+'：項目の行が '+r.n+'（10 のはず）');
 if(r.small.length)errs.push(tag+'：44px 未満 '+r.small.slice(0,6).join(' | '));
 if(r.ov.length)errs.push(tag+'：窓の外へはみ出す '+r.ov.slice(0,4).join(' | '));
 if(r.cut.length)errs.push(tag+'：「下限」「上限」「単位」の文字が割れる '+r.cut.join(' | '));
 if(!r.foot)errs.push(tag+'：保存ボタンが無い');
 if(r.sw>r.cw+1)errs.push(tag+'：横にはみ出す');
 if(shot){await p.evaluate(()=>{const m=document.querySelector('.modal');if(m){m.style.maxHeight='none';m.style.height='auto'}});await p.screenshot({path:shot+'-'+w+fs+'.png',fullPage:true})}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
