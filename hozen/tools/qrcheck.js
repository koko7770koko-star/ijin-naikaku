// QR画面の確認：カメラの許可を待っている間に閉じてもカメラが止まる・設備IDを打ってEnterで開く・390pxではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.addInitScript(()=>{window.__stopped=0;window.BarcodeDetector=function(){this.detect=async()=>[]};
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:()=>new Promise(r=>setTimeout(()=>r({getTracks:()=>[{stop(){window.__stopped++}}]}),500))},configurable:true});
  Object.defineProperty(window,'isSecureContext',{value:true})});
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.equipment=[{id:'eqx1',code:'E-001',name:'試験設備',locId:'',status:'稼働',run:{meters:[]}}];go('qr')});await p.waitForTimeout(300);
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 await p.evaluate(()=>{qrScan()});await p.waitForTimeout(100);await p.evaluate(()=>closeModal(true));await p.waitForTimeout(800);
 if(await p.evaluate(()=>window.__stopped)<1)bad.push('許可を待つ間に閉じるとカメラが止まらない');
 await p.evaluate(()=>{qrScan()});await p.waitForTimeout(100);await p.fill('#qr_id','E-001');await p.press('#qr_id','Enter');await p.waitForTimeout(500);
 if(await p.evaluate(()=>V.view+'/'+V.eq)!=='equipDetail/eqx1')bad.push('Enterで設備が開かない '+await p.evaluate(()=>V.view+'/'+V.eq));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
