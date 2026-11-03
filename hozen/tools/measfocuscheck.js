// 測定の入力（hz-meas-focus）：1つの行に数字を打ってから次の行をタップすると、その行で続けて打てる（描き直しで入力が消えない）。
//  タッチ（390px）で：電圧に 200 → 電流をタップして 15 → 下限をタップして 10 → どれも入っていて、確定後の値も残る。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{S.equipment=[{id:'e1',code:'E-1',name:'変圧器',status:'稼働',locId:'',spec:{}}];editMeas(null,{equipId:'e1',rows:[{name:'電圧',v:'',unit:'V',min:'',max:'',ck:false},{name:'電流',v:'',unit:'A',min:'',max:'',ck:false}]})});
 await p.waitForSelector('#ms_rows input[data-mv]');await p.waitForTimeout(200);
 const tap=async sel=>{const e=(await p.$$(sel));return e};
 const tapAt=async (el)=>{await el.scrollIntoViewIfNeeded();const bx=await el.boundingBox();await p.touchscreen.tap(bx.x+bx.width/2,bx.y+bx.height/2);await p.waitForTimeout(80)};
 let v=await p.$$('#ms_rows input[data-mv]');await tapAt(v[0]);await p.keyboard.type('200');
 v=await p.$$('#ms_rows input[data-mv]');await tapAt(v[1]);await p.keyboard.type('15');
 const mins=await p.$$('#ms_rows input[placeholder="下限"]');await tapAt(mins[1]);await p.keyboard.type('10');
 const r=await p.evaluate(()=>({vals:[...document.querySelectorAll('#ms_rows input[data-mv]')].map(i=>i.value),min:[...document.querySelectorAll('#ms_rows input[placeholder="下限"]')].map(i=>i.value)}));
 if(r.vals.join()!=='200,15')bad.push('次の行をタップして打った数字が入らない '+JSON.stringify(r));
 if(r.min[1]!=='10')bad.push('下限をタップして打った数字が入らない '+JSON.stringify(r));
 await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.waitForTimeout(100);
 const m=await p.evaluate(()=>MEAS_ROWS.map(x=>[x.v,x.min]));if(JSON.stringify(m)!=='[[200,""],[15,10]]')bad.push('確定後の値が違う '+JSON.stringify(m));
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
