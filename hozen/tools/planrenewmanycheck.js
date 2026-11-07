// 保全計画：設備 2000 台（耐用年数つき）・測定 2 万件（ひな形 3 つ）・更新計画 1000 件で、点検期限・更新計画・測定の周期の 3 つのタブがそれぞれ 1 秒以内、
// 更新計画の年度ごとの合計が手で数えた値と同じ、計画を「実施済み」にする操作が 1 秒以内、A4 の印刷で幅に収まるか（hz-v-plan-renew-many）。
// 測定の周期は render の中だけの表（dgMeas）で引く。usage: node hozen/tools/planrenewmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const exp=await p.evaluate(()=>{const T=TODAY,fy=fyNow();S.mtpl=(S.mtpl||[]).concat([0,1,2].map(k=>({id:'t'+k,name:'測定'+k,type:'絶縁抵抗',cycleM:6+k*6,rows:[{name:'R',min:'1',max:'',unit:'MΩ'}]})));
  S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',installed:'20'+String(5+(i%20)).padStart(2,'0')+'-04',life:15+(i%10),renewCost:100000+i,photos:[],repairs:[],docs:[]}));
  S.meas=[...Array(20000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%700)),equipId:'e'+(i%2000),tplId:'t'+(i%3),type:'絶縁抵抗',name:'測定',rows:[{name:'R',v:'5',min:'1',max:'',unit:'MΩ'}]}));
  S.plans=[...Array(1000)].map((_,i)=>({id:'pl'+i,year:fy+(i%12)-1,title:'計画'+i,kind:'更新',cost:10000*(i%7),status:['予定','予算化','実施済み','見送り'][i%4],equipId:'e'+(i%2000)}));save();
  // 手で数える：fy+3 年度の合計（設備の自動分＋計画）
  const y=fy+3,a=S.equipment.filter(e=>+e.installed.slice(0,4)+Number(e.life)===y).reduce((s,e)=>s+e.renewCost,0),pl=S.plans.filter(p=>p.year===y).reduce((s,p)=>s+p.cost,0);
  return {y,sum:a+pl,cnt:S.equipment.length*0+[...new Set(S.meas.map(m=>m.equipId+'|'+m.tplId))].length}});
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 for(const t of ['legal','renew','measdue']){const s=Date.now();await p.evaluate(t=>{V.plTab=t;go('plan')},t);await raf();tm[t]=Date.now()-s;if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push(t+' がはみ出す')}
 const md=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(md!==exp.cnt)bad.push('測定の周期の行 '+md+'（手で '+exp.cnt+'）');
 await p.evaluate(()=>{V.plTab='renew';go('plan')});await raf();
 const sum=await p.evaluate(y=>{const g=[...document.querySelectorAll('#app .grp')].find(x=>(x.querySelector('b')||{}).textContent===y+'年度');return g?(g.textContent.match(/計 ([\d,]+)円/)||[])[1]:null},exp.y);
 if(sum!==exp.sum.toLocaleString('ja-JP'))bad.push(exp.y+'年度の合計 '+sum+'（手で '+exp.sum.toLocaleString('ja-JP')+'）');
 let s=Date.now();await p.evaluate(()=>{const x=S.plans.find(p=>p.id==='pl0');x.status='実施済み';save();render()});await raf();tm.done=Date.now()-s;
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const pw=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,W:innerWidth}));if(pw.sw>pw.W+1)bad.push('A4 の幅からはみ出す '+pw.sw);
 await p.emulateMedia({media:'screen'});
 for(const k in tm)if(tm[k]>1000)bad.push(k+' '+tm[k]+'ms');
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
