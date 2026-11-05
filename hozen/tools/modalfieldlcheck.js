// 入力の窓（不具合の登録・作業の登録・設備の登録・予定の追加）を文字「大」「特大」で開き（hz-l-review-6）、
// ① 2 列の欄（.grid2・.grid3）でラベルの長さが違って入力欄が上下にずれない ② select・input の中の文字が切れない（diagxlcheck の測り方） ③ 窓がはみ出さない、を見る。
// 標準・390px ははみ出さないことだけ見る。usage: node hozen/tools/modalfieldlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const CALLS=['editIssue()','editWork()','editEquip()','editTask(null,TODAY)'];
(async()=>{const b=await chromium.launch();const errs=[];let opened=0;
 for(const [w,fs] of [[390,'l'],[360,'xl'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 await p.evaluate(f=>{S.equipment=[...Array(4)].map((_,i)=>({id:'q'+i,code:'E-'+(100+i),name:'設備'+(i+1),kind:'分電盤',importance:'A',place:'',status:'稼働',photos:[],docs:[],repairs:[],health:[]}));S.settings.fscale=f;save();applyFScale()},fs);
 for(const call of CALLS){
  const r=await p.evaluate(async call=>{try{closeModal(true)}catch(e){}
   try{const x=eval(call);if(x&&x.then)await x}catch(e){return {err:String(e)}}
   for(let i=0;i<40&&!document.querySelector('#mask.on');i++)await new Promise(r=>setTimeout(r,25));await new Promise(r=>setTimeout(r,50));
   const m=document.querySelector('#modal');if(!m||!document.querySelector('#mask.on'))return {err:'窓が開かない'};const out=[];
   for(const g of m.querySelectorAll('.grid2,.grid3')){if(!g.getClientRects().length)continue;const cells=[...g.children].filter(x=>x.getClientRects().length);
    const rows={};for(const cell of cells){const f=cell.querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea');if(!f)continue;const cr=cell.getBoundingClientRect();const k=Math.round(cr.top);(rows[k]=rows[k]||[]).push([f,cell])}
    for(const k in rows){const tops=rows[k].map(([f])=>Math.round(f.getBoundingClientRect().top));if(tops.length>1&&Math.max(...tops)-Math.min(...tops)>3)out.push('2列の欄が上下にずれる：'+rows[k].map(([f,cell])=>(cell.querySelector('label,.f,.muted')||{}).textContent||'?').map(t=>t.trim().slice(0,10)).join(' / '))}}
   for(const s of m.querySelectorAll('select')){if(!s.getClientRects().length||s.selectedIndex<0)continue;const cs=getComputedStyle(s),cv=document.createElement('canvas').getContext('2d');cv.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const t=s.options[s.selectedIndex].text,tw=cv.measureText(t).width,room=s.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-16;if(tw>room+1)out.push('選び欄「'+t+'」が切れる（'+Math.round(tw)+'>'+Math.round(room)+'）')}
   const mr=m.getBoundingClientRect();if(mr.right>innerWidth+1||m.scrollWidth>m.clientWidth+1)out.push('窓がはみ出す');
   return {out:[...new Set(out)]}},call);
  if(r.err){errs.push(tag+call+'：'+r.err);continue}opened++;
  for(const x of r.out)if(fs||/はみ出す/.test(x))errs.push(tag+call+'：'+x)}
 await c.close()}
 if(opened<12)errs.push('開けた窓が少ない '+opened);
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
