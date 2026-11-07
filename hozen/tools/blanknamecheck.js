// 編集の窓で新しく足すとき、名前・件名などの文の欄が空白だけ（半角・全角の空白・改行）なら保存されず、件数が増えないか（hz-v-blank-names）。
// 設備・異常・作業・予備品・工具・予定・点検項目・作業標準・場所・図面・資料。保存の形は変えない。外への通信は止める。usage: node hozen/tools/blanknamecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const K=[['editEquip(null)','equipment','saveEquip'],['editIssue(null)','issues','saveIssue'],['editWork(null)','works','saveWork'],['editPart(null)','parts','savePart'],['editTool(null)','tools','saveTool'],
 ['editTask(null)','tasks','saveTask'],['editItem(null)','items','saveItem'],['editStd(null)','stds','saveStd'],['editDwg(null)','drawings','saveDwg'],['editLib(null)','library','saveLib']];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 await p.evaluate(()=>{S.equipment=[{id:'e1',code:'E1',name:'変圧器1',kind:'変圧器',status:'稼働'}];const v=validateData(clone(S));if(v.ok)S.equipment=migrate(v.data,true).equipment;go('home')});
 for(const [open,key,fn] of K){
  const r=await p.evaluate(async([open,key,fn])=>{const n0=(S[key]||[]).length;eval(open);await new Promise(r=>setTimeout(r,50));const md=document.querySelector('#modal');if(!md)return {err:'窓が出ない'};
   md.querySelectorAll('input:not([type]),input[type=text],input[type=search],textarea').forEach(i=>{if(!i.readOnly&&!i.disabled&&i.type!=='hidden'&&!i.list)i.value=i.tagName==='TEXTAREA'?' 　\n ':'　 '});
   md.querySelectorAll('input[type=number]').forEach(i=>{if(!i.value)i.value='1'});md.querySelectorAll('input[type=date]').forEach(i=>{if(!i.value)i.value=TODAY});
   const bt=[...md.querySelectorAll('button')].find(x=>(x.getAttribute('onclick')||'').includes(fn+'('));if(!bt)return {err:'保存ボタンが無い'};
   bt.scrollIntoView({block:'center'});const rc=bt.getBoundingClientRect();window.__n0=n0;return {x:rc.x+rc.width/2,y:rc.y+rc.height/2}},[open,key,fn]);
  if(!r.err){await p.mouse.click(r.x,r.y);await p.waitForTimeout(300);
   Object.assign(r,await p.evaluate(key=>{const o={n0:window.__n0,n1:(S[key]||[]).length};try{closeModal(true)}catch(e){}return o},key))}
  if(r.err)bad.push(open+'：'+r.err);else if(r.n1!==r.n0)bad.push(open+'：空白だけの名前で保存できてしまう（'+(r.n1-r.n0)+' 件増える）');console.log(open,JSON.stringify(r))}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
