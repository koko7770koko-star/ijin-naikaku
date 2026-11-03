// QR からの流れの確認：カメラなしで設備IDを入れて設備カルテを開き、そこから「測定値を記録」（発電機は「月次点検の数字を入れる」）と「異常を記録」が 1 タップで開く
// （QRを読む→設備カルテ→記録 = 3タップ以内）。ボタンは44px以上・390pxで横にはみ出さず、設備が選ばれた状態で開くことを確かめる。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.locs=[{id:'b1',name:'A棟',type:'建屋',parent:'',note:'',pos:{}}];S.equipment=[{id:'e1',code:'E-001',name:'変圧器',kind:'変圧器',status:'稼働',locId:'b1',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]},{id:'g1',code:'G-1',name:'非常用発電機',kind:'発電機',status:'稼働',locId:'b1',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}];save();go('qr')});
 let taps=0;
 for(const [code,kind] of [['E-001','meas'],['G-1','gen']]){
  await p.evaluate(()=>{go('qr');qrScan()});await p.waitForTimeout(300);taps=1; // 1: QRを読む
  await p.fill('#qr_id',code);await p.press('#qr_id','Enter');await p.waitForTimeout(400);taps++; // 2: 読み取れた（設備カルテが開く）
  const on=await p.evaluate(()=>V.view==='equipDetail'&&V.eq);if(!on){bad.push(code+'：設備カルテが開かない');continue}
  const r=await p.evaluate(()=>{const e=document.getElementById('eqRecMeas');return e?{h:e.getBoundingClientRect().height,t:e.textContent,sw:document.documentElement.scrollWidth,top:e.getBoundingClientRect().top+scrollY}:null});
  if(!r){bad.push(code+'：記録のボタンが無い');continue}
  if(r.h<44)bad.push(code+'：ボタンが44px未満 '+r.h);if(r.sw>392)bad.push(code+'：はみ出す');if(r.top>700)bad.push(code+'：ボタンが画面の下すぎる '+r.top);
  await p.click('#eqRecMeas');await p.waitForTimeout(500);taps++; // 3: 記録を開く
  const m=await p.evaluate(()=>({modal:document.querySelector('#mask').classList.contains('on'),t:document.querySelector('#modal').innerText,eq:(document.querySelector('#ms_eq')||{}).value||''}));
  if(!m.modal)bad.push(code+'：記録の窓が開かない');
  else if(kind==='meas'&&m.eq!=='e1')bad.push(code+'：設備が選ばれていない（'+m.eq+'）');
  else if(kind==='gen'&&!/発電機|G-1/.test(m.t))bad.push(code+'：発電機の入力が開かない');
  if(taps>3)bad.push('手数が多い '+taps);
  await p.evaluate(()=>closeModal(true));
 }
 const bn=await p.evaluate(()=>{go('equipDetail',{eq:'e1'});return [...document.querySelectorAll('#app .btn')].filter(e=>/異常を記録/.test(e.textContent)).length});if(bn<1)bad.push('異常を記録のボタンが無い');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
