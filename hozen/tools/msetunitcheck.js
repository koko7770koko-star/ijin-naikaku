// 測定：①ひな形の編集で、下限・上限の欄の横に単位（V・A・MΩ など）が出て、単位を打ち替えると両方がすぐ変わる ②測定の入力の行に「管理値 下限〜上限＋単位」が出る（管理値が無いときは出さない）。
// 保存の形は変えない（単位・下限・上限は今までの項目）。390pxで横にはみ出さない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 // ① ひな形
 await p.evaluate(()=>{S.mtpls=S.mtpls||[];editMtpl('')});await p.waitForTimeout(400);
 await p.evaluate(()=>{MT_ROWS.length=0;MT_ROWS.push({name:'電圧',unit:'V',min:190,max:210,ck:false},{name:'絶縁抵抗',unit:'MΩ',min:1,max:'',ck:false},{name:'外観',unit:'',min:'',max:'',ck:true});mtRender()});await p.waitForTimeout(200);
 const r1=await p.evaluate(()=>({u0:[...document.querySelectorAll('.mtu0')].map(e=>e.textContent),u1:[...document.querySelectorAll('.mtu1')].map(e=>e.textContent),u2:document.querySelectorAll('.mtu2').length,sw:document.documentElement.scrollWidth,mw:document.querySelector('#modal').scrollWidth,mc:document.querySelector('#modal').clientWidth}));
 ok(r1.u0.join()==='V,V','電圧の下限・上限の横に V が出ない '+r1.u0);ok(r1.u1.join()==='MΩ,MΩ','絶縁抵抗の単位 '+r1.u1);ok(r1.u2===0,'○×の項目に単位が出る');ok(r1.sw<=392&&r1.mw<=r1.mc+1,'ひな形の窓が横にはみ出す');
 await p.evaluate(()=>{const i=document.querySelector('#mt_rows input[aria-label="単位"]');i.value='kV';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(150);
 const r2=await p.evaluate(()=>({u0:[...document.querySelectorAll('.mtu0')].map(e=>e.textContent),unit:MT_ROWS[0].unit}));ok(r2.u0.join()==='kV,kV'&&r2.unit==='kV','単位を打ち替えても横の単位が変わらない '+JSON.stringify(r2));
 await p.evaluate(()=>closeModal(true));await p.waitForTimeout(200);
 // ② 測定の入力
 await p.evaluate(()=>{S.equipment=[{id:'e1',code:'E-1',name:'試験設備',kind:'変圧器',status:'稼働',locId:'',place:'',photos:[],docs:[],repairs:[],run:{meters:[]}}];save();editMeas('', 'e1')});await p.waitForTimeout(500);
 await p.evaluate(()=>{MEAS_ROWS.length=0;MEAS_ROWS.push({name:'電圧',unit:'V',min:190,max:210,v:'',ck:false},{name:'メモ',unit:'',min:'',max:'',v:'',ck:false},{name:'外観',unit:'',min:'',max:'',v:'',ck:true});measRenderRows()});await p.waitForTimeout(200);
 const r3=await p.evaluate(()=>({t:[...document.querySelectorAll('#ms_rows .mlimtx')].map(e=>e.textContent),sw:document.documentElement.scrollWidth,iw:innerWidth}));
 ok(r3.t.length===1&&/管理値 190〜210V/.test(r3.t[0]),'測定の行に管理値と単位が出ない '+JSON.stringify(r3.t));ok(r3.sw<=r3.iw,'測定の入力が横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
