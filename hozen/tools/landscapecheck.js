// 横向き（844x390）の確認：ホーム・日常点検・カレンダー・設備台帳・シフト表で、下の固定ナビが小さく（48px以下）、
// 窓（#modal）が画面内に収まり下の「閉じる」等に届き、横にはみ出さないこと。usage: node hozen/tools/landscapecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:844,height:390}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const info=[];
 for(const v of ['home','day','month','equip','hist','set']){await p.evaluate(x=>go(x),v);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const n=document.querySelector('nav').getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect();
   return {nav:Math.round(n.height),head:Math.round(h.height),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
  info.push(v+' nav='+r.nav+' header='+r.head);
  if(r.nav>48)errs.push(v+': 下のナビが高い '+r.nav+'px（48以下）');
  if(r.head>50)errs.push(v+': 見出しが高い '+r.head+'px（50以下）');
  if(r.sw>r.cw+1)errs.push(v+': 横にはみ出し '+r.sw+'>'+r.cw)}
 // 窓：長い窓を開いても画面内に収まる
 await p.evaluate(()=>{openModal('<h3>確認</h3>'+'<p>行</p>'.repeat(40)+'<div class="mfoot"><button class="btn" id="lsClose" onclick="closeModal()">閉じる</button></div>')});await p.waitForTimeout(200);
 const m=await p.evaluate(()=>{const e=document.querySelector('#modal').getBoundingClientRect();const f=document.querySelector('#lsClose').getBoundingClientRect();return {top:e.top,bottom:e.bottom,fb:f.bottom,ft:f.top,h:innerHeight}});
 if(m.top<0||m.bottom>m.h+1)errs.push('窓が画面の外 '+JSON.stringify(m));
 if(m.ft<0||m.fb>m.h+1)errs.push('閉じるボタンが画面の外 '+JSON.stringify(m));
 console.log(info.join('\n'));console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
