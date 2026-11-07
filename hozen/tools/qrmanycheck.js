// QR ラベル：設備 500 台（長い名前を含む）で、QR の画面が 3 秒以内に出て（画面は先頭 150 枚）、印刷ボタンで 500 枚そろい、印刷（A4）でラベルが枠からはみ出さず、
// ページの境で割れない設定のまま QR が 20mm 以上、PDF が作れるか（hz-v-qr-many）。usage: node hozen/tools/qrmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const N=500,QR_SHOW_N=150;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const ms=await p.evaluate(N=>{S.equipment=Array.from({length:N},(_,i)=>({id:'eq'+i,code:'E-'+String(i+1).padStart(4,'0'),name:i%5===0?'非常用発電機設備の長い名前テスト用ABCDEFGHIJKLMN'+i:'設備'+(i+1),locId:'',status:'稼働',run:{meters:[]}}));save();const s=performance.now();go('qr');return performance.now()-s},N);
 if(ms>3000)bad.push('QR の画面が出るまで '+Math.round(ms)+'ms');
 await p.waitForTimeout(300);const shown=await p.evaluate(()=>({n:document.querySelectorAll('.qrl').length,txt:document.querySelector('#app').innerText}));
 if(shown.n!==Math.min(N,QR_SHOW_N))bad.push('画面のラベル数 '+shown.n);if(!/全500枚/.test(shown.txt))bad.push('印刷ボタンに「全500枚」が出ない');
 // 印刷ボタンの流れ（qrPrint：全部を並べてから印刷）。window.print は止めて、紙の幅（A4 縦 約 794px）で見る
 await p.evaluate(()=>{window.print=()=>{};qrPrint()});await p.waitForTimeout(300);await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const L=[...document.querySelectorAll('.qrl')];const sh=document.querySelector('.qrsheet');if(!sh)return {n:L.length,nosheet:true};const sr=sh.getBoundingClientRect();
  const over=L.filter(l=>{const lr=l.getBoundingClientRect();return [...l.querySelectorAll('.qrt,.qrt *')].some(x=>x.getBoundingClientRect().right>lr.right+1)||lr.right>sr.right+1}).length;
  const qs=[...document.querySelectorAll('.qri')].map(x=>x.getBoundingClientRect().width/96*25.4);const empty=[...document.querySelectorAll('.qri')].filter(x=>!x.innerHTML.trim()&&!(x.tagName==='IMG'&&x.src)&&!(x.tagName==='CANVAS')).length;
  return{n:L.length,over,qmin:Math.min(...qs),empty,avoid:getComputedStyle(L[L.length-1]).breakInside}});
 if(r.nosheet)bad.push('印刷のシートが無い');if(r.n!==N)bad.push('ラベル数 '+r.n+'/'+N);if(r.over)bad.push('枠をはみ出すラベル '+r.over);if(r.qmin<20)bad.push('QR が小さい '+r.qmin.toFixed(1)+'mm');if(r.empty)bad.push('QR が描かれていないラベル '+r.empty);if(r.avoid!=='avoid')bad.push('ラベルがページの境で割れる設定');
 const s=Date.now();const buf=await p.pdf({format:'A4'}).catch(e=>{bad.push('PDF が作れない '+e.message);return null});const pm=Date.now()-s;if(buf&&buf.length<10000)bad.push('PDF が空');if(pm>30000)bad.push('PDF に '+pm+'ms');
 console.log('画面 '+Math.round(ms)+'ms・PDF '+pm+'ms・'+(buf?Math.round(buf.length/1024)+'KB':''));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
