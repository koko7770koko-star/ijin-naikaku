// 非常用発電機の一覧（診断 › 測定記録の下の genCard）：文字「特大」「大」・360px で、発電機 6 台（棟 3 つ・同じ電気室に 2 台）の
// ①棟のボタンが 44px 以上 ②場所の見出し・行の場所が段（› の区切り）の途中で割れない ③横にはみ出さない（hz-l-gen-card）
// usage: node hozen/tools/gencardxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  await p.evaluate(f=>{S.settings.fscale=f;const L=[];['A棟','B棟','C棟'].forEach((b,i)=>{L.push({id:'B'+i,name:b,type:'建屋',parent:'',note:'',pos:{}},{id:'F'+i,name:'1階',type:'階',parent:'B'+i,note:'',pos:{}},{id:'R'+i,name:'第'+(i+1)+'電気室',type:'電気室',parent:'F'+i,note:'',pos:{}})});
   S.locs=L;S.equipment=[0,1,2,3,4,5].map(i=>({id:'G'+i,code:'G-'+i,name:'非常用発電機'+(i+1),kind:'発電機',locId:'R'+(i%3),importance:'A',status:'稼働',place:'',photos:[],docs:[],repairs:[],health:[]}));
   S.meas=[0,1,2].map(i=>({id:'M'+i,at:'',date:TODAY.slice(0,8)+'01',equipId:'G'+i,tplId:'mt_gen',type:'その他',name:'発電機',rows:[{name:'燃料',unit:'L',min:'',max:'',v:'1234',ck:false},{name:'運転時間',unit:'h',min:'',max:'',v:'56',ck:false}],cond:{},by:'',note:'',photos:[]}));
   save();applyFScale();go('diag',{dgTab:'meas'})},fs);
  await p.waitForSelector('#genCard');
  const r=await p.evaluate(()=>{const o=[];const g=document.querySelector('#genCard');
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('はみ出す');
   g.querySelectorAll('.row .btn').forEach(e=>{if(e.getBoundingClientRect().height<43.5)o.push('棟のボタンが 44px 未満 '+Math.round(e.getBoundingClientRect().height)+'px（'+e.textContent+'）')});
   g.querySelectorAll('.nwl').forEach(e=>{if(e.getClientRects().length>1&&e.getBoundingClientRect().height>e.parentElement.getBoundingClientRect().height)o.push('割れる '+e.textContent)});
   g.querySelectorAll('.grp>b').forEach(e=>{const w=e.querySelectorAll('.nwl');if(!w.length)o.push('見出しが段ごとに包まれていない '+e.textContent)});
   g.querySelectorAll('.item .meta').forEach(e=>{const w=e.querySelectorAll('.nwl');if(w.length<3)o.push('行の場所が段ごとに包まれていない '+e.textContent.slice(0,20))});
   return o});
  r.forEach(x=>errs.push('360px・'+({xl:'特大',l:'大'})[fs]+'・'+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
