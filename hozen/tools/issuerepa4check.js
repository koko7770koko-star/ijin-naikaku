// 修理報告書の印刷（A4）：内容 40 行・処置 10 行・原因と再発防止 5 行でも、長い欄が丸ごと次の頁に送られて 1 頁目がヘッダーだけになることがない（2 頁に収まり、1 頁目に内容の 1 行目がある）。
// 長い欄は 1 行ずつ別の tr（tr.lt）、1 行だけの欄は今までどおり 1 つの tr（hz-v-print-longrow）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const mk=async(N,A,B)=>{await p.emulateMedia({media:'screen'});await p.evaluate(([N,A,B])=>{const lines=n=>Array.from({length:n},(_,i)=>'手順'+(i+1)+' 受変電設備の盤内を点検し、端子の緩みと発熱を確かめた').join('\n');
  S.issues=[{id:'isa4',date:TODAY,status:'対応中',title:'試しの異常',urgency:'高',downH:'',equipId:'',place:'電気室',detail:lines(N),action:lines(A),cause:B?lines(B):'',prevent:B?lines(B):'',cost:'',confirmedBy:'',approvals:[],photos:[]}];
  go('printDoc',{doc:{t:'issue',id:'isa4'}})},[N,A,B]);await p.waitForTimeout(300);await p.emulateMedia({media:'print'});};
 const pages=async()=>{const buf=await p.pdf({format:'A4'});return (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length};
 await mk(40,10,5);
 const r=await p.evaluate(()=>({lt:document.querySelectorAll('#app tr.lt').length,first:[...document.querySelectorAll('#app tr.ltf>th')].map(t=>t.textContent),
   top1:(()=>{const t=document.querySelector('#app tr.ltf');const s=document.querySelector('#app .rep');return t&&s?Math.round(t.getBoundingClientRect().top-s.getBoundingClientRect().top):-1})()}));
 if(r.lt!==60)bad.push('長い欄が 1 行ずつの行（tr.lt）になっていない '+r.lt);
 if(r.first.join('/')!=='内容/処置/原因/再発防止')bad.push('長い欄の見出しが違う '+r.first.join('/'));
 let n=await pages();if(n>2)bad.push('A4 '+n+' 枚になる（長い欄が丸ごと次の頁に送られている）');
 // 1 行だけの欄・空の欄は 1 つの tr のまま（見た目を変えない）
 await mk(1,1,0);
 const r2=await p.evaluate(()=>({lt:document.querySelectorAll('#app tr.lt').length,pb:[...document.querySelectorAll('#app tr.prbrk>th')].map(t=>t.textContent).join('/')}));
 if(r2.lt!==0||r2.pb!=='内容/処置/原因/再発防止')bad.push('1 行の欄の形が違う '+JSON.stringify(r2));
 n=await pages();if(n!==1)bad.push('短い報告書が '+n+' 枚');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
