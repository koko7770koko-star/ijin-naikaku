// 保全計画の編集窓（editPlan）：文字「大」「特大」・360px・長い件名・設備を結んだ状態で、窓が横にはみ出さない・ボタンが44px以上・入力欄が重ならない（hz-l-plan-edit）
// usage: node hozen/tools/planeditxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{if(f){S.settings.fscale=f;applyFScale()}S.equipment=[...Array(3)].map((_,i)=>({id:'e'+i,name:'高圧受電盤 第'+(i+1)+'号機・非常用発電機',kind:'受変電',imp:'B'}));
  S.plans=[{id:'pl1',title:'高圧受電設備の更新工事（長い件名のテスト・第1期・第2期まとめて）',equipId:'e0',year:2027,kind:'精密点検',cost:123456789,status:'予算化',note:'備考'}];save();go('year')},fs);await p.waitForTimeout(300);
 for(const [nm,js] of [['edit',"editPlan('pl1')"],['new',"editPlan()"]]){
  await p.evaluate(js);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const m=document.querySelector('#modal'),W=document.documentElement.clientWidth,o=[];
   if(m.scrollWidth>m.clientWidth+1)o.push('modal横スクロール '+m.scrollWidth+'>'+m.clientWidth);
   const box=[];
   for(const e of m.querySelectorAll('button,input,select,textarea')){const q=e.getBoundingClientRect();if(!q.width)continue;box.push([e,q]);if(q.right>W+1||q.left<-1)o.push('はみ出す '+e.tagName+' '+(e.id||e.textContent.trim().slice(0,10)));if(e.tagName==='BUTTON'&&q.height<44)o.push('btn<44 '+e.textContent.trim().slice(0,8)+' '+Math.round(q.height));if(e.tagName!=='BUTTON'&&q.width<90)o.push('欄が狭い '+e.id+' '+Math.round(q.width))}
   for(let i=0;i<box.length;i++)for(let j=i+1;j<box.length;j++){const a=box[i][1],c=box[j][1];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)o.push('重なる '+(box[i][0].id||box[i][0].textContent.trim().slice(0,6))+'/'+(box[j][0].id||box[j][0].textContent.trim().slice(0,6)))}
   return o});for(const x of r)errs.push(w+'px・'+fs+'・'+nm+'：'+x);
  await p.evaluate("closeModal(true)");}
 await c.close()}console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
