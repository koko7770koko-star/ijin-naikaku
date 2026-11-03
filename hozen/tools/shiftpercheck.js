// シフト表：一人ずつの夜・日・休の回数が表の上に出る・390pxで切れない・保存の形は変わらない
// usage: node hozen/tools/shiftpercheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 const keys0=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}')).sort().join(','));
 const r=await p.evaluate(()=>{const cs=[...document.querySelectorAll('#shPer .pc')];const foot=[...document.querySelectorAll('#shTable tfoot tr')].find(t=>t.cells[0].textContent==='夜勤回数');
  return {n:cs.length,txt:cs.map(x=>x.innerText.replace(/\n/g,' ')),over:cs.filter(x=>x.scrollWidth>x.clientWidth+1).length,sw:document.documentElement.scrollWidth,
   foot:foot?[...foot.cells].slice(2,2+cs.length).map(x=>x.textContent):[],top:cs[0]?cs[0].getBoundingClientRect().top:-1}});
 if(!r.n)errs.push('回数の欄が出ない');
 r.txt.forEach((t,i)=>{const m=t.match(/夜 (\d+)/);if(!m||m[1]!==r.foot[i])errs.push('表の下の夜勤回数と違う '+t+' / '+r.foot[i])});
 if(r.sw>392)errs.push('横にはみ出す '+r.sw);if(r.top>400)errs.push('回数が下すぎる '+r.top);
 // 長い名前でも切れて崩れない
 await p.evaluate(()=>{const d=SHIFT.get();d.members[0].name='ながいなまえのしょくいんがここにはいる';SHIFT.set(d)});await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))errs.push('長い名前で横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 const keys1=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}')).sort().join(','));if(keys0&&keys1!==keys0)errs.push('保存の項目が変わった');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
