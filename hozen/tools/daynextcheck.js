// 日常点検の「次の未入力へ」の確認：項目を40件にして 390px で開き、残りの数が出る・押すと次の未入力欄に移る・
// 入れると残りが減る・保存の形が変わらない・横にはみ出さない・エラーなし
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const base=await p.evaluate(()=>{for(let i=0;i<20;i++)S.settings.dnums.push({id:'qn'+i,name:'測定'+i,short:'測'+i,unit:'V',min:'',max:'',req:false,chg:''});for(let i=0;i<20;i++)S.settings.dchecks.push({id:'qc'+i,name:'確認'+i,req:false});V.day=TODAY;go('day');return numDefs().length+chkDefs().length});
 await p.waitForTimeout(500);
 const t0=await p.evaluate(()=>{const b=document.getElementById('dayNextBtn');return b?b.textContent:''});
 const m=t0.match(/残り (\d+)/);if(!m||+m[1]!==base)bad.push('残りの数が合わない '+t0+' / '+base);
 await p.click('#dayNextBtn');await p.waitForTimeout(500);
 const f=await p.evaluate(()=>document.activeElement&&document.activeElement.id);if(!/^n_/.test(f||''))bad.push('最初の未入力欄に移らない '+f);
 await p.keyboard.type('5');await p.evaluate(()=>document.activeElement.dispatchEvent(new Event('change',{bubbles:true})));await p.waitForTimeout(400);
 const t1=await p.evaluate(()=>{const b=document.getElementById('dayNextBtn');return b?b.textContent:''});if(!t1.includes('残り '+(base-1)))bad.push('入れても残りが減らない '+t1);
 const sv=await p.evaluate(id=>S.daily[TODAY][id.slice(2)],f);if(String(sv)!=='5')bad.push('保存されない '+sv);
 // 高さ 500px（キーボードが出たつもり）：次の欄が見える範囲の上寄りに来る・○×の項目では ○ に焦点が合う
 await p.setViewportSize({width:390,height:500});await p.evaluate(()=>window.scrollTo(0,0));
 for(let i=0;i<24;i++){const k=await p.evaluate(()=>dayRestList(V.day)[0]);if(!k)break;await p.click('#dayNextBtn');await p.waitForTimeout(1200);
  const r=await p.evaluate(k=>{const e=k[0]==='n'?document.getElementById(k):document.querySelector('[data-ck="'+k.slice(2)+'"]');const t=e.getBoundingClientRect(),a=document.activeElement;return {k,top:Math.round(t.top),bot:Math.round(t.bottom),vh:innerHeight,focus:k[0]==='n'?a===e:!!(a&&a.closest&&a.closest('[data-ck]'))}},k);
  if(r.top<0||r.bot>r.vh*0.7||!r.focus){const ai=await p.evaluate(()=>[document.activeElement.id,pageYOffset,innerHeight,dayRestList(V.day).slice(0,3).join()]);bad.push(JSON.stringify(ai)+'次の欄が見える範囲の上寄りに来ない／焦点が合わない '+JSON.stringify(r));break}
  if(k[0]==='n'){await p.keyboard.type('5');await p.evaluate(()=>document.activeElement.dispatchEvent(new Event('change',{bubbles:true})))}else{await p.evaluate(k=>setCheck(k.slice(2),'○'),k)}await p.waitForTimeout(300)}
 await p.setViewportSize({width:390,height:844});
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
