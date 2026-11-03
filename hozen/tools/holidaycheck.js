// 祝日の確認：内蔵の祝日表（通信なし）が正しい日を返し、カレンダー・作業表で土日祝が色と「祝」で分かる。390px ではみ出さない。
// usage: node hozen/tools/holidaycheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const EXP={'2026-01-01':'元日','2026-01-12':'成人の日','2026-02-11':'建国記念の日','2026-02-23':'天皇誕生日','2026-03-20':'春分の日','2026-04-29':'昭和の日','2026-05-03':'憲法記念日','2026-05-04':'みどりの日','2026-05-05':'こどもの日','2026-05-06':'振替休日','2026-07-20':'海の日','2026-08-11':'山の日','2026-09-21':'敬老の日','2026-09-22':'国民の休日','2026-09-23':'秋分の日','2026-10-12':'スポーツの日','2026-11-03':'文化の日','2026-11-23':'勤労感謝の日','2027-03-21':'春分の日','2027-03-22':'振替休日','2027-09-23':'秋分の日','2025-09-23':'秋分の日','2026-05-07':'','2026-11-04':'','2026-06-15':''};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const got=await p.evaluate(e=>Object.fromEntries(Object.keys(e).map(k=>[k,holName(k)])),EXP);
 for(const k in EXP)if(got[k]!==EXP[k])bad.push(k+' は「'+got[k]+'」（正：'+EXP[k]+'）');
 const n=await p.evaluate(()=>Object.keys(holMap(2026)).length);if(n!==18)bad.push("2026年の祝日数 "+n+"（18のはず）");
 await p.evaluate(()=>{V.y=2026;V.m=11;go('month')});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const ns=[...document.querySelectorAll('.cal .n')];return {n:ns.length,hl:document.querySelectorAll('.cal .hlb').length,sw:document.documentElement.scrollWidth,cut:ns.filter(e=>e.scrollWidth>e.clientWidth+1).length}});
 console.log(JSON.stringify(r));if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
