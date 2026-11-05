// 文字「大」「特大」・360px：全画面のボタン・押せる物・札の中身がはみ出さない（ボタンの外に文字が出る・隣と重なる）ことを確かめる（hz-l-count-rows）。
// ホームの「済み n／全部 m」（fc7fb33）、カレンダーの「今日」の札（カナメ hz-l-count-rows）で見つかった形を全画面で探す。
// usage: node hozen/tools/btnoverflowxlcheck.js   （外部への通信は止める。名前は「設備1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const out=[];
 for(const [fsc,W] of [['xl',360],['l',360]]){
 const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const T=TODAY;S.equipment=S.equipment||[];for(let i=1;i<=12;i++)S.equipment.push({id:'eq'+i,code:'E-'+i,name:'設備'+i,kind:i<=3?'発電機':'変圧器',photos:[],docs:[],repairs:[]});
  for(let i=1;i<=6;i++)S.issues.push({id:'is'+i,date:addD(T,-i),title:'不具合'+i,status:'発見',photos:[],log:[],urgency:'緊急',due:addD(T,-1)});
  for(let i=1;i<=6;i++)S.tasks.push({id:'tk'+i,date:T,title:'月次点検'+i,status:'予定',kind:'月次',cat:'受変電',photos:[]});
  S.works=S.works||[];for(let i=1;i<=4;i++)S.works.push({id:'wk'+i,title:'作業'+i,date:T,status:'承認待ち',staff:['職員1'],outage:''});
  S.locs=S.locs||[];S.locs.push({id:'lb',name:'A棟',type:'棟'},{id:'lb2',name:'B棟',type:'棟'},{id:'lf',name:'1階',type:'階',parent:'lb'},{id:'lr',name:'第1電気室',type:'電気室',parent:'lf'},{id:'lf2',name:'2階',type:'階',parent:'lb2'},{id:'lr2',name:'第2電気室',type:'電気室',parent:'lf2'});for(let i=1;i<=14;i++)S.locs.push({id:'lp'+i,name:'動力盤-'+i,type:'盤',parent:i<8?'lr':'lr2'});
  S.parts=S.parts||[];for(let i=1;i<=6;i++)S.parts.push({id:'pt'+i,name:'予備品'+i,qty:i,min:3,unit:'個',equipIds:[]});
  S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(800);
 const views=await p.evaluate(()=>{try{closeModal(true)}catch(e){};return Object.keys(VIEWS)});
 for(const v of views){if(['equipDetail','dwg','printDoc','workSheet'].includes(v))continue;
  await p.evaluate(v=>{try{go(v)}catch(e){}},v);await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const o=[];document.querySelectorAll('#app button,#app [onclick],#app .tile,#app .pill').forEach(e=>{const bb=e.getBoundingClientRect();if(!bb.width)return;
    if(e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX!=='auto'&&getComputedStyle(e).overflowX!=='scroll')o.push('中身はみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,24).replace(/\n/g,'/')+'」 '+e.scrollWidth+'>'+e.clientWidth)});return o});
  r.forEach(x=>out.push(fsc+W+' '+v+' '+x));}
 await ctx.close()}
 console.log([...new Set(out)].slice(0,30).join('\n')||'NO ERRORS');await b.close();process.exit(out.length?1:0)})();
