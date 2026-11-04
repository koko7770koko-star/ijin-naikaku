// 入力の窓（モーダル）の中のボタン・札：文字「特大」「大」・360px と標準 390px で、漢字・かなの続きで割れない・はみ出さない（hz-btn-wordbreak-modal）。
// btnwordallcheck と同じ測り方を、openModal を使う窓を開いた #modal の中に当てる。割れてよい所は <wbr> で分けた所だけ。
// usage: node hozen/tools/btnwordmodalcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
const CALLS=['editItem()','editTask(null,TODAY)','editIssue()','editEquip()','editWork()','editStd()','editPlan()','editLoc(null,null)','dataCheck()','showGenerations()','editBudget()','editPart()','editMeas()','editLib()','editDwg()','editMtpl()','editTool()','editQual("職員1")','editQualList()','locAdd(null,"棟")','banAddWizard()','bldgWizard()','banPlanAsk()','banAllAsk()','showOpLog()','aiPickEq()','genPlan(2026)','finishDay()','suggestLocs()','needKey()','addMeter()','stockMove()','toolLoan()','toolCal()','editRepair()','signModal({})','aiDraft("t","p","u",()=>{})','editItem(S.items[0]&&S.items[0].id)','editTask(S.tasks[0]&&S.tasks[0].id)','editIssue(S.issues[0]&&S.issues[0].id)','editEquip(S.equipment[0].id)','editEquip(null,S.equipment[0].id)','delEquip(S.equipment[0].id)','rateHealth(S.equipment[0].id)','locEquip(S.locs[0]&&S.locs[0].id)','locMenu(S.locs[0]&&S.locs[0].id)','editLoc(S.locs[0]&&S.locs[0].id)','editRepair(S.equipment[0].id)','editWork(S.works&&S.works[0]&&S.works[0].id)','editPlan(S.plans&&S.plans[0]&&S.plans[0].id)'];
let opened=0;
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>{});p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;if(!(S.equipment||[]).length)S.equipment=[{id:'e1',name:'テスト設備',cat:'',loc:'',repairs:[]}];if(!S.locs||!S.locs.length)S.locs=[{id:'l1',type:'棟',name:'A棟',parent:''}];save();applyFScale()},fs);
 for(const call of CALLS){
  const r=await p.evaluate(async call=>{
   try{closeModal(true)}catch(e){}
   try{const x=eval(call);if(x&&x.then)await Promise.race([x,new Promise(r=>setTimeout(r,300))])}catch(e){return {skip:1}}
   const m=document.querySelector('#modal');if(!m||!m.innerHTML.trim()||!document.querySelector('#mask.on'))return {skip:1};
   const CJK=/[぀-ヺー-ヿ一-鿿]/;const out=[];
   [...m.querySelectorAll('.btn, button, label.btn')].filter(x=>x.offsetParent).forEach(x=>{
    const bx=x.getBoundingClientRect();if(bx.right>innerWidth+0.5)out.push('「'+x.textContent.trim().slice(0,30)+'」がはみ出す');const tw=document.createTreeWalker(x,NodeFilter.SHOW_TEXT);let t,prev=null,pt=null;
    while(t=tw.nextNode()){const s=t.textContent;prev=null;for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);if(!q)continue;const top=Math.round(q.top);
     if(pt!==null&&Math.abs(top-pt)>3&&CJK.test(prev)&&CJK.test(s[i]))out.push('「'+x.textContent.trim().slice(0,30)+'」が「'+prev+'/'+s[i]+'」で割れる');prev=s[i];pt=top}}});
   return {out:[...new Set(out)]}},call);
  if(r.skip)continue;opened++;
  for(const x of r.out)errs.push(w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+' '+call+'：'+x)}
 await c.close()}
 if(opened<60)errs.push('開けた窓が少なすぎる '+opened);
 console.log(errs.join('\n')||'NO ERRORS（開いた窓 '+opened+'）');await b.close();process.exit(errs.length?1:0)})();
