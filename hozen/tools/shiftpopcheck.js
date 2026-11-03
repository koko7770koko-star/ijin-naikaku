// シフト表のマスを押して出る勤務の選び窓（#pop）の確認：390×844 と 360×640 で、選ぶボタン・入れ替え・閉じるが 44px 以上・重ならない・窓が画面に収まる（横にはみ出さない・閉じるが見える）ことを確かめる。kinmuhyo_v1 の形は変えない。
// usage: node hozen/tools/shiftpopcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,h] of [[390,844],[360,640]]){
 const c=await b.newContext({viewport:{width:w,height:h}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 await p.click('#shTodayBtn');await p.waitForTimeout(300);
 const keys0=await p.evaluate(()=>localStorage.getItem('kinmuhyo_v1')||'');
 await p.click('#shTable td.cell');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const pop=document.getElementById('pop'),box=pop.querySelector('.box');if(!pop.classList.contains('on'))return {off:1};
  const bs=[...box.querySelectorAll('button')].filter(e=>e.offsetParent);const rects=bs.map(e=>({t:(e.textContent||'').trim().slice(0,8),r:e.getBoundingClientRect()}));
  const small=rects.filter(x=>x.r.height<44).map(x=>x.t+':'+Math.round(x.r.height));
  let ov=0;for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i].r,c=rects[j].r;if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)ov++}
  const bb=box.getBoundingClientRect();const close=bs.find(e=>/閉じる|キャンセル|やめる/.test(e.textContent));const cr=close&&close.getBoundingClientRect();
  return {n:bs.length,small,ov,top:bb.top,bottom:bb.bottom,vh:innerHeight,sw:document.documentElement.scrollWidth,right:Math.max(...rects.map(x=>x.r.right)),closeVisible:!!cr&&cr.bottom<=innerHeight+1&&cr.top>=0,hasClose:!!close,boxScroll:box.scrollHeight>box.clientHeight+1,overflowY:getComputedStyle(box).overflowY}});
 const tag=w+'x'+h+'：';
 if(r.off){bad.push(tag+'マスを押しても窓が出ない');await c.close();continue}
 if(r.small.length)bad.push(tag+'44px未満のボタン '+r.small.join(' '));if(r.ov)bad.push(tag+'ボタンが重なる '+r.ov);
 if(r.sw>w+2||r.right>w+1)bad.push(tag+'横にはみ出す');if(!r.hasClose)bad.push(tag+'閉じる/キャンセルが無い');else if(!r.closeVisible&&!r.boxScroll)bad.push(tag+'閉じるが画面の外');
 if(r.bottom>r.vh+1)bad.push(tag+'窓が画面の下にはみ出す');
 if(r.top<0&&r.overflowY==='visible')bad.push(tag+'窓が画面の上にはみ出して見えない部分がある（スクロールもできない） '+Math.round(r.top));
 if(process.argv[2]&&w===390)await p.screenshot({path:process.argv[2]});
 if(w===360&&process.argv[2])await p.screenshot({path:process.argv[2].replace('.png','-360.png')});
 const k1=await p.evaluate(()=>localStorage.getItem('kinmuhyo_v1')||'');if(k1!==keys0)bad.push(tag+'開いただけで記録が変わった');
 await c.close();}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
