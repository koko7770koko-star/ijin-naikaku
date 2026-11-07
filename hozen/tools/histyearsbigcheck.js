// 点検履歴：日常点検 5 年分（数値の項目すべて）で、期間「全部」の画面（グラフと表）が 1 秒以内に出て、390px・特大で横にはみ出さず、
// AI の傾向分析（aiTrend）に送る文が 6 万字以内で（10 年分は間引いて、間引いたこと・管理値を外れた日が入る）、つながらない（通信を止めた）ときに「作れませんでした」になるか（hz-v-hist-graph-years）。
// キーは書かない（端末の一時保存に試しの文字を置くだけ）。保存の形は変えない。usage: node hozen/tools/histyearsbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(async()=>{try{sessionStorage.setItem(KEYSTORE,'test-dummy')}catch(e){}
  const N=numDefs().slice(0,10);N[0].max=200;syncDefs&&syncDefs();for(let i=0;i<1826;i++){const d=addD(TODAY,-i),o={done:'済'};N.forEach((n,k)=>o[n.id]=100+k+(i%13)/10);S.daily[d]=o}save();
  V.hRange='all';const s=performance.now();go('hist');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const ms=performance.now()-s;
  const sw=document.documentElement.scrollWidth;
  aiTrend(N[0].id);const pre=document.querySelector('#modal pre.aisrc');const len=pre?pre.textContent.length:-1;closeModal(true);
  // 10 年分：間引いて 6 万字以内、間引いたことと管理値を外れた日が入る
  for(let i=1826;i<3652;i++){const d=addD(TODAY,-i),o={done:'済'};N.forEach((n,k)=>o[n.id]=100+k+(i%13)/10);S.daily[d]=o}const far=addD(TODAY,-3001);S.daily[far][N[0].id]=99999;save();
  aiTrend(N[0].id);const t10=document.querySelector('#modal pre.aisrc').textContent;closeModal(true);
  return {ms,sw,len,n:N.length,len10:t10.length,thin:/間引いた/.test(t10),out:t10.includes(far+' 99999'),lim:N[0].max}});
 console.log('全部の画面 '+Math.round(r.ms)+'ms・AI に送る文 5 年 '+r.len+' 字・10 年 '+r.len10+' 字（数値 '+r.n+' 項目）');
 if(r.len10>60000)bad.push('10 年分で送る文が長すぎる '+r.len10);if(!r.thin)bad.push('10 年分で間引いたことが書かれない');
 if(r.lim!==''&&r.lim!=null&&!r.out)bad.push('間引いても管理値を外れた日が残らない');
 if(r.ms>1000)bad.push('期間「全部」の画面が遅い '+Math.round(r.ms)+'ms');if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 if(r.len<0)bad.push('傾向分析の送る前の窓が出ない');else if(r.len>60000)bad.push('傾向分析に送る文が長すぎる '+r.len);
 await p.evaluate(()=>window.__aiGo());
 if(!await p.waitForFunction(()=>/作れませんでした/.test((document.querySelector('#modal')||{}).innerText||''),null,{timeout:20000}).then(()=>true).catch(()=>false))bad.push('つながらないとき「作れませんでした」にならない');
 await p.evaluate(()=>{closeModal(true);S.settings.fscale='xl';save()});await p.reload();await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const sw=await p.evaluate(()=>{V.hRange='all';go('hist');return document.documentElement.scrollWidth});if(sw>392)bad.push('特大で横にはみ出す '+sw);
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
