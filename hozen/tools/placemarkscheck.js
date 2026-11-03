// 年間計画：項目の編集窓から「毎月／隔月／3か月ごと／半年ごと／年1回」で ◯ をまとめて置ける。
// 空のマスだけに置き ●・延は変えない・元に戻せる・保存の形は今までと同じ（marks の行は12個の配列）・390px ではみ出さない。
// usage: node hozen/tools/placemarkscheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.items=[{id:'it1',cat:S.settings.cats[0],name:'試験の点検',cycle:'',basis:'',who:'',base:'',time:'',place:'',staff:'',attend:'',skipOff:true,track:true}];S.marks={};S.marks[V.fy]={it1:['','','済','','','延','','','','','','']};save();go('year')});
 await p.waitForTimeout(300);
 const run=async(rp,rs)=>{await p.evaluate(()=>editItem('it1'));await p.waitForSelector('#i_rp');await p.selectOption('#i_rp',rp);await p.selectOption('#i_rs',rs);await p.click('text=◯ を置く');await p.waitForTimeout(200);return p.evaluate(()=>S.marks[V.fy].it1.join(','))};
 let r=await run('3','0');if(r!=='○,,済,○,,延,○,,,○,,')bad.push('3か月ごと '+r);
 await p.evaluate(()=>{closeModal(true);S.marks[V.fy].it1=Array(12).fill('')});
 r=await run('1','0');if(r!=='○,○,○,○,○,○,○,○,○,○,○,○')bad.push('毎月 '+r);
 await p.evaluate(()=>{closeModal(true);S.marks[V.fy].it1=Array(12).fill('')});
 r=await run('12','9');if(r!==',,,,,,,,,○,,')bad.push('年1回(1月) '+r);
 await p.evaluate(()=>{closeModal(true);S.marks[V.fy].it1=Array(12).fill('')});
 r=await run('2','1');if(r!==',○,,○,,○,,○,,○,,○')bad.push('隔月(5月〜) '+r);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.click('#undobar button');await p.waitForTimeout(200);r=await p.evaluate(()=>S.marks[V.fy].it1.join(','));if(r!==',,,,,,,,,,,')bad.push('元に戻せない '+r);
 const kept=await p.evaluate(()=>{save();return Array.isArray(JSON.parse(localStorage.getItem('hospElecSched_v1')).marks[V.fy].it1)&&JSON.parse(localStorage.getItem('hospElecSched_v1')).marks[V.fy].it1.length===12});if(!kept)bad.push('保存の形');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
