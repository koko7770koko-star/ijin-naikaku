// 夜勤シフト表の確認：390px で開き、マスが 44px 以上・押すと勤務を選ぶ窓が出る・ページが横にはみ出さない・
// 表だけが横にスクロールする・案内の一行がある・保存の形（kinmuhyo_v1）の項目が変わらないことを確かめる。
// usage: node hozen/tools/shiftcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 const r=await p.evaluate(()=>{const cs=[...document.querySelectorAll('#shTable td.cell')];const w=document.querySelector('#shTable').parentElement;
  return {n:cs.length,min:Math.min(...cs.map(x=>x.getBoundingClientRect().height)),hint:!!document.querySelector('.shhint'),sw:document.documentElement.scrollWidth,wscroll:w.scrollWidth>w.clientWidth}});
 if(!r.n)bad.push('マスが無い');if(r.min<44)bad.push('マスの高さが44px未満 '+r.min);if(!r.hint)bad.push('案内が無い');if(r.sw>392)bad.push('ページが横にはみ出す '+r.sw);
 await p.click('#shTodayBtn');await p.waitForTimeout(400);
 const td=await p.evaluate(()=>{const t=document.querySelector('#shTable tr.today');const w=document.querySelector('#shTable').parentElement;const b=document.getElementById('shTodayBtn');if(!t)return {none:1};const r=t.getBoundingClientRect(),wr=w.getBoundingClientRect();return {vis:r.top>=wr.top&&r.bottom<=wr.bottom+1,btn:b&&getComputedStyle(b).display!=='none'&&b.getBoundingClientRect().height>=44,bg:getComputedStyle(t.querySelector('.dc')).backgroundColor}});
 if(td.none)bad.push('今日の行が無い');else{if(!td.vis)bad.push('開いたとき今日の行が見える所に無い');if(!td.btn)bad.push('「今日へ」ボタンが無い・小さい');}
 const keys0=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}')).sort().join(','));
 await p.click('#shTable td.cell');await p.waitForTimeout(400);
 const pop=await p.evaluate(()=>{const e=document.querySelector('#pop,.pop,#popup');return !!e&&getComputedStyle(e).display!=='none'});if(!pop)bad.push('マスを押しても勤務を選ぶ窓が出ない');
 // 入れ替え：マス→「入れ替える」→相手→確認 の4タップで、2人の変更が1回の確認で入る
 {await p.keyboard.press('Escape');let done=false,sw={};const N=await p.evaluate(()=>document.querySelectorAll('#shTable td.cell').length);
  for(let k=0;k<Math.min(N,80)&&!done;k++){await p.evaluate(()=>{document.getElementById('pop').classList.remove('on')});
   await p.evaluate(k=>document.querySelectorAll('#shTable td.cell')[k].click(),k);
   if(!await p.$('#swapBtn'))continue;await p.click('#swapBtn');const o=await p.$('#popSwap [data-sw]');if(!o)continue;
   const d=await p.evaluate(k=>document.querySelectorAll('#shTable td.cell')[k].dataset.d,k);await o.click();await p.waitForTimeout(300);
   sw.modal=await p.evaluate(()=>/入れ替え/.test(document.body.innerText));
   const btn=await p.$('text=この内容で変更');if(!btn){bad.push('入れ替えの確認が出ない');done=true;break}await btn.click();await p.waitForTimeout(400);
   const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('kinmuhyo_v1')));sw.n=(st.changes||[]).length;sw.keys=Object.keys(st).filter(x=>x!=='hist').sort().join(',');done=true}
  if(!done)console.log('入れ替えの相手がいないため確認は省略');else if(sw.modal!==undefined){if(!sw.modal)bad.push('入れ替えの確認が出ない');if(sw.n<2)bad.push('入れ替えで2人分の変更が入らない '+sw.n);if(sw.keys!==keys0)bad.push('入れ替え後に保存の項目が変わった '+sw.keys)}}
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log('保存の項目:',keys0);console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
