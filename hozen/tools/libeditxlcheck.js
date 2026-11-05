// 技術資料の編集窓（editLib）：文字「大」「特大」・360px・長い題・設備5台に結んだ資料・PDF付きで、窓が横にはみ出さない・ボタンが44px以上・設備の名前が割れない（hz-l-lib-edit）
// usage: node hozen/tools/libeditxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();S.equipment=[...Array(5)].map((_,i)=>({id:'e'+i,name:'高圧受電盤 第'+(i+1)+'号機・非常用発電機',kind:'受変電',imp:'B'}));
  S.library=[...Array(6)].map((_,k)=>({id:'lb'+k,title:'高圧受電設備 取扱説明書（長い題のテスト・第'+(k+1)+'版）',tags:'VCB 取扱説明書',text:'本文',file:k?'':'f1',type:'application/pdf',equipIds:['e0','e1','e2','e3','e4']}));save();go('lib')},fs);await p.waitForTimeout(300);
 for(const [nm,js] of [['edit',"editLib('lb0')"],['new',"editLib()"]]){
  await p.evaluate(js);await p.waitForTimeout(300);
  
  const r=await p.evaluate(()=>{const m=document.querySelector('#modal'),W=document.documentElement.clientWidth,o=[];
   if(m.scrollWidth>m.clientWidth+1)o.push('modal横スクロール '+m.scrollWidth+'>'+m.clientWidth);
   for(const e of m.querySelectorAll('button,input,select,label')){const q=e.getBoundingClientRect();if(!q.width)continue;if(q.right>W+1||q.left<-1)o.push('はみ出す '+e.tagName+' '+(e.id||e.textContent.trim().slice(0,10)));if(e.tagName==='BUTTON'&&q.height<44)o.push('btn<44 '+e.textContent.trim().slice(0,8)+' '+Math.round(q.height))}
   return o});for(const x of r)errs.push(w+'px・'+fs+'・'+nm+'：'+x);
  await p.evaluate("closeModal(true)");}
 await c.close()}console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
