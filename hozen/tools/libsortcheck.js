// 技術資料の並べ替えの確認：5件で「新しい順／名前順」が出て、順が変わり、保存データ（S.library の並び）は変わらず、390pxではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const titles=()=>p.evaluate(()=>[...document.querySelectorAll('#app .item .ti')].map(e=>e.textContent.trim()));
 await p.evaluate(()=>{S.library=['う','あ','お','い','え'].map((t,i)=>({id:'l'+i,title:t,tags:'',text:'',file:'',type:'',equipIds:[]}));V.libSort=undefined;go('lib')});await p.waitForTimeout(300);
 if(!await p.evaluate(()=>!!document.querySelector('#lib_sort')))bad.push('並べ替えのボタンが出ない');
 if((await titles()).join('')!=='あいうえお')bad.push('初期が名前順でない');
 await p.evaluate(()=>{V.libSort='new';render()});await p.waitForTimeout(150);
 if((await titles()).join('')!=='えいおあう')bad.push('新しい順にならない：'+(await titles()).join(''));
 const h=await p.evaluate(()=>[...document.querySelectorAll('#lib_sort button')].map(e=>e.getBoundingClientRect().height));if(h.some(x=>x<44))bad.push('ボタンが44px未満');
 if(await p.evaluate(()=>S.library.map(d=>d.title).join('')!=='うあおいえ'||JSON.stringify(S).includes('libSort')))bad.push('保存データが変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('はみ出す');
 await p.evaluate(()=>{S.library=S.library.slice(0,3);render()});await p.waitForTimeout(150);
 if(await p.evaluate(()=>!!document.querySelector('#lib_sort')))bad.push('少ない件数でボタンが出る');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
