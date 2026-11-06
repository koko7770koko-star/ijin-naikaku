// 故障分析：同じ日に故障2件・復旧時間0・マイナス・文字でも、MTBF/MTTR が NaN・Infinity・マイナスにならない（hz-v-fail-mtbf-edge）
// usage: node hozen/tools/failedgecheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:780}});const p=await ctx.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof MIRROR_READY!=='undefined'&&MIRROR_READY,null,{timeout:15000});
 const r=await p.evaluate(()=>{const o=[];const base=S.issues.find(i=>true);
  const mk=(id,date,downH)=>Object.assign({},base||{},{id,title:'故障'+id,date,downH,failure:true,icat:'故障',equipId:'eqX',status:'未対応'});
  const sets=[[['a','2026-06-01',0],['b','2026-06-01',0]],[['a','2026-06-01',2],['b','2026-06-01',3]],[['a','2026-06-01',-3],['b','2026-06-02',-1]],[['a','2026-06-01','abc'],['b','2026-06-02',5]],[['a','2026-06-01',1e9],['b','2026-06-02',2]]];
  sets.forEach((set,k)=>{
   S.equipment=(S.equipment||[]).filter(e=>e.id!=='eqX');S.equipment.push({id:'eqX',code:'X1',name:'テスト設備',status:'稼働',installed:'2020-01',run:{mode:'cont'}});
   S.issues=set.map(x=>mk(...x));
   let F;try{F=failStats('eqX')}catch(e){o.push(`#${k} 例外 ${e.message}`);return}
   [['mtbf',F.mtbf],['mttr',F.mttr],['runH',F.runH]].forEach(([n,v])=>{if(v!=null&&(!Number.isFinite(v)||v<0))o.push(`#${k} ${n}=${v}`)});
   if(/NaN|Infinity|undefined/.test(F.mtbfText+F.mttrText+F.basis))o.push(`#${k} 文字に NaN 等：${F.mtbfText} / ${F.mttrText}`);
   try{go('diag',{dgTab:'fail'});if(/NaN|Infinity|undefined/.test(document.body.innerText))o.push(`#${k} 故障分析の画面に NaN 等`)}catch(e){o.push(`#${k} 画面 ${e.message}`)}
   try{go('equipDetail',{eq:'eqX'});if(/NaN|Infinity|undefined/.test(document.body.innerText))o.push(`#${k} 設備カルテに NaN 等`)}catch(e){o.push(`#${k} カルテ ${e.message}`)}
  });return o});
 r.forEach(x=>bad.push(x));
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
