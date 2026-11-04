// 診断（diag）の健全度・故障分析・推奨を印刷：操作の部品（ボタン・入力欄）が出ず、A4の幅に収まり、行・グラフ・表がページの境で割れない。記録は変わらない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{S.equipment=[...Array(30)].map((_,i)=>({id:'dg'+i,code:'E-'+(1000+i),name:i%7===0?'高圧受電盤 真空遮断器（VCB）および保護継電器一式（長い名前の例）':'分電盤'+i,kind:i%2?'分電盤':'受変電',importance:i%3?'B':'A',place:'',status:'稼働',photos:[],repairs:[],docs:[],health:i%2?[{date:addD(TODAY,-30),score:1+i%5}]:[]}));
  S.issues=[...Array(20)].map((_,i)=>({id:'di'+i,src:'manual:di'+i,date:addD(TODAY,-i*15),title:'不具合'+i,place:'',detail:'',status:'完了',urgency:'中',action:'',closed:addD(TODAY,-i*15+1),photos:[],equipId:'dg'+(i%30),failure:true,log:[]}));save();return JSON.stringify([S.equipment,S.issues])});
 const tabs=['health','rec','fail'];
 for(const t of tabs){
  await p.setViewportSize({width:390,height:844});await p.emulateMedia({media:'screen'});
  await p.evaluate(t=>go('diag',{dgTab:t}),t);await p.waitForTimeout(300);
  if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push(t+'：390pxではみ出す');
  await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
   const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
   const ctl=[...document.querySelectorAll('#app button,#app select,#app input,#app textarea,#app label.btn,#app .seg')].filter(vis).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'')).trim().slice(0,16));
   const cut=[...document.querySelectorAll('#app .item,#app tbody tr,#app .tbl tr,#app .bars,#app .al')].filter(vis).filter(e=>{const bi=getComputedStyle(e).breakInside;return bi!=='avoid'&&bi!=='avoid-page'}).slice(0,3).map(e=>e.tagName+'.'+e.className);
   return {sw:document.documentElement.scrollWidth,W,over,ctl,cut}});
  if(r.sw>r.W+1||r.over.length)bad.push(t+'：A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
  if(r.ctl.length)bad.push(t+'：印刷に操作の部品が残る '+r.ctl.join('|'));
  if(r.cut.length)bad.push(t+'：ページの境で割れる物 '+r.cut.join(','));
 }
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify([S.equipment,S.issues]))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
