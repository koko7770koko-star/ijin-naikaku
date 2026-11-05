// 入力の窓（editItem・editTask・editIssue・editEquip・editRepair・editWork・editPart・editTool・editLib・editDwg・editMtpl・editPlan・editQual・editStd・editLoc・editBudget）を
// 文字「特大」「大」・360px で開き、窓が横にはみ出さない・ボタン・選びが 44px 以上・ボタンの文字が切れない・入力欄が窓の外に出ない（hz-l-allviews）
// usage: node hozen/tools/modalsxlcheck.js   （外部への通信は止める。名前は「設備1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
for(const fs of ['xl','l']){const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();S.equipment=[{id:'E1',code:'E-1',name:'設備1',kind:'変圧器',locId:'',importance:'A',status:'稼働',photos:[],docs:[],repairs:[],health:[]}]},fs);
 for(const fn of ['editItem()','editTask()','editIssue()','editEquip()','editRepair("E1")','editWork()','editPart()','editTool()','editLib()','editDwg()','editMtpl()','editPlan()','editQual()','editStd()','editLoc()','editBudget()']){
  await p.evaluate(fn=>{try{closeModal(true)}catch(e){}try{eval(fn)}catch(e){}},fn);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const m=document.querySelector('#modal');if(!document.querySelector('#mask.on'))return ['窓が出ない'];const o=[];const mb=m.getBoundingClientRect();
   if(m.scrollWidth>m.clientWidth+1)o.push('窓が横にはみ出す '+m.scrollWidth+'>'+m.clientWidth);
   m.querySelectorAll('button,select,input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]),textarea').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(!q.height)return;const lb=(e.textContent||e.id||'').trim().slice(0,12);
    if(q.right>mb.right+1||q.left<mb.left-1)o.push('窓の外へ 「'+lb+'」 '+e.id);
    if((e.tagName==='BUTTON'||e.tagName==='SELECT')&&q.height<43.5)o.push('44px 未満 '+Math.round(q.height)+' 「'+lb+'」');
    if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+1)o.push('文字が切れる 「'+lb+'」')});return [...new Set(o)]});
  r.forEach(x=>errs.push('360px・'+({xl:'特大',l:'大'})[fs]+'・'+fn+'・'+x))}
 await c.close()}
console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
