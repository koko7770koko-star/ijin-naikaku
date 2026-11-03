// 資料・作業標準の確認：探す欄が説明より上にあり、見つからないときは「〇〇は見つかりませんでした。言葉を短く」の案内が出る。390pxで切れない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.library=[{id:'l1',title:'資料1',tags:'VCB',text:'開閉回数',equipIds:[],file:'',type:''}];S.stds=[1,2,3,4].map(i=>({id:'s'+i,name:'標準'+i,docNo:'',ver:'1',kinds:[],pre:[],post:[],note:'',hist:[]}));go('lib')});await p.waitForTimeout(300);
 let r=await p.evaluate(()=>{const q=document.querySelector('#lib_q').getBoundingClientRect().top,t=[...document.querySelectorAll('#app .muted')].find(e=>/取扱説明書・保安規程/.test(e.textContent));return{q,t:t?t.getBoundingClientRect().top:-1}});
 if(!(r.t>r.q))bad.push('探す欄が説明より上にない');
 await p.evaluate(()=>{V.libQ='ZZZ存在しない';render()});await p.waitForTimeout(200);
 let t=await p.evaluate(()=>({t:document.querySelector('#app').innerText,sw:document.documentElement.scrollWidth}));
 if(!/ZZZ存在しない」は見つかりませんでした。言葉を短く/.test(t.t))bad.push('資料：見つからない案内が違う');if(t.sw>392)bad.push('資料：はみ出す');
 await p.evaluate(()=>{V.libQ='';go('stds')});await p.waitForTimeout(300);
 if(!await p.evaluate(()=>!!document.querySelector('#std_q')))bad.push('作業標準：探す欄が無い');
 await p.evaluate(()=>{V.stdQ='ZZZ存在しない';render()});await p.waitForTimeout(200);
 t=await p.evaluate(()=>({t:document.querySelector('#app').innerText,sw:document.documentElement.scrollWidth}));
 if(!/ZZZ存在しない」の作業標準はありません。言葉を短く/.test(t.t))bad.push('作業標準：見つからない案内が違う');if(t.sw>392)bad.push('作業標準：はみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
