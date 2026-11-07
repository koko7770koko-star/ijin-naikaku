// 日常点検の入力：設備 2000 台・異常 5000 件・測定 2 万件があっても、数値の欄に入れて画面の一部を作り直す（refreshDay：判定・下のお知らせの数）のが
// 0.3 秒以内で、入れた値が保存され、下のお知らせの数が render したときと同じか（hz-v-navbadge-outside）。保存の形は変えない。
// usage: node hozen/tools/dayinputmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY;S.mtpl=(S.mtpl||[]).concat([0,1,2].map(k=>({id:'t'+k,name:'測定'+k,type:'絶縁抵抗',cycleM:6+k*6,rows:[]})));
  S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',installed:'2005-04',life:20,photos:[],repairs:[],docs:[],health:[]}));
  S.issues=[...Array(5000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%900)),equipId:'e'+(i%2000),title:'異常'+i,status:i%4?'完了':'対応中',urgency:'中',due:addD(T,(i%40)-20),failure:i%2===0,downH:'1',closed:'',cost:''}));
  S.meas=[...Array(20000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%700)),equipId:'e'+(i%2000),tplId:'t'+(i%3),type:'絶縁抵抗',name:'測定',rows:[{name:'R',v:String(i%50),min:'5',max:'',unit:'MΩ'}]}));save();go('day',{day:TODAY})});
 await p.waitForTimeout(400);
 const id=await p.evaluate(()=>{const n=numDefs()[0];return n?n.id:null});if(!id){console.log('数値の項目が無いため省略');await b.close();process.exit(0)}
 const ms=[];for(const v of ['101','102','103']){ms.push(await p.evaluate(([id,v])=>{const e=document.getElementById('n_'+id);e.value=v;const t=performance.now();e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));refreshDay();return performance.now()-t},[id,v]))}
 const mx=Math.round(Math.max(...ms));if(mx>300)bad.push('入れてから作り直すまで '+mx+'ms');
 await p.waitForTimeout(500);
 const nb=await p.evaluate(()=>document.querySelector('nav button[data-v=home] b').dataset.n);
 await p.evaluate(()=>render());const nb2=await p.evaluate(()=>document.querySelector('nav button[data-v=home] b').dataset.n);if(nb!==nb2)bad.push('お知らせの数が違う '+nb+'/'+nb2);
 const sv=await p.evaluate(id=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return o.daily[TODAY]&&o.daily[TODAY][id]},id);if(String(sv)!=='103')bad.push('入れた値が保存されない '+sv);
 console.log('作り直し '+ms.map(Math.round).join('/')+'ms・お知らせ '+nb);console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
