// 盤の点検の別の月（hz-ban-month-past）と紙の凡例（hz-ban-print-legend）：
//  ‹ で先月 → 上に「○年○月（今月ではありません）」の帯と「今月へ」（押すと今月・帯が消える）。先月は ● を後から付けられる（遅れて入れる人のため）。
//  › で来月 → 帯に「◯（予定）だけ」・押すと 空→◯→空（● にならない）・「全部 ●」が出ない。今月には帯が出ない。
//  月報 6の3 の凡例に ●・◯・延・－・⚠、対応中の異常がある盤の名前に ⚠。手書きの空の表の説明に「延期なら 延」。banChk の形は変えない。390px・44px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r')];S.banChk={};
  S.issues=[{id:'i1',date:TODAY,title:'盤の異常：動力盤-2',place:'A棟 › 1階 › 第1電気室 › 動力盤-2',status:'発見',detail:'',action:'',photos:[],equipId:''}];V.banB='b';V.banYm=TODAY.slice(0,7);go('ban')});await p.waitForTimeout(200);
 const band=()=>p.evaluate(()=>{const e=document.querySelector('.banpast');return e?e.innerText:''});
 if(await band())bad.push('今月なのに帯が出る');
 await p.click('[aria-label="前の月"]');await p.waitForTimeout(150);if(!/今月ではありません/.test(await band()))bad.push('先月に帯が出ない');
 const cell=(n)=>p.locator('.banrow .bm:not(.bw)').nth(n);
 await cell(0).click();await cell(0).click();await p.waitForTimeout(80);if((await cell(0).textContent()).trim()!=='●')bad.push('先月に後から ● を付けられない');
 await p.click('.banpast button:has-text("今月へ")');await p.waitForTimeout(150);if(await band()||await p.evaluate(()=>V.banYm!==TODAY.slice(0,7)))bad.push('「今月へ」で今月に戻らない');
 await p.click('[aria-label="次の月"]');await p.waitForTimeout(150);if(!/◯（予定）だけ/.test(await band()))bad.push('来月の帯に ◯ だけの案内が無い');
 await cell(0).click();await p.waitForTimeout(60);let t=(await cell(0).textContent()).trim();await cell(0).click();await p.waitForTimeout(60);let t2=(await cell(0).textContent()).trim();
 if(t!=='◯'||t2!=='')bad.push('来月は 空→◯→空 にならない '+t+'/'+t2);
 if(await p.evaluate(()=>[...document.querySelectorAll('#app button')].some(x=>/全部 ●/.test(x.textContent))))bad.push('来月に「全部 ●」が出る');
 const shape=await p.evaluate(()=>Object.values(S.banChk).every(m=>Object.values(m).every(a=>Array.isArray(a)&&a.length===3&&a.every(x=>['','○','済','延'].includes(x)))));if(!shape)bad.push('banChk の形が変わった');
 const small=await p.evaluate(()=>[...document.querySelectorAll('#app button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44}).length);if(small)bad.push('44px 未満 '+small);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 // 紙の凡例
 const blank=await p.evaluate(()=>document.querySelector('.banprint .phd').innerText);if(!/延期なら 延/.test(blank))bad.push('空の表の説明に 延 が無い');
 const rep=await p.evaluate(()=>{const ym=TODAY.slice(0,7);S.banChk[ym]={x:['済','○','延']};const d=new Date();V.ry=d.getFullYear();V.rm=d.getMonth()+1;go('report');const t=[...document.querySelectorAll('.sec')].find(x=>/6の3/.test(x.textContent));
   if(!t)return {};const tb=t.nextElementSibling;return {leg:tb.nextElementSibling?tb.nextElementSibling.textContent:'',names:[...tb.querySelectorAll('tr td:first-child')].map(x=>x.textContent).filter(x=>/動力盤/.test(x))}});
 if(!/●＝実施済み/.test(rep.leg||'')||!/延＝延期/.test(rep.leg||'')||!/⚠＝対応中の異常あり/.test(rep.leg||''))bad.push('月報 6の3 の凡例が足りない '+rep.leg);
 if(!(rep.names||[]).includes('動力盤-2 ⚠')||(rep.names||[]).includes('動力盤-1 ⚠'))bad.push('対応中の異常のある盤だけに ⚠ が付かない '+JSON.stringify(rep.names));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
