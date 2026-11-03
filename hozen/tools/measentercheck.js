// 測定の入力の確認：20行のひな形で、数字を入れて Enter を押すたびに次の行の値の欄へ進み（最後の行で止まる）、入れた値が全部残り、
// 390px で単位・下限・上限・値の欄が切れず・横にはみ出さないことを確かめる。保存の形（rows）は変えない。
// usage: node hozen/tools/measentercheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.mtpl=[{id:'t20',type:'電圧・電流・電力',name:'20行の試し',cycleM:1,kind:'',rows:[...Array(20)].map((_,i)=>({name:'項目'+(i+1)+'（名前の長い測定項目）',unit:'V',min:100,max:200}))}];
  S.equipment=[];editMeas(null,{tplId:'t20',type:'電圧・電流・電力',name:'20行の試し',rows:S.mtpl[0].rows.map(r=>({...r,v:''}))})});await p.waitForTimeout(500);
 const lay=await p.evaluate(()=>{const row=document.querySelector('#ms_rows .mrow');const ins=[...row.querySelectorAll('input')].filter(e=>e.type==='number'||e.placeholder==='単位');const rs=ins.map(e=>e.getBoundingClientRect());
  return {n:document.querySelectorAll('#ms_rows .mrow').length,w:rs.map(r=>Math.round(r.width)),cut:rs.some(r=>r.right>innerWidth||r.left<0),sw:document.documentElement.scrollWidth,mw:document.querySelector('#modal').scrollWidth,mc:document.querySelector('#modal').clientWidth}});
 if(lay.n!==20)bad.push('行が '+lay.n);if(lay.cut||lay.sw>392||lay.mw>lay.mc+1)bad.push('390pxで切れる・はみ出す '+lay.w.join(','));if(Math.min(...lay.w)<48)bad.push('入力欄が狭い '+lay.w.join(','));
 const vals=[...Array(20)].map((_,i)=>String(110+i));
 await p.focus('#ms_rows input[data-mv] >> nth=0');
 for(let i=0;i<20;i++){
  const idx=await p.evaluate(()=>[...document.querySelectorAll('#ms_rows input[data-mv]')].indexOf(document.activeElement));
  if(idx!==i){bad.push(`Enter で ${i+1} 行目に進まない（今 ${idx+1} 行目）`);break}
  await p.keyboard.type(vals[i]);await p.keyboard.press('Enter');await p.waitForTimeout(60);
 }
 const got=await p.evaluate(()=>MEAS_ROWS.map(r=>String(r.v)));if(got.join()!==vals.join())bad.push('入れた値が残らない：'+got.join(','));
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
