// 設備カルテ：その設備に結んだ技術資料が並び、押すと資料（editLib）が開く・ほかの設備の資料は出ない・0 件なら欄を出さない・記録は変えない
// usage: node hozen/tools/eqlibcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>{S.equipment.push({id:'eqL1',name:'変圧器 1号',kind:'変圧器',status:'稼働',locId:'',place:''},{id:'eqL2',name:'変圧器 2号',kind:'変圧器',status:'稼働',locId:'',place:''});
  S.library=S.library||[];S.library.push({id:'lb1',title:'変圧器 取扱説明書',tags:'取説',text:'',file:'',type:'',equipIds:['eqL1']},{id:'lb2',title:'絶縁油の試験の手順',tags:'',text:'',file:'',type:'',equipIds:['eqL1','eqL2']},{id:'lb3',title:'2号だけの資料',tags:'',text:'',file:'',type:'',equipIds:['eqL2']});
  save();go('equipDetail',{eq:'eqL1'});return JSON.stringify(S.library)});
 await p.waitForTimeout(400);
 let t=await p.evaluate(()=>{const c=document.querySelector('#eqLib');return c?c.innerText:''});
 if(!/取扱説明書/.test(t)||!/絶縁油/.test(t))errs.push('結んだ資料が出ない: '+t);if(/2号だけ/.test(t))errs.push('ほかの設備の資料が出る');if(!/2件/.test(t))errs.push('件数が出ない');
 await p.evaluate(()=>[...document.querySelectorAll('#eqLib .item')].find(x=>/取扱説明書/.test(x.innerText)).click());await p.waitForTimeout(300);
 if(await p.evaluate(()=>{const v=document.querySelector('#lb_title');return v?v.value:''})!=='変圧器 取扱説明書')errs.push('押しても資料が開かない');
 await p.evaluate(()=>closeModal(true));
 const h=await p.evaluate(()=>{const r=document.querySelector('#eqLib .item').getBoundingClientRect();return r.height});if(h<44)errs.push('押す所が小さい '+h);
 await p.evaluate(()=>{S.equipment.push({id:'eqL3',name:'遮断器',kind:'遮断器',status:'稼働',locId:'',place:''});go('equipDetail',{eq:'eqL3'})});await p.waitForTimeout(300);
 if(await p.evaluate(()=>!!document.querySelector('#eqLib')))errs.push('0 件なのに欄が出る');
 if(await p.evaluate(()=>JSON.stringify(S.library))!==before)errs.push('表示しただけで資料が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))errs.push('横にはみ出す');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
