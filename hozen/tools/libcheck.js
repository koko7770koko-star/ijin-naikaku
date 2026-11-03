// 技術資料・作業標準の確認：大文字小文字を区別せず探せる・件数とクリアが出る・作業標準の絞り込み・390pxではみ出さない・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.library=[{id:'l1',title:'取扱説明書',tags:'VCB',text:'開閉回数の目安は vcb の仕様による',file:'',type:'',equipIds:[]},{id:'l2',title:'保安規程',tags:'',text:'',file:'',type:'',equipIds:[]}];
  S.stds=['A','B','C','D','E'].map((n,i)=>({id:'s'+i,name:'標準'+n,docNo:'No'+i,ver:'1',kinds:['停電作業'],pre:[],post:[],note:'',approvedBy:'',approvedRole:'',approvedDate:'',method:'',hist:[]}));
  V.libQ='VCB';go('lib')});await p.waitForTimeout(300);
 const t=await p.evaluate(()=>document.querySelector('#app').innerText);
 if(!/1件見つかりました/.test(t))bad.push('件数が出ない/大文字小文字で見つからない');if(!/クリア/.test(t))bad.push('クリアが無い');
 await p.evaluate(()=>{V.libQ='';render()});await p.waitForTimeout(200);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('資料がはみ出す');
 await p.evaluate(()=>{V.stdQ='標準C';go('stds')});await p.waitForTimeout(300);
 const n=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(n!==1)bad.push('作業標準の絞り込みが効かない '+n);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('作業標準がはみ出す');
 // 作業標準の編集：確認項目の文章が全部見える（切れない）・×が44px・改行を入れても1行の文字列で保存される
 await p.evaluate(()=>{S.stds[2].pre=[{text:'停電範囲・送電先への影響を全員で確認した上で、作業開始の合図を出した（長い文章の例）',req:true}];editStd('s2')});await p.waitForTimeout(300);
 const sd=await p.evaluate(()=>{const t=document.querySelector('#sd_pre textarea'),x=document.querySelector('#sd_pre [aria-label="この項目を外す"]');return{fit:t.scrollHeight<=t.clientHeight+2,xw:x.getBoundingClientRect().width,xh:x.getBoundingClientRect().height,sw:document.documentElement.scrollWidth}});
 if(!sd.fit)bad.push('確認項目の文章が切れる');if(sd.xw<44||sd.xh<44)bad.push('×が小さい');if(sd.sw>392)bad.push('編集画面がはみ出す');
 await p.evaluate(()=>{const t=document.querySelector('#sd_pre textarea');t.value='一行目\n二行目';t.dispatchEvent(new Event('change'))});
 if(await p.evaluate(()=>STD.pre[0].text)!=='一行目 二行目')bad.push('改行が空白にならない：'+await p.evaluate(()=>JSON.stringify(STD.pre[0].text)));
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
