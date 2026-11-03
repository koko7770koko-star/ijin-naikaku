// 日報の確認：その日の測定（発電機など）と盤の点検の進みが出る・390pxではみ出さない・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.locs=[{id:'b1',name:'A棟',type:'建屋',parent:''},{id:'f1',name:'1F',type:'階',parent:'b1'},{id:'k1',name:'盤1',type:'盤',parent:'f1'}];
  S.equipment=[{id:'g1',code:'G-1',name:'非常用発電機',kind:'発電機',status:'稼働',locId:'f1',run:{meters:[]}}];
  S.banChk={[TODAY.slice(0,7)]:{k1:['済','○','']}};
  S.meas=[{id:'m1',equipId:'g1',tplId:'mt_gen',date:TODAY,type:'電圧・電流・電力',name:'月次点検',rows:[{name:'電圧',v:200,unit:'V',min:190,max:210}]}];
  go('dailyRep',{day:TODAY})});await p.waitForTimeout(400);
 const t=await p.evaluate(()=>document.querySelector('#app').innerText);
 if(!/電圧 200V/.test(t))bad.push('その日の測定が出ない');if(!/1\/3/.test(t))bad.push('盤の点検の進みが出ない');
 await p.evaluate(()=>{S.meas=[];render()});await p.waitForTimeout(200);
 if(!/測定記録はありません/.test(await p.evaluate(()=>document.querySelector('#app').innerText)))bad.push('測定が無い日の表示が出ない');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2],fullPage:true});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
