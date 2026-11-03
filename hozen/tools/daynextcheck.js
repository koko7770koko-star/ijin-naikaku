// 日常点検の「次の未入力へ」の確認：項目を40件にして 390px で開き、残りの数が出る・押すと次の未入力欄に移る・
// 入れると残りが減る・保存の形が変わらない・横にはみ出さない・エラーなし
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const base=await p.evaluate(()=>{for(let i=0;i<20;i++)S.settings.dnums.push({id:'qn'+i,name:'測定'+i,short:'測'+i,unit:'V',min:'',max:'',req:false,chg:''});for(let i=0;i<20;i++)S.settings.dchecks.push({id:'qc'+i,name:'確認'+i,req:false});V.day=TODAY;go('day');return numDefs().length+chkDefs().length});
 await p.waitForTimeout(500);
 const t0=await p.evaluate(()=>{const b=document.getElementById('dayNextBtn');return b?b.textContent:''});
 const m=t0.match(/残り (\d+)/);if(!m||+m[1]!==base)bad.push('残りの数が合わない '+t0+' / '+base);
 await p.click('#dayNextBtn');await p.waitForTimeout(500);
 const f=await p.evaluate(()=>document.activeElement&&document.activeElement.id);if(!/^n_/.test(f||''))bad.push('最初の未入力欄に移らない '+f);
 await p.keyboard.type('5');await p.evaluate(()=>document.activeElement.dispatchEvent(new Event('change',{bubbles:true})));await p.waitForTimeout(400);
 const t1=await p.evaluate(()=>{const b=document.getElementById('dayNextBtn');return b?b.textContent:''});if(!t1.includes('残り '+(base-1)))bad.push('入れても残りが減らない '+t1);
 const sv=await p.evaluate(id=>S.daily[TODAY][id.slice(2)],f);if(String(sv)!=='5')bad.push('保存されない '+sv);
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
