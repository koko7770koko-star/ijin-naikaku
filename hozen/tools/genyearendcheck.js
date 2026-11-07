// 非常用発電機：年が明けた（今日 2027/1/5）とき、「今月まだ数字を入れていない」が新しい月（1 月）で数え直され（12 月に入れた台も 1 月はまだ）、
// 入力の窓の薄い文字（前回の値）が 12 月の値を出し、過去12か月の表で 12 月→1 月が切れずに並ぶか。記録は変えない（hz-v-gen-yearend）。
// usage: node hozen/tools/genyearendcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.clock.setFixedTime(new Date('2027-01-05T10:00:00+09:00'));
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const r=await p.evaluate(()=>{const o=[];if(TODAY!=='2027-01-05')o.push('今日が '+TODAY);
  const rows=(v)=>GEN_TPL.rows.map(r=>({...r,ck:false,v:r.name==='運転時間計'?String(v):r.name==='電圧'?'200':''}));
  S.equipment=[{id:'G1',name:'試しの発電機1',kind:'発電機',status:'稼働',repairs:[]},{id:'G2',name:'試しの発電機2',kind:'発電機',status:'稼働',repairs:[]}];
  if(!tplById('mt_gen'))S.mtpl=(S.mtpl||[]).concat([clone(GEN_TPL)]);
  S.meas=[{id:'gm1',date:'2026-11-18',equipId:'G1',tplId:'mt_gen',type:GEN_TPL.type,name:GEN_TPL.name,by:'',rows:rows(985),at:''},{id:'gm2',date:'2026-12-20',equipId:'G1',tplId:'mt_gen',type:GEN_TPL.type,name:GEN_TPL.name,by:'',rows:rows(1000),at:''},
   {id:'gm3',date:'2026-12-28',equipId:'G2',tplId:'mt_gen',type:GEN_TPL.type,name:GEN_TPL.name,by:'',rows:rows(500),at:''},{id:'gm4',date:'2027-01-03',equipId:'G2',tplId:'mt_gen',type:GEN_TPL.type,name:GEN_TPL.name,by:'',rows:rows(510),at:''}];save();
  const gp=genPending().map(e=>e.id);if(gp.join(',')!=='G1')o.push('1 月にまだの台 '+gp.join(','));
  const A=alerts().map(a=>a[1]).find(t=>/非常用発電機/.test(t))||'';if(!/1台/.test(A))o.push('ホームの知らせ '+A);
  return o});r.forEach(x=>bad.push(x));
 const before=await p.evaluate(()=>JSON.stringify(S.meas));
 await p.evaluate(()=>genStart('G1'));await p.waitForTimeout(300);
 const m=await p.evaluate(()=>{const md=document.querySelector('#modal');const ins=[...md.querySelectorAll('input')];const lab=[...md.querySelectorAll('*')].map(x=>x.textContent);
  return {open:document.querySelector('#mask').classList.contains('on'),ph:ins.map(x=>x.placeholder).filter(Boolean),txt:md.textContent}});
 if(!m.open)bad.push('入力の窓が開かない');else if(!m.ph.some(x=>/1000/.test(x))&&!/前回[^0-9]{0,6}1,?000/.test(m.txt))bad.push('前回の値（12 月の 1000）が出ない：'+m.ph.slice(0,9).join('|'));
 if(m.ph.some(x=>/985/.test(x)))bad.push('前回の値が 11 月のまま');
 await p.evaluate(()=>closeModal(true));
 const t=await p.evaluate(()=>{const e=eqById('G1');const h=gen12m(e,'2027-01');const d=document.createElement('div');d.innerHTML=typeof h==='string'?h:'';return d.textContent||JSON.stringify(h)});
 if(!/1,?000/.test(t))bad.push('過去12か月に 12 月の 1000 が無い');if(!/985/.test(t))bad.push('過去12か月に 11 月が無い');
 const after=await p.evaluate(()=>JSON.stringify(S.meas));if(after!==before)bad.push('見ただけで記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
