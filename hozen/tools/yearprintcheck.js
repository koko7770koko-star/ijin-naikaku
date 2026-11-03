// 年間計画の印刷（A4 横）：項目 60 件・長い項目名で、列が紙の幅に収まる・項目名が1字ずつ折れない・◯●が小さすぎない・行が割れない・操作ボタンが出ない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1123,height:794}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const fy=fyOf(now.getFullYear(),now.getMonth()+1);V.fy=fy;S.items=Array.from({length:60},(_,i)=>({id:'yi'+i,name:i%6===0?'高圧受電設備の年次精密点検（停電作業を伴う長い名前）':'点検項目'+(i+1),cat:S.settings.cats[i%S.settings.cats.length]||'その他',cycle:'毎月'}));
  S.marks[fy]={};S.items.forEach((it,i)=>{S.marks[fy][it.id]=Array.from({length:12},(_,m)=>(m+i)%3===0?'済':(m+i)%3===1?'○':'')});go('year')});
 await p.waitForTimeout(300);
 const pg=await p.evaluate(()=>document.querySelector('#pageStyle').textContent);if(!/landscape/.test(pg))bad.push('用紙が横向きにならない：'+pg);
 await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const t=document.querySelector('table.yr'),w=document.querySelector('.tbw');const tr=t.getBoundingClientRect();
  const nm=[...t.querySelectorAll('td.nm')];const mk=t.querySelector('td.mk');
  return{tw:tr.width,wscroll:w.scrollWidth-w.clientWidth,maxNmH:Math.max(...nm.map(x=>x.getBoundingClientRect().height)),nmW:nm[0].getBoundingClientRect().width,mkFont:parseFloat(getComputedStyle(mk).fontSize)*0.75,mkH:mk.getBoundingClientRect().height,avoid:getComputedStyle(t.querySelector('tr:nth-child(3)')).breakInside,hid:[...document.querySelectorAll('#app .btn')].filter(x=>x.offsetParent).length,sw:document.documentElement.scrollWidth}});
 if(r.wscroll>1||r.sw>1130)bad.push('列が紙の外に切れる '+r.wscroll+'/'+r.sw);
 if(r.nmW<150)bad.push('項目名の列が狭い '+r.nmW);if(r.maxNmH>60)bad.push('項目名が折れすぎ '+r.maxNmH);
 if(r.mkFont<10)bad.push('◯●が小さい '+r.mkFont+'pt');if(r.avoid!=='avoid')bad.push('行がページの境で割れる設定');if(r.hid)bad.push('操作ボタンが印刷に出る '+r.hid);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
