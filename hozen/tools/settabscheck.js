// 設定の上のタブ：390px で4つとも画面の中に収まり（先が切れない）、44px 以上・横にはみ出さない・押すと中身が替わる。設備カルテのタブも同じ。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const meas=()=>p.evaluate(()=>{const bs=[...document.querySelectorAll('#app .ptabs button')];return {n:bs.length,rs:bs.map(b=>b.getBoundingClientRect()),sw:document.documentElement.scrollWidth}});
 for(const t of ['data','basic','items','link']){await p.evaluate(t=>go('set',{setTab:t}),t);await p.waitForTimeout(250);const m=await meas();
  if(m.n!==4)bad.push('設定タブの数 '+m.n);if(m.rs.some(r=>r.right>391||r.left<0))bad.push(t+'：タブが画面の外に出る');if(m.rs.some(r=>r.height<44))bad.push(t+'：タブが低い');if(m.sw>392)bad.push(t+'：横にはみ出す')}
 await p.evaluate(()=>{S.equipment=[{id:'e1',code:'E-1',name:'テスト盤',kind:'高圧盤',status:'稼働'}];go('equipDetail',{id:'e1'})});await p.waitForTimeout(300);
 const m=await meas();if(m.n&&m.rs.some(r=>r.right>391))bad.push('設備カルテのタブが画面の外に出る');
 await p.evaluate(()=>go('set'));await p.waitForTimeout(200);
 await p.click('#app .ptabs button:nth-child(4)');if(!await p.evaluate(()=>document.querySelector('.tabpane[data-pane=link]').style.display!=='none'))bad.push('タブを押しても替わらない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
