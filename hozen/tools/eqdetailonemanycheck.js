// 設備カルテ：1 台に測定 2000 件・修理 500 件・異常 500 件が集まった設備（ほかに設備 2000 台・測定 2 万件）で、概要・履歴・点検と測定・作業と部品の
// 4 つのタブがそれぞれ 1 秒以内に出て、画面の行が多すぎず（各一覧が全件をいっぺんに並べない、または 1 秒以内）、390px ではみ出さないか（hz-v-eqdetail-meas-many）。
// 保存の形は変えない。usage: node hozen/tools/eqdetailonemanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY;S.mtpl=(S.mtpl||[]).concat([0,1,2].map(k=>({id:'t'+k,name:'測定'+k,type:'絶縁抵抗',cycleM:6,rows:[{name:'R',min:'5',max:'',unit:'MΩ'}]})));
  S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',installed:'2005-04',life:20,photos:[],docs:[],health:[],
   repairs:i===7?[...Array(500)].map((_,k)=>({id:'r'+k,date:addD(T,-k*3),kind:'修理',content:'修理'+k,vendor:'',cost:1000,photos:[]})):[]}));
  S.issues=[...Array(500)].map((_,i)=>({id:'i'+i,date:addD(T,-i*2),equipId:'e7',title:'異常'+i,status:i%3?'完了':'対応中',urgency:'中',failure:i%2===0,downH:'1',closed:addD(T,-i*2),cost:''}));
  S.meas=[...Array(20000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%1500)),equipId:i<2000?'e7':'e'+(i%2000),tplId:'t'+(i%3),type:'絶縁抵抗',name:'測定',rows:[{name:'R',v:String(5+(i%40)),min:'5',max:'',unit:'MΩ'}]}));save()});
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={},rows={};
 for(const t of ['ov','rec','insp','rel']){const s=Date.now();await p.evaluate(t=>go('equipDetail',{eq:'e7',eqTab:t}),t);await raf();tm[t]=Date.now()-s;
  rows[t]=await p.evaluate(()=>document.querySelectorAll('#app .item,#app tr').length);if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push(t+' がはみ出す')}
 for(const k in tm)if(tm[k]>1000)bad.push(k+' '+tm[k]+'ms');
 console.log(JSON.stringify(tm)+'・行 '+JSON.stringify(rows));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
