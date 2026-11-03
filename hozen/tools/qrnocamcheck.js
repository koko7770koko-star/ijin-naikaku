// QR：カメラが使えない（許可なし・無い・使用中）とき、理由と代わりの手段（写真から読む・設備IDで探す）が出る。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const name of ['NotAllowedError','NotFoundError','NotReadableError']){
  const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.addInitScript(n=>{window.BarcodeDetector=function(){this.detect=async()=>[]};
   Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:()=>Promise.reject(Object.assign(new Error('x'),{name:n}))},configurable:true});
   Object.defineProperty(window,'isSecureContext',{value:true})},name);
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
  await p.evaluate(()=>{go('qr');qrScan()});await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({m:document.querySelector('#qr_msg').textContent,inp:!!document.querySelector('#qr_id'),w:document.documentElement.scrollWidth}));
  if(/準備しています/.test(r.m))bad.push(name+'：準備中のまま');
  if(!/写真から読む|設備ID/.test(r.m))bad.push(name+'：代わりの手段が書かれない: '+r.m);
  if(!r.inp)bad.push(name+'：設備ID欄が無い');if(r.w>392)bad.push(name+'：横にはみ出す');
  await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
