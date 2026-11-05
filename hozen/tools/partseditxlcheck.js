// 予備品の編集窓・入庫/出庫の窓：文字「大」「特大」・360px・設備5台に結んだ予備品で、窓が横にはみ出さない・ボタンが44px以上（hz-l-parts-edit）
// usage: node hozen/tools/partseditxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();S.equipment=[...Array(5)].map((_,i)=>({id:'e'+i,name:'高圧受電盤 第'+(i+1)+'号機・非常用発電機',kind:'受変電',imp:'B'}));
  S.parts=[...Array(8)].map((_,i)=>({id:'pm'+i,code:'ABCDEFGHIJ-0123456789-KLMN',name:'端子台 M6 3極（長い品名のテスト）',spec:'定格 6.6kV 200A',maker:'○○電機',place:'予備品庫 第3棚',unit:['個','本','m'][i%3],qty:5,min:2,price:1200,equipIds:['e0','e1','e2','e3','e4'],note:''}));save();go('stock')},fs);await p.waitForTimeout(300);
 for(const [nm,js] of [['edit',"editPart('pm0')"],['move',"editPart('pm0');stockMove('pm0','入庫')"],['out',"editPart('pm0');stockMove('pm0','出庫')"]]){
  await p.evaluate(js);await p.waitForTimeout(300);
  
  const r=await p.evaluate(()=>{const m=document.querySelector('#modal'),W=document.documentElement.clientWidth,o=[];
   if(m.scrollWidth>m.clientWidth+1)o.push('modal横スクロール '+m.scrollWidth+'>'+m.clientWidth);
   for(const e of m.querySelectorAll('button,input,select,label')){const q=e.getBoundingClientRect();if(!q.width)continue;if(q.right>W+1||q.left<-1)o.push('はみ出す '+e.tagName+' '+(e.id||e.textContent.trim().slice(0,10)));if(e.tagName==='BUTTON'&&q.height<44)o.push('btn<44 '+e.textContent.trim().slice(0,8)+' '+Math.round(q.height))}
   return o});for(const x of r)errs.push(w+'px・'+fs+'・'+nm+'：'+x);
  await p.evaluate("closeModal(true)");}
 await c.close()}console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
