// 測定の入力：入力欄に前回の値が薄く出て（placeholder と「前回 ○」）、管理値を外れたら打ったその場で
//  「超えています（管理値 210V 以下）」「下回っています（管理値 190V 以上）」と言葉で出る。中なら「管理値内（190〜210V）」。保存する値は変えない。390px。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{S.equipment=[{id:'e1',code:'T-1',name:'変圧器',kind:'その他',status:'稼働',locId:'',place:'',importance:'',spec:{}}];
  S.meas=[{id:'m0',equipId:'e1',date:'2026-01-05',by:'確認者',name:'月次',type:'電圧・電流・電力',cond:{},rows:[{name:'電圧',v:200,unit:'V',min:190,max:210,ck:false}],note:'',photos:[]}];go('diag')});
 await p.evaluate(()=>editMeas(null,{equipId:'e1',name:'月次',type:'電圧・電流・電力',rows:[{name:'電圧',v:'',unit:'V',min:190,max:210,ck:false}]}));await p.waitForSelector('#ms_rows input[data-mv]');await p.waitForTimeout(150);
 const ph=await p.getAttribute('#ms_rows input[data-mv]','placeholder');if(ph!=='前回 200V')bad.push('前回の値が薄く出ない '+ph);
 if(!/前回 200V/.test(await p.evaluate(()=>$('#ms_rows').innerText)))bad.push('前回の値の印が無い');
 const word=async v=>{await p.fill('#ms_rows input[data-mv]',String(v));await p.waitForTimeout(60);return p.evaluate(()=>document.querySelector('#ms_rows .mrow .pill').textContent)};
 let w=await word(220);if(w!=='超えています（管理値 210V 以下）')bad.push('超えたときの言葉 '+w);
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'measword.png')})}
 w=await word(180);if(w!=='下回っています（管理値 190V 以上）')bad.push('下回ったときの言葉 '+w);
 w=await word(200);if(w!=='管理値内（190〜210V）')bad.push('中のときの言葉 '+w);
 // 描き直しても同じ言葉（確定したとき）
 await p.fill('#ms_rows input[data-mv]','215');await p.press('#ms_rows input[data-mv]','Tab');await p.waitForTimeout(100);
 w=await p.evaluate(()=>document.querySelector('#ms_rows .mrow .pill').textContent);if(w!=='超えています（管理値 210V 以下）')bad.push('確定後の言葉 '+w);
 if(await p.evaluate(()=>MEAS_ROWS[0].v)!==215)bad.push('保存する値が数でない');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
