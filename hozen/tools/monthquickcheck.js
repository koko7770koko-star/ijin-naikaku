// カレンダー：日を選んだ予定一覧から、開かずに1回で ● （実施済み）にできる・年間計画の印も ● になる・元に戻すで両方戻る・44px・はみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.items=[{id:'itq',name:'確認点検',cat:'その他',cycle:'毎月'}];S.tasks=[{id:'tq1',title:'確認点検',date:TODAY,time:'',place:'',staff:'',status:'予定',result:'',photos:[]}];S.marks={};V.sel=TODAY;go('month')});await p.waitForTimeout(400);
 const btn=await p.evaluate(()=>{const x=[...document.querySelectorAll('#app button')].find(b=>/実施済みにする/.test(b.textContent));if(!x)return null;const r=x.getBoundingClientRect();return{h:r.height,sw:document.documentElement.scrollWidth}});
 if(!btn)bad.push('一覧に「実施済みにする」が出ない');else{if(btn.h<44)bad.push('ボタンが小さい '+btn.h);if(btn.sw>392)bad.push('はみ出す')}
 const mark=()=>p.evaluate(()=>{const fy=fyOf(+TODAY.slice(0,4),+TODAY.slice(5,7));return ((S.marks[fy]||{}).itq||[])[idxOf(+TODAY.slice(5,7))]||''});
 await p.click('#app button:has-text("実施済みにする")');await p.waitForTimeout(300);
 const st=await p.evaluate(()=>S.tasks[0].status+'/'+S.tasks[0].result);if(st!=='完了/良')bad.push('完了にならない '+st);
 if(await mark()!=='済')bad.push('年間計画の印が ● にならない：'+await mark());
 if(await p.evaluate(()=>[...document.querySelectorAll('#app button')].some(b=>/実施済みにする/.test(b.textContent))))bad.push('完了のあともボタンが残る');
 await p.click('#undobar button');await p.waitForTimeout(300);
 const st2=await p.evaluate(()=>S.tasks[0].status+'/'+(S.tasks[0].result||''));if(st2!=='予定/')bad.push('元に戻せない '+st2);if(await mark()!=='')bad.push('元に戻すで印が戻らない：'+await mark());
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
