// 夜勤シフト表の夜間（暗い画面）の確認：390px・夜間でシフト表の全ページ（タブ）を開き、見えている文字のコントラスト比が 3 以上、
// 上のタブ（選んでいない物）と職員カードの回数の行（夜・日・休）は 4.5 以上。昼（標準）の色は変わらない。印刷は白地のまま。
// usage: node hozen/tools/shiftnightcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const MEAS=`(()=>{const lum=c=>{const m=c.match(/[\\d.]+/g).map(Number);const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
  const bgOf=e=>{let x=e;while(x){const b=getComputedStyle(x).backgroundColor;const m=b.match(/[\\d.]+/g);if(m&&(m.length<4||+m[3]>.5))return b;x=x.parentElement}return 'rgb(16,21,28)'};
  const cr=e=>{const cs=getComputedStyle(e),fg=lum(cs.color),bg=lum(bgOf(e)),hi=Math.max(fg,bg),lo=Math.min(fg,bg);return Math.round((hi+.05)/(lo+.05)*100)/100};
  const low=[];document.querySelectorAll('#shiftApp *').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own)return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
   const v=cr(e);if(v<3)low.push({t:e.textContent.trim().slice(0,16),cr:v,fg:getComputedStyle(e).color,bg:bgOf(e)})});
  const tabs=[...document.querySelectorAll('#shiftApp .tabs button:not(.on)')].map(e=>({t:e.textContent.trim(),cr:cr(e),fg:getComputedStyle(e).color}));
  const per=[...document.querySelectorAll('#shiftApp .shper .pc span')].map(e=>({t:e.textContent.trim(),cr:cr(e),fg:getComputedStyle(e).color}));
  return {low,tabs,per,sw:document.documentElement.scrollWidth}})()`;
 // 昼の色を控える
 await p.evaluate(()=>go('shift'));await p.waitForTimeout(700);
 const day=await p.evaluate(MEAS);
 // 夜間にする
 await p.evaluate(()=>{S.settings.night='on';save();applyNight&&applyNight()}).catch(()=>{});
 await p.evaluate(()=>{if(!document.documentElement.classList.contains('night')){go('set')}});await p.waitForTimeout(300);
 if(!await p.evaluate(()=>document.documentElement.classList.contains('night'))){await p.click('button:has-text("夜間")');await p.waitForTimeout(300)}
 if(!await p.evaluate(()=>document.documentElement.classList.contains('night')))bad.push('夜間にならない');
 await p.evaluate(()=>go('shift'));await p.waitForTimeout(700);
 const tabN=await p.evaluate(()=>document.querySelectorAll('#shiftApp .tabs button').length);if(tabN<2)bad.push('シフト表のタブが無い');
 for(let i=0;i<tabN;i++){
  await p.evaluate(i=>document.querySelectorAll('#shiftApp .tabs button')[i].click(),i);await p.waitForTimeout(400);
  const r=await p.evaluate(MEAS);const nm=await p.evaluate(i=>document.querySelectorAll('#shiftApp .tabs button')[i].textContent.trim(),i);
  if(r.sw>392)bad.push(nm+'：はみ出す '+r.sw);
  if(r.low.length)bad.push(nm+'：コントラスト 3 未満 '+r.low.length+'件 '+JSON.stringify(r.low.slice(0,4)));
  r.tabs.filter(t=>t.cr<4.5).forEach(t=>bad.push(nm+'：上のタブ「'+t.t+'」の比 '+t.cr+'（4.5 未満） '+t.fg));
  if(i===0){if(!r.per.length)bad.push('職員カードの回数の行が無い');r.per.filter(t=>t.cr<4.5).slice(0,2).forEach(t=>bad.push('回数の行「'+t.t+'」の比 '+t.cr+'（4.5 未満） '+t.fg))}
 }
 await p.evaluate(()=>document.querySelectorAll('#shiftApp .tabs button')[0].click());await p.waitForTimeout(300);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // 印刷は白地のまま
 await p.emulateMedia({media:'print'});const pb=await p.evaluate(()=>getComputedStyle(document.querySelector('#shiftApp')).backgroundColor);await p.emulateMedia({media:'screen'});
 if(!/255, 255, 255|242, 244, 247|rgba\(0, 0, 0, 0\)/.test(pb))bad.push('印刷のシフト表の背景が暗い '+pb);
 // 標準に戻すと昼の色のまま（変わっていない）
 await p.evaluate(()=>{S.settings.night='';save()});await p.evaluate(()=>go('set'));await p.waitForTimeout(200);
 if(await p.evaluate(()=>document.documentElement.classList.contains('night'))){await p.click('button:has-text("標準")');await p.waitForTimeout(200)}
 await p.evaluate(()=>go('shift'));await p.waitForTimeout(500);await p.evaluate(()=>document.querySelectorAll('#shiftApp .tabs button')[0].click());await p.waitForTimeout(300);
 const day2=await p.evaluate(MEAS);
 if(JSON.stringify(day.tabs.map(t=>t.fg))!==JSON.stringify(day2.tabs.map(t=>t.fg))||JSON.stringify(day.per.map(t=>t.fg))!==JSON.stringify(day2.per.map(t=>t.fg)))bad.push('昼（標準）の色が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
