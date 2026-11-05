// 測定の一覧（診断 › 測定記録）：文字「特大」「大」・360px で、15件（長い設備名・管理値外・値と単位）が横にはみ出さない・
// 絞り込みと「記録」が 44px 以上・値と単位の塊が途中で割れない（hz-l-meas-list）
// usage: node hozen/tools/measlistxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  const res=await p.evaluate(f=>{S.settings.fscale=f;
   S.equipment=[0,1,2].map(i=>({id:'E'+i,code:'E-'+i,name:['非常用発電機ABCDEFGHIJ-1234567890-XYZ','動力変圧器1','第2受電盤'][i],kind:'発電機',locId:'',importance:'A',status:'稼働',place:'',photos:[],docs:[],repairs:[],health:[]}));
   const T=['絶縁抵抗','接地抵抗','その他'];S.meas=[];
   for(let i=0;i<15;i++){const ng=i%7===0;S.meas.push({id:'M'+i,at:'',date:'2026-10-'+String(10+i).padStart(2,'0'),equipId:'E'+(i%3),tplId:'',type:T[i%3],name:i===1?'長い測定名ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789':T[i%3],
    rows:[{name:'R相-大地',unit:'MΩ',min:'1',max:'',v:ng?'0.4':'123.45',ck:false},{name:'S相-大地',unit:'MΩ',min:'1',max:'',v:'250',ck:false},{name:'接地',unit:'Ω',min:'',max:'100',v:'12.3',ck:false},{name:'発電機',unit:'h',min:'',max:'',v:'1234',ck:false}],cond:{},by:i%2?'職員1':'',note:'',photos:[]})}
   save();applyFScale();go('diag',{dgTab:'meas'});return 1},fs);
  await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const o=[];const sw=document.documentElement.scrollWidth;if(sw>innerWidth+1)o.push('page scrollWidth '+sw);
   document.querySelectorAll('#app select,#app .pill,#app .item,#app .meta,#app .ti,#app .nwl,#app button').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&(e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow!=='visible'||r.right>innerWidth+1))o.push(e.tagName+'.'+e.className+' '+Math.round(r.right)+' sw'+e.scrollWidth+'/'+e.clientWidth+' '+(e.textContent||'').slice(0,20))});
   document.querySelectorAll('#app select,#app button.btn,#app .linkbtn').forEach(e=>{const r=e.getBoundingClientRect();if(r.height&&r.height<43.5)o.push('small '+e.tagName+' '+Math.round(r.height)+' '+(e.textContent||'').slice(0,15))});
   document.querySelectorAll('#app .item .meta .nwl, #app .item .pill .nwl').forEach(e=>{if(e.getClientRects().length>1)o.push('split '+e.textContent)});
   return o});
  r.forEach(x=>errs.push('360px・'+({xl:'特大',l:'大'})[fs]+'・'+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
