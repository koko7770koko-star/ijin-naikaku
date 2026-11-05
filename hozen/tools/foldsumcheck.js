// 文字「標準」「大」「特大」：たたむ見出し（details.fold の summary：ホームの「この先7日間」「異常案件 対応中」など）が 44px 以上で押しやすいことを確かめる（hz-l-home-alerts）。
// usage: node hozen/tools/foldsumcheck.js   （外部への通信は止める。名前は「設備1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['',390],['l',390],['l',360],['xl',360]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{const T=TODAY;S.issues=[...Array(3)].map((_,i)=>({id:'qi'+i,date:addD(T,-3),title:'不具合'+(i+1),place:'',detail:'',status:'発見',urgency:'中',due:addD(T,5),action:'',photos:[],log:[]}));
   S.settings.fscale=fs;save();applyFScale();go('home');
   return [...document.querySelectorAll('#app details.fold>summary')].map(s=>({t:s.innerText.replace(/\n/g,' ').slice(0,20),h:Math.round(s.getBoundingClientRect().height)})).filter(x=>x.h>0)},fs);
  if(!r.length)errs.push((fs||'標準')+W+' たたむ見出しが無い');
  r.filter(x=>x.h<44).forEach(x=>errs.push((fs||'標準')+W+' 44px未満 「'+x.t+'」 '+x.h));
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
