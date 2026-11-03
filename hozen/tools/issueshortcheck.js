// 異常の記録（新規）：最初に出るのは 緊急度・写真・場所・内容 だけで、状態・発見日・設備・詳細・処置・期限・費用は「詳しく入れる」に畳まれている（消えていない）／
// 内容だけで保存でき、保存したあと「一覧（未完了）に入りました」と知らせる／畳んだ中の項目も保存される／下書きの復元で中身があれば開く／
// 既存の案件の編集は今までどおり全部見える／390pxではみ出さない。保存の形は変えない。
// usage: node hozen/tools/issueshortcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.issues=[];save();go('home');editIssue()});await p.waitForTimeout(500);
 const v=await p.evaluate(()=>{const vis=id=>{const e=document.getElementById(id);if(!e)return null;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest('details:not([open])')};
  return {title:vis('is_title'),place:vis('is_place'),detail:vis('is_detail'),date:vis('is_date'),action:vis('is_action'),cost:vis('is_cost'),exists:['is_detail','is_date','is_action','is_cost','is_status','is_urg'].every(i=>!!document.getElementById(i)),open:document.getElementById('is_more').open,sw:document.documentElement.scrollWidth,sum:document.querySelector('#is_more summary').getBoundingClientRect().height}});
 if(!v.title||!v.place)bad.push('内容・場所が見えない');if(v.detail||v.date||v.action||v.cost)bad.push('畳まれていない '+JSON.stringify(v));if(!v.exists)bad.push('畳んだ項目がDOMに無い');if(v.open)bad.push('最初から開いている');if(v.sw>392)bad.push('横にはみ出す');if(v.sum<44)bad.push('「詳しく」が小さい '+v.sum);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // 内容だけで保存
 await p.fill('#is_title','球切れ');await p.click('#modal .btn:text-is("保存")');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>({td:TODAY,n:S.issues.length,i:S.issues[0],toast:(document.querySelector('#toast')||document.body).textContent}));
 if(r.n!==1||r.i.title!=='球切れ'||r.i.status!=='発見'||r.i.date!==r.td)bad.push('保存の中身 '+JSON.stringify(r.i));
 if(!r.toast.includes('一覧（未完了）に入りました'))bad.push('保存の知らせ '+r.toast.slice(-80));
 // 畳んだ中の項目も保存される
 await p.evaluate(()=>editIssue());await p.waitForTimeout(400);
 await p.fill('#is_title','異音');await p.evaluate(()=>{const m=document.getElementById('is_more');m.open=true});await p.fill('#is_detail','ブレーカ付近');await p.fill('#is_cost','1200');
 await p.click('#modal .btn:text-is("保存")');await p.waitForTimeout(400);
 const r2=await p.evaluate(()=>S.issues.find(x=>x.title==='異音'));if(!r2||r2.detail!=='ブレーカ付近'||r2.cost!==1200)bad.push('畳んだ中の項目が保存されない '+JSON.stringify(r2));
 // 日付が不正なら開いて知らせる
 await p.evaluate(()=>editIssue());await p.waitForTimeout(400);await p.fill('#is_title','日付の試し');
 await p.evaluate(()=>{const d=document.getElementById('is_date');d.value='';});
 await p.evaluate(()=>saveIssue(''));await p.waitForTimeout(200);if(!await p.evaluate(()=>document.getElementById('is_more').open))bad.push('日付エラーで開かない');
 await p.evaluate(()=>closeModal(true));
 // 緊急度つきの呼び出し（preset）は開く
 await p.evaluate(()=>editIssue('',{detail:'点検で発見',title:'x'}));await p.waitForTimeout(400);if(!await p.evaluate(()=>document.getElementById('is_more').open))bad.push('presetに詳細があるのに閉じている');
 await p.evaluate(()=>closeModal(true));
 // 既存の編集は全部見える
 await p.evaluate(()=>editIssue(S.issues[0].id));await p.waitForTimeout(400);
 const e=await p.evaluate(()=>({more:!!document.getElementById('is_more'),date:document.getElementById('is_date').getBoundingClientRect().height>0,steps:document.getElementById('is_steps').getBoundingClientRect().height>0,del:!![...document.querySelectorAll('#modal button')].find(x=>x.textContent.includes('削除'))}));
 if(e.more||!e.date||!e.steps||!e.del)bad.push('既存の編集 '+JSON.stringify(e));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
