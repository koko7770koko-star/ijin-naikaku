// 月報・年報：設備 2000 台・修理 6000・異常 5000・測定 2 万件で、月報と年報がそれぞれ 1 秒以内に出て、A4 の印刷で幅に収まり、390px ではみ出さないか（hz-v-report-equip-many）。
// 保存の形は変えない。usage: node hozen/tools/reportequipmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 await p.evaluate(()=>{const T=TODAY;S.mtpl=(S.mtpl||[]).concat([0,1,2].map(k=>({id:'t'+k,name:'測定'+k,type:'絶縁抵抗',cycleM:6,rows:[]})));
  S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',installed:'2005-04',life:20,photos:[],docs:[],health:[],repairs:[0,1,2].map(k=>({id:'r'+i+k,date:addD(T,-((i*3+k)%700)),kind:'修理',content:'修理',vendor:'',cost:1000,photos:[]}))}));
  S.issues=[...Array(5000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%700)),equipId:'e'+(i%2000),title:'異常'+i,status:i%3?'完了':'対応中',urgency:'中',failure:i%2===0,downH:'1',closed:addD(T,-(i%700)),cost:''}));
  S.meas=[...Array(20000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%700)),equipId:'e'+(i%2000),tplId:'t'+(i%3),type:'絶縁抵抗',name:'測定',rows:[{name:'R',v:String(i%50),min:'5',max:'',unit:'MΩ'}]}));save()});
 const out=[];
 for(const k of ['m','y']){const s=Date.now();await p.evaluate(k=>{V.rmode=k;go('report')},k);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const ms=Date.now()-s,len=await p.evaluate(()=>document.querySelector('#app').innerText.length);console.log((k==='m'?'月報 ':'年報 ')+ms+'ms');if(ms>1000)bad.push(k+' '+ms+'ms');if(len<500)bad.push(k+' が空');
  if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push(k+' が 390px ではみ出す');
  await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
  const w=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,W:innerWidth}));if(w.sw>w.W+1)bad.push(k+' が A4 の幅からはみ出す '+w.sw);
  await p.emulateMedia({media:'screen'});await p.setViewportSize({width:390,height:844})}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
