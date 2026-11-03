// 年間計画の絞り込みの確認：項目100件を入れて 390px で開き、分類で絞れる・今月の ◯ だけに絞れる・やめると全部戻る・
// 記録（marks・items）が変わらない・横にはみ出さない・エラーなし
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const info=await p.evaluate(()=>{const cats=S.settings.cats;const fy=fyOf(now.getFullYear(),now.getMonth()+1);V.fy=fy;S.marks[fy]=S.marks[fy]||{};const ci=idxOf(now.getMonth()+1);
  for(let i=0;i<100;i++){const id='yf'+i;S.items.push({id,name:'項目'+i,cat:cats[i%2],cycle:'毎月'});const r=Array(12).fill('');if(i%10===0)r[ci]='○';S.marks[fy][id]=r}
  go('year');return {cats,n:S.items.length}});
 await p.waitForTimeout(400);
 const rows=()=>p.evaluate(()=>document.querySelectorAll('table.yr tbody tr:not(.cat), table.yr tr:not(.cat):not(:first-child)').length);
 const n0=await rows();
 const snap=await p.evaluate(()=>JSON.stringify([S.items,S.marks]));
 await p.selectOption('select[aria-label="分類で絞り込む"]',info.cats[0]);await p.waitForTimeout(300);
 const n1=await rows();if(!(n1>0&&n1<n0))bad.push('分類で絞れない '+n0+'→'+n1);
 await p.click('text=今月の ◯ だけ');await p.waitForTimeout(300);
 const n2=await rows();if(n2!==10)bad.push('今月の ◯ だけが10件にならない '+n2);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 await p.click('text=絞り込みをやめる');await p.waitForTimeout(300);
 const n3=await rows();if(n3!==n0)bad.push('やめても戻らない '+n3+'/'+n0);
 const s2=await p.evaluate(()=>JSON.stringify([S.items,S.marks]));if(s2!==snap)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
