// 日常点検：数値・○×を入れた直後に見出しの横へ「✓ hh:mm 保存済み」が出る（保存できないときは出ない・別の日では出ない）／
// 前回値のヒント（タップで入れる）が枠つきで44px以上／390pxではみ出さない。保存の形は変えない。
// usage: node hozen/tools/daysavedcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const y=addD(TODAY,-1),n=numDefs()[0];S.daily[y]={[n.id]:10,c:{},done:new Date().toISOString()};save();go('day',{day:TODAY})});await p.waitForTimeout(300);
 const t0=await p.evaluate(()=>$('#daySaved').textContent);if(t0)bad.push('入れる前から表示 '+t0);
 const hint=await p.evaluate(()=>{const x=document.querySelector('.hint.tapprev');if(!x)return null;const r=x.getBoundingClientRect();return {h:r.height,r:r.right}});
 if(!hint)bad.push('前回値のヒントが無い');else if(hint.h<44||hint.r>390)bad.push('ヒントの大きさ '+JSON.stringify(hint));
 await p.evaluate(()=>{const n=numDefs()[0];const e=$('#n_'+n.id);e.value='12';e.dispatchEvent(new Event('change'))});await p.waitForTimeout(300);
 let t=await p.evaluate(()=>$('#daySaved').textContent);if(!/^✓ \d\d:\d\d 保存済み$/.test(t))bad.push('数値のあと '+t);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 if(await p.evaluate(()=>!!document.querySelector('#h_'+numDefs()[0].id+'.tapprev')))bad.push('入れた後も枠つきヒントが残る');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 const sv=await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).daily[TODAY][numDefs()[0].id]);if(sv!==12)bad.push('保存値 '+sv);
 // ○× でも出る（全体を描き直す経路）
 await p.evaluate(()=>{window._d=DAY_SAVED;DAY_SAVED={day:'',at:''};const c=chkDefs()[0];if(c)setCheck(c.id,'○')});await p.waitForTimeout(300);
 t=await p.evaluate(()=>chkDefs().length?$('#daySaved').textContent:'skip');if(t!=='skip'&&!t.includes('保存済み'))bad.push('○のあと '+t);
 // 別の日では出ない
 await p.evaluate(()=>{V.day=addD(TODAY,-2);render()});await p.waitForTimeout(200);
 t=await p.evaluate(()=>$('#daySaved').textContent);if(t)bad.push('別の日に出る '+t);
 // 保存失敗のとき出さない
 await p.evaluate(()=>{V.day=TODAY;render();SAVE_FAIL.app=true;DAY_SAVED={day:TODAY,at:'12:00'};render()});await p.waitForTimeout(200);
 t=await p.evaluate(()=>$('#daySaved').textContent);if(t)bad.push('保存失敗でも出る '+t);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
