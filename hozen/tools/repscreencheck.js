// 月報・日報の画面の見本：390px で上の表の日付が折れない・承認欄が縦に並んではみ出さない・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 for(const [name,fn] of [['月報',()=>go('report')],['日報',()=>go('dailyRep',{day:TODAY})]]){
  await p.evaluate(fn);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const h=document.querySelector('#app .rep .head');if(!h)return null;
   const tds=[...h.querySelectorAll('td')].filter(t=>/\d{4}/.test(t.textContent));
   const st=h.querySelector('.stamp').getBoundingClientRect(),pr=h.firstElementChild.getBoundingClientRect();
   return {oneLine:tds.every(t=>t.getBoundingClientRect().height<30),stackBelow:st.top>=pr.bottom-1,inW:st.right<=392,sw:document.documentElement.scrollWidth}});
  if(!r)bad.push(name+'：上の表が出ない');else{if(!r.oneLine)bad.push(name+'：日付が折れる');if(!r.stackBelow)bad.push(name+'：承認欄が下に来ない');if(!r.inW||r.sw>392)bad.push(name+'：横にはみ出す')}
  if(name==='月報'){const w=await p.evaluate(()=>{const ts=[...document.querySelectorAll('#app .rep .sec')].find(x=>/実施概要/.test(x.textContent));const out=[];let t=ts.nextElementSibling;for(let i=0;i<2&&t&&t.tagName==='TABLE';i++,t=t.nextElementSibling)out.push([...t.querySelectorAll('th')].every(h=>h.getBoundingClientRect().height<30));return out});
  if(w.length<2||w.some(x=>!x))bad.push('月報：実施概要の表の見出し・左の列が折れる')}
 if(process.argv[2])await p.screenshot({path:process.argv[2]+'-'+name+'.png'})}
 await p.evaluate(()=>{const y=now.getFullYear();for(let m=1;m<=12;m++)for(const d of [3,12]){const k=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');S.daily[k]=Object.assign({c:{},done:true},S.daily[k]||{})}go('report');V.rmode='y';render()});await p.waitForTimeout(400);
 const an=await p.evaluate(()=>{const w=document.querySelector('#app .scrx');if(!w)return null;const t=w.querySelector('table');const rows=[...t.rows].slice(1);return {sw:document.documentElement.scrollWidth,scroll:getComputedStyle(w).overflowX==='auto',oneLine:rows.every(r=>r.getBoundingClientRect().height<40),rows:rows.length}});
 if(!an)bad.push('年報：月別の表が無い');else{if(an.sw>392)bad.push('年報：横にはみ出す '+an.sw);if(!an.scroll)bad.push('年報：表だけ横スクロールにならない');if(!an.oneLine)bad.push('年報：月別の表の行が折れる');if(an.rows<13)bad.push('年報：12か月と計が出ない')}
 if(process.argv[2])await p.screenshot({path:process.argv[2]+'-年報.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
