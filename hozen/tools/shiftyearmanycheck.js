// シフト表：メンバー 30 人（夜勤 24・日勤 6）・予定変更 3 年分（約 4500 件）で、シフト表が 1 秒以内に出て、月を替えるたびに 1 秒以内、
// マスを押して勤務を選び「この内容で変更」までがそれぞれ 1 秒以内で、変更が保存され（kinmuhyo_v1 の形は同じ）、印刷（A4 縦）が作れるか。
// 390px（hz-v-shift-year-many）。usage: node hozen/tools/shiftyearmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=1000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 // 1 件だけ画面で変えて、変更の記録の形を知る
 await p.click('#shTable td.cell');await p.waitForTimeout(200);await p.click('#popOpts button:not(.cur)');await p.waitForTimeout(300);
 const ap=await p.$('button:has-text("この内容で変更")');if(ap){await ap.click();await p.waitForTimeout(300)}
 const keys0=await p.evaluate(()=>{const g=SHIFT.get();return {k:Object.keys(g).sort().join(','),c:g.changes[0]}});if(!keys0.c){bad.push('最初の変更ができない');console.log(bad.join('\n'));process.exit(1)}
 await p.evaluate(c0=>{const g=SHIFT.get();g.members=[...Array(30)].map((_,i)=>({name:'職員'+(i+1),type:i<24?'夜勤':'日勤'}));const V=['有給','希望休','A日夜勤','B日夜勤','日勤'];const ch=[];
  const isNum=typeof c0.date==='number',base=isNum?c0.date:null;
  for(let k=0;k<4500;k++){const off=-900+Math.floor(k/5);const date=isNum?base+off:(()=>{const d=new Date(c0.date+'T00:00:00');d.setDate(d.getDate()+off);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
   const name='職員'+(1+(k*7)%30);if(!ch.some(x=>x.name===name&&x.date===date))ch.push({...c0,name,date,val:V[k%5]})}
  g.changes=ch;SHIFT.set(g)},keys0.c);await p.waitForTimeout(500);
 const nCh=await p.evaluate(()=>SHIFT.get().changes.length);
 const tm={};let s=Date.now();await p.click('#nav button[data-v="home"]');await p.click('#nav button[data-v="shift"]');await p.waitForSelector('#shTable td.cell');tm.open=Date.now()-s;
 const turns=[];for(const k of [-1,-1,-1,1]){s=Date.now();await p.evaluate(k=>moveMonth(k),k);await p.waitForTimeout(20);turns.push(Date.now()-s-20)}tm.turn=Math.max(...turns);
 s=Date.now();await p.click('#shTable td.cell >> nth=40');await p.waitForSelector('#popOpts button');tm.pop=Date.now()-s;
 s=Date.now();await p.click('#popOpts button:not(.cur) >> nth=0');const cf=await p.waitForSelector('button:has-text("この内容で変更")',{timeout:5000}).catch(()=>null);tm.confirm=Date.now()-s;
 if(!cf)bad.push('確かめの窓が出ない');else{s=Date.now();await cf.click();await p.waitForTimeout(20);tm.apply=Date.now()-s-20}
 for(const k in tm)if(tm[k]>LIM)bad.push(k+' '+tm[k]+'ms');
 const after=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('kinmuhyo_v1'));return {k:Object.keys(o).sort().join(','),n:o.changes.length,m:o.members.length}});
 if(after.k!==keys0.k)bad.push('kinmuhyo_v1 の形が変わった '+after.k);if(after.n<nCh)bad.push('変更が保存されない '+after.n+'/'+nCh);if(after.m!==30)bad.push('メンバーが '+after.m);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 s=Date.now();await p.click('#tabs button[data-p="sub"]');await p.waitForTimeout(800);const buf=await p.pdf({preferCSSPageSize:true,printBackground:true}).catch(e=>{bad.push('印刷が作れない '+e.message);return null});tm.pdf=Date.now()-s;if(buf&&buf.length<5000)bad.push('印刷が空');
 if(process.env.CHG_OUT)require('fs').writeFileSync(process.env.CHG_OUT,await p.evaluate(()=>[...document.querySelectorAll('#chgList tr')].map(r=>r.textContent).join('\n')));
 console.log('変更 '+nCh+'件・'+JSON.stringify(tm));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
