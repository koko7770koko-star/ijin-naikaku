// QR ラベルの印刷（紙の幅 794px・印刷の見た目）で、設備の番号・名前・場所や盤・場所の名前が空白の無い長い英数字（60 字）や絵文字のとき、
// ラベルの枠から文字がはみ出さず（scrollWidth>clientWidth・右端）、QR の絵と重ならず、並びが紙の幅に収まるか。札の大きさ「中」「小」・設備と盤の両方（hz-v-qr-print-longword、教え t-20261108-longword）。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/qrprintlongwordcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S);await p.waitForTimeout(200);
 await p.evaluate(()=>{window.save=()=>{};const W='ABCDEFGHIJ0123456789'.repeat(3);const E='🔥𠮷'.repeat(15);
  S.locs=[{id:'L1',name:'A'+W+W.slice(0,19),type:'棟',parent:''},{id:'L2',name:E+E,type:'階',parent:'L1'},{id:'L3',name:'第'+W+W,type:'電気室',parent:'L2'}];
  for(let i=0;i<9;i++)S.locs.push({id:'B'+i,name:(i%2?E+E:'P'+W+W.slice(0,19)),type:'盤',parent:'L3'});
  S.equipment=Array.from({length:9},(_,i)=>({id:'eq'+i,code:(i%2?'🔥'+W+W:'E'+W+W.slice(0,29)),name:(i%3?W+W:E+E+E),locId:i%2?'L3':'',place:W+W,status:'稼働',run:{meters:[]}}))});
 for(const kind of ['','ban'])for(const sz of ['','s']){
  await p.emulateMedia({media:'screen'});await p.evaluate(([k,z])=>{V.qrKind=k;V.qrSz=z;V.qrAll=true;go('qr')},[kind,sz]);await p.waitForTimeout(200);
  await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const L=[...document.querySelectorAll('.qrl')],sh=document.querySelector('.qrsheet');const sr=sh?sh.getBoundingClientRect():{right:0};const o=[];
   for(const l of L){const lr=l.getBoundingClientRect(),q=l.querySelector('.qri').getBoundingClientRect(),t=l.querySelector('.qrt');const tr=t.getBoundingClientRect();
    if(t.scrollWidth>t.clientWidth+1)o.push('文が箱からはみ出す '+(t.scrollWidth-t.clientWidth)+'px');
    for(const x of t.querySelectorAll('*')){const xr=x.getBoundingClientRect();if(xr.right>lr.right+1||x.scrollWidth>x.clientWidth+1&&getComputedStyle(x).display!=='inline'){o.push('「'+x.tagName+'」が枠の外 '+Math.round(xr.right-lr.right)+'px');break}}
    if(tr.left<q.right-1)o.push('QR と文が重なる');if(lr.right>sr.right+1)o.push('ラベルが紙の外');if(q.width<40)o.push('QR が小さすぎる '+Math.round(q.width)+'px');}
   return{n:L.length,o:[...new Set(o)],sw:document.documentElement.scrollWidth}});
  const tag=(kind||'設備')+'・'+(sz||'中');console.log(tag,JSON.stringify(r));
  if(r.n!==9)bad.push(tag+' ラベルの数 '+r.n);if(r.o.length)bad.push(tag+' '+r.o.join('／'));if(r.sw>800)bad.push(tag+' 紙の幅を横にはみ出す '+r.sw);}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
