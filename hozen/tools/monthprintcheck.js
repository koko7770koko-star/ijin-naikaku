// カレンダー月の印刷の確認：予定が多い月（1日に12件・長い名前・勤務者表示あり）でも、A4縦の1ページに収まり、予定が全件出て、画面には印刷用の表が出ないことを確かめる。
// 1日に24件ある月（HEAVY=1）は、行が割れずに3ページまで。
// usage: node hozen/tools/monthprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const WAIT=()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(WAIT);
 await p.addScriptTag({content:'window.HEAVY='+(process.env.HEAVY?1:0)});
 const ym=await p.evaluate(()=>{const y=2027,m=1;for(let i=0;i<60;i++){const day=1+(i%28);S.tasks.push({id:'mp'+i,date:`${y}-01-${String(HEAVY&&i<24?5:day).padStart(2,'0')}`,time:'',kind:'月次',cat:'',title:'試しの点検'+i+'（受変電設備 高圧開閉器）',place:'',staff:'',attend:'',status:i%3?'予定':'完了',result:'',note:'',photos:[]})}
  V.view='month';V.y=y;V.m=m;V.sel=`${y}-01-05`;render();return {y,m}});
 await p.waitForTimeout(300);
 const scr=await p.evaluate(()=>{const e=document.querySelector('.mprint');return e?getComputedStyle(e).display:'none-missing'});
 if(scr!=='none')bad.push('画面で印刷用の表が出ている: '+scr);
 const over=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(over)bad.push('390pxで横にはみ出す');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});
 const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 if(process.env.HEAVY?pages>3:pages!==1)bad.push('印刷が '+pages+' ページになる（'+(process.env.HEAVY?'1日24件の月は3ページまで':'1ページのはず')+'）');
 await p.emulateMedia({media:'print'});
 const n=await p.evaluate(()=>({t:document.querySelectorAll('table.mpt .t').length,tot:S.tasks.filter(t=>t.date.startsWith('2027-01')).length,vis:[...document.querySelectorAll('#app .card')].filter(e=>getComputedStyle(e).display!=='none').length}));
 if(n.t!==n.tot)bad.push(`印刷の表の予定 ${n.t} 件が月の ${n.tot} 件と合わない`);
 if(n.vis!==1)bad.push('印刷で表以外のカードも出ている: '+n.vis);
 const cut=await p.evaluate(()=>[...document.querySelectorAll('table.mpt td')].filter(td=>td.scrollHeight>td.clientHeight+2).length);
 if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 console.log('days cut:',cut);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
