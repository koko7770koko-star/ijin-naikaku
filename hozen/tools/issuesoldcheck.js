// 異常の一覧：案件 300 件（完了 250・対応中 50）で、対応中が上に来て、1 秒以内に出て、「さらに100件表示」で古い完了案件（去年・一昨年）まで辿れ、去年の案件に年が付くか。390px・文字「標準」「特大」ではみ出さない。保存の形は変えない（hz-v-issues-old-done）。
// usage: node hozen/tools/issuesoldcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;const T=TODAY;
  S.issues=[...Array(300)].map((_,i)=>{const done=i>=50;return {id:'is'+i,date:addD(T,-(done?(i-50)*3+1:i)),title:(done?'完了の試し':'対応中の試し')+i,place:'',status:done?'完了':'対応中',action:'増し締め',closed:done?addD(T,-(i-50)*3):'',detail:''}});
  save();applyFScale();V.isF='all';V.isQ='';V.isB='';V.isMore=0},fs);
 const ms=await p.evaluate(()=>{const t=performance.now();go('issues');return performance.now()-t});await p.waitForTimeout(300);
 if(ms>1000)bad.push(tag+'出るまで '+Math.round(ms)+'ms');
 const st=()=>p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')].filter(x=>/の試し\d+/.test(x.textContent));
  return {n:it.length,first:it.slice(0,50).every(x=>/対応中の試し/.test(x.textContent)),afterOpen:it.slice(50).every(x=>/完了の試し/.test(x.textContent)),
   last:it.length?it[it.length-1].textContent:'',yr:it.length?(it[it.length-1].querySelector('.dt .yr')||{textContent:''}).textContent:'',
   more:[...document.querySelectorAll('#app button')].filter(x=>/さらに100件表示/.test(x.textContent)).map(x=>x.textContent.trim())[0]||'',sw:document.documentElement.scrollWidth}});
 let r=await st();const L0=await p.evaluate(()=>document.querySelector('#app').textContent.match(/異常・故障\s*(\d+)件/));
 if(r.n!==100)bad.push(tag+'先頭の件数 '+r.n);if(!r.first)bad.push(tag+'対応中が上に来ない');if(!/残り 200件/.test(r.more))bad.push(tag+'ボタン '+r.more);
 for(let k=0;k<2;k++){await p.evaluate(()=>{[...document.querySelectorAll('#app button')].find(x=>/さらに100件表示/.test(x.textContent)).click()});await p.waitForTimeout(250)}
 r=await st();if(r.n!==300)bad.push(tag+'全件出ない '+r.n);if(!r.afterOpen)bad.push(tag+'完了の並び');if(r.more)bad.push(tag+'全部出たのにボタン');
 if(!/完了の試し299/.test(r.last))bad.push(tag+'最後が最古でない '+r.last.slice(0,40));
 const oldY=await p.evaluate(()=>addD(TODAY,-(249*3+1)).slice(0,4));if(r.yr!==oldY+'/')bad.push(tag+'去年の案件に年が付かない '+r.yr+' 期待 '+oldY);
 if(r.sw>392)bad.push(tag+'はみ出す '+r.sw);
 const keep=await p.evaluate(()=>S.issues.length===300&&S.issues.every(i=>!('_more' in i)));if(!keep)bad.push(tag+'保存の形が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
