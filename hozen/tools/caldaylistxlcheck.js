// カレンダー（month）で日を押したときの下の一覧（予定・工事・勤務）：文字「大」「特大」・360px で、①行の中の文字が切れない（overflow で scrollWidth>clientWidth）②押す所（ボタン・◯●・行）が 44px 以上③横にはみ出さない、を確かめる。
// usage: node hozen/tools/caldaylistxlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{const T=TODAY;S.tasks=S.tasks.filter(t=>t.date!==T);S.works=(S.works||[]).filter(x=>x.date!==T);
  for(let i=1;i<=5;i++)S.tasks.push({id:'tk'+i,date:T,time:'09:'+(10+i),kind:'月次',cat:'受変電',title:'月次点検 高圧受電盤と変圧器の外観'+i,place:'',staff:'職員'+i,attend:'',status:i<3?'予定':'済',result:'',note:'',photos:[]});
  for(let i=1;i<=2;i++)S.works.push({id:'wk'+i,no:'W-2026-00'+i,title:'工事'+i+' 幹線ケーブル更新と盤の改修',date:T,endDate:T,start:'13:00',status:'承認待ち',staff:['職員1'],outage:''});
  S.settings.fscale=f;save();applyFScale();go('month');pickDay(T)},fs);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const card=document.getElementById('dayCard');if(!card)return null;const o=[],small=[];
  card.querySelectorAll('*').forEach(e=>{if(!e.offsetParent)return;const cs=getComputedStyle(e);if(cs.overflow!=='visible'&&e.scrollWidth>e.clientWidth+1)o.push((e.className||e.tagName)+' 「'+e.textContent.trim().slice(0,10)+'」');
   if(e.matches('button,.item,[onclick]')){const q=e.getBoundingClientRect();if(q.height<43.5)small.push((e.className||e.tagName)+' 「'+e.textContent.trim().slice(0,8)+'」 '+Math.round(q.height))}});
  const R=card.getBoundingClientRect();return {o:[...new Set(o)],small:[...new Set(small)],sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,right:R.right,n:card.querySelectorAll('.item').length}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 if(!r){errs.push(tag+'：日の一覧が出ない');await c.close();continue}
 if(r.n<7)errs.push(tag+'：一覧の行が '+r.n+'（7 のはず）');
 if(r.o.length)errs.push(tag+'：切れた文字 '+r.o.slice(0,4).join(' | '));
 if(r.small.length)errs.push(tag+'：44px 未満の押す所 '+r.small.slice(0,5).join(' | '));
 if(r.sw>r.cw+1||r.right>w+1)errs.push(tag+'：横にはみ出す '+r.sw+'>'+r.cw);
 if(shot)await (await p.$('#dayCard')).screenshot({path:shot+'-'+w+fs+'.png'});
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
