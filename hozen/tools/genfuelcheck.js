// 非常用発電機の燃料と「停電時に運転できる時間の目安」の確認：
//  設備の仕様「燃料消費量（L/h）」（% のときは「燃料タンク容量」も）があれば、測定記録の「燃料残量」を入れたその場で「約○時間」が出て、
//  設備カルテにも最新の記録から出る。仕様が空なら出さない（入れ方の案内だけ）。決まった時間の基準は書かない。測定記録・設備の形は変えない。390px。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
const src=fs.readFileSync(FILE,'utf8');if(/72\s*時間/.test(src.slice(src.indexOf('function genFuelHours'),src.indexOf('function genFuelHours')+3000)))bad.push('目安の近くに決まった時間の基準が書いてある');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 // 計算
 const u=await p.evaluate(()=>{const e={spec:{'燃料タンク容量':'1,950L','燃料消費量（L/h）':'65'}},n={spec:{'燃料タンク容量':'1950'}},x={spec:{'燃料消費量（L/h）':'６５'}};
  const r=(e,v,u)=>{const f=genFuelHours(e,v,u);return f?Math.round(f.h*10)/10:null};
  return [r(e,50,'%'),r(e,650,'L'),r(n,50,'%'),r(x,50,'%'),r(x,130,'Ｌ'),r(e,'', '%'),r(e,50,'kPa')].join()});
 if(u!=='15,10,,,2,,')bad.push('計算が違う '+u);
 const eq=(id,spec)=>({id,code:'G-'+id,name:'非常用発電機 '+id,kind:'発電機',status:'稼働',locId:'',place:'',importance:'',spec});
 await p.evaluate(E=>{S.equipment=E;S.meas=[];go('equip')},[eq('g1',{'燃料タンク容量':'1950L','燃料消費量（L/h）':'65'}),eq('g2',{'燃料タンク容量':'1950L'})]);
 // 仕様の入力欄に「燃料消費量（L/h）」がある
 await p.evaluate(()=>editEquip('g2'));await p.waitForSelector('#e_name');await p.waitForTimeout(150);
 if(!(await p.$('#e_spec input[data-sk="燃料消費量（L/h）"]')))bad.push('仕様に燃料消費量（L/h）の欄が無い');
 await p.evaluate(()=>closeModal(true));
 // 入力画面：残量を入れたその場で目安が出る
 const row={name:'燃料残量',unit:'%',v:'',min:'',max:'',ck:false};
 await p.evaluate(r=>editMeas(null,{equipId:'g1',type:'電圧・電流・電力',name:'月次',rows:[r]}),row);await p.waitForSelector('#ms_rows input[data-mv]');await p.waitForTimeout(150);
 await p.fill('#ms_rows input[data-mv]','50');await p.waitForTimeout(100);
 const t=await p.evaluate(()=>{const e=document.querySelector('.mfuel');return e&&getComputedStyle(e).display!=='none'?e.textContent:''});
 if(!/約15時間/.test(t)||!/975L/.test(t))bad.push('入力画面に目安が出ない '+t);
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'fuel1-meas.png')})}
 await p.press('#ms_rows input[data-mv]','Tab');await p.fill('#ms_by','確認者');await p.click('#modal button:text-is("保存")');await p.waitForTimeout(250);
 const m=await p.evaluate(()=>S.meas.length&&JSON.stringify(Object.keys(S.meas[0].rows[0]).sort()));if(!m)bad.push('測定記録が保存されない');
 // 設備カルテ
 await p.evaluate(()=>{closeModal(true);go('equipDetail',{eq:'g1',eqTab:'ov'})});await p.waitForTimeout(250);
 const k=await p.evaluate(()=>document.querySelector('#app').innerText);if(!/燃料と運転できる時間の目安/.test(k)||!/約15時間/.test(k))bad.push('設備カルテに目安が出ない');
 const top=await p.evaluate(()=>{const t=[...document.querySelectorAll('#app .card')].find(c=>/いまの状況/.test(c.textContent));return t?t.innerText:''});if(!/燃料の時間\s*約15時間/.test(top))bad.push('いまの状況に燃料の時間が出ない '+top.slice(0,160));
 if(OUT)await p.screenshot({path:path.join(OUT,'fuel2-karte.png')});
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 // 消費量が無い設備：出さず、案内だけ
 await p.evaluate(r=>editMeas(null,{equipId:'g2',rows:[r]}),{...row,v:50});await p.waitForSelector('#ms_rows');await p.waitForTimeout(150);
 const t2=await p.evaluate(()=>document.querySelector('#ms_rows').innerText);if(/約\d/.test(t2)||!/燃料消費量（L\/h）」を入れると/.test(t2))bad.push('消費量が無いのに目安が出る／案内が無い');
 await p.evaluate(()=>{closeModal(true);go('equipDetail',{eq:'g2',eqTab:'ov'})});await p.waitForTimeout(150);
 if(/燃料と運転できる時間の目安/.test(await p.evaluate(()=>document.querySelector('#app').innerText)))bad.push('消費量が無い設備にカードが出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
