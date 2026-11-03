// 非常用発電機の数値点検表（月報の「6の4」）の確認：3台・各月の記録に管理値外を含めて、月報に台ごとの表が出る・管理値外に ▲ が付く（色だけに頼らない）・
// 390pxで横にはみ出さない・A4のPDFにできる・発電機の画面の「今月の点検表を印刷」から月報の今月が開く・記録は変わらない、ことを確かめる。
// usage: node hozen/tools/genprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const before=await p.evaluate(()=>{S.locs=[{id:'b1',name:'A棟',type:'建屋',parent:''},{id:'f1',name:'1F',type:'階',parent:'b1'}];
  S.equipment=[1,2,3].map(i=>({id:'g'+i,code:'G-'+i,name:'非常用発電機'+i,kind:'発電機',status:'稼働',locId:'f1',run:{meters:[]}}));
  const ym=TODAY.slice(0,7);S.meas=[];
  [1,2].forEach(i=>[3,10,17,24].forEach((d,k)=>S.meas.push({id:'m'+i+k,equipId:'g'+i,tplId:'mt_gen',date:ym+'-'+String(d).padStart(2,'0'),type:'電圧・電流・電力',name:'月次点検',rows:[{name:'電圧',v:k===2&&i===1?230:200,unit:'V',min:190,max:210},{name:'周波数',v:50,unit:'Hz',min:49,max:51},{name:'燃料残量',v:80,unit:'%',min:50,max:100},{name:'始動用蓄電池電圧',v:24,unit:'V',min:22,max:28},{name:'運転時間計',v:1000+d,unit:'h',min:'',max:''}]})));
  return JSON.stringify(S.meas)});
 await p.evaluate(()=>{go('diag',{dgTab:'meas'})});await p.waitForTimeout(400);
 const btn=await p.evaluate(()=>{const e=[...document.querySelectorAll('#genCard button')].find(x=>/今月の点検表を印刷/.test(x.textContent));if(!e)return 0;const r=e.getBoundingClientRect();e.click();return r.height});
 await p.waitForTimeout(400);
 if(!btn)bad.push('発電機の画面に印刷の入口が無い');else if(btn<44)bad.push('印刷の入口が44px未満: '+btn);
 const t=await p.evaluate(()=>({tabs:document.querySelectorAll('table.gent').length,ng:(document.querySelector('#app').innerText.match(/▲/g)||[]).length,head:/6の4\. 非常用発電機/.test(document.querySelector('#app').innerText),view:V.view,w:document.documentElement.scrollWidth}));
 if(t.view!=='report')bad.push('月報が開かない: '+t.view);if(t.tabs!==3)bad.push('台ごとの表が '+t.tabs+'（3のはず）');if(!t.head)bad.push('見出しが無い');
 if(t.ng<2)bad.push('管理値外の ▲ が出ない: '+t.ng);if(t.w>392)bad.push('横にはみ出す '+t.w);
 await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<5000)bad.push('PDFが作れない');
 if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 const after=await p.evaluate(()=>JSON.stringify(S.meas));if(after!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
