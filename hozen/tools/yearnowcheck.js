// 年間計画：開いたとき今月の列（th.cur）が表の見える範囲に入り、色（枠）が付いている。今月が 4月・11月・3月の3通り。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [label,iso] of [['4月','2026-04-15T10:00:00+09:00'],['11月','2026-11-15T10:00:00+09:00'],['3月','2027-03-15T10:00:00+09:00']]){
  const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.clock.setFixedTime(new Date(iso));
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
  await p.evaluate(()=>{if(!S.items.length){S.items.push({id:'y1',name:'テスト項目',cat:(S.settings.cats||[''])[0],cycle:'毎月',who:'',base:''});save()}go('year')});await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{const w=document.querySelector('.tbw'),th=w&&w.querySelector('th.cur');if(!th)return {none:1};const a=w.getBoundingClientRect(),t=th.getBoundingClientRect();return {l:t.left-a.left,r:a.right-t.right,shadow:getComputedStyle(th).boxShadow,sw:document.documentElement.scrollWidth}});
  if(r.none)bad.push(label+'：今月の列が無い');else{if(r.l<0||r.r<0)bad.push(label+'：今月の列が見える範囲に無い '+JSON.stringify(r));if(r.shadow==='none')bad.push(label+'：今月の列に色が無い');if(r.sw>392)bad.push(label+'：横にはみ出す')}
  await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
