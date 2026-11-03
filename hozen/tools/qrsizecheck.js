// QR の札：札の大きさ（中＝3列・QR22mm／小＝4列・QR17mm）を選べる。小でも長い名前が切れず（枠の外に出ない）、QRは15mm以上、印刷で1枚が2ページに割れない。
// 設備のQRも盤のQRも同じ。選びは画面だけ（保存しない）。390pxで横にはみ出さない・切り替えボタンは44px以上。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const before=await p.evaluate(()=>{const long='非常用発電機設備の長い名前テスト用ABCDEFGHIJKLMN';
  S.locs=[{id:'b1',name:'A棟',type:'建屋',parent:''},{id:'f1',name:'1階',type:'階',parent:'b1'},{id:'r1',name:'第1電気室',type:'電気室',parent:'f1'},...Array.from({length:12},(_,i)=>({id:'k'+i,name:i%3===0?long:'動力盤-'+(i+1),type:'盤',parent:'r1'}))];
  S.equipment=Array.from({length:24},(_,i)=>({id:'eq'+i,code:'E-'+String(i+1).padStart(3,'0'),name:i%4===0?long:'設備'+(i+1),locId:'f1',status:'稼働',run:{meters:[]}}));save();V.qrSz='';V.qrKind='';go('qr');return JSON.stringify([S.locs,S.equipment])});
 await p.waitForTimeout(300);
 for(const kind of ['','ban']){
  await p.evaluate(k=>{V.qrKind=k;V.qrSz='';go('qr')},kind);await p.waitForTimeout(250);
  const seg=await p.evaluate(()=>{const e=document.getElementById('qrSz');if(!e)return null;return {hs:[...e.querySelectorAll('button')].map(x=>x.getBoundingClientRect().height),n:e.querySelectorAll('button').length,sw:document.documentElement.scrollWidth,iw:innerWidth}});
  ok(!!seg,kind+'札の大きさの選びが無い');if(!seg)continue;ok(seg.n===2&&seg.hs.every(h=>h>=44),kind+'切り替えが小さい '+seg.hs);ok(seg.sw<=seg.iw,kind+'横にはみ出す');
  for(const sz of ['','s']){
   await p.evaluate(z=>{V.qrSz=z;render()},sz);await p.waitForTimeout(200);
   await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
   const r=await p.evaluate(()=>{const L=[...document.querySelectorAll('.qrl')];const sh=document.querySelector('.qrsheet').getBoundingClientRect();const mm=96/25.4;
    const over=L.filter(l=>{const lr=l.getBoundingClientRect();return [...l.querySelectorAll('.qrt,.qrt *')].some(x=>x.getBoundingClientRect().right>lr.right+1)||lr.right>sh.right+1}).length;
    const cols=new Set(L.map(l=>Math.round(l.getBoundingClientRect().left))).size;
    return {n:L.length,over,qmm:document.querySelector('.qri').getBoundingClientRect().width/mm,cols,cls:document.querySelector('.qrsheet').className,br:getComputedStyle(L[0]).breakInside}});
   const tag=`${kind||'設備'}・${sz||'中'}`;
   ok(r.n>0,tag+'：札が出ない');ok(r.over===0,`${tag}：枠から出る札が ${r.over}枚`);ok(sz==='s'?(r.qmm>=15&&r.cols===4):(r.qmm>=20&&r.cols===3),`${tag}：QR ${r.qmm.toFixed(1)}mm・${r.cols}列`);ok(r.br==='avoid','割れない設定でない');
   const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});ok(buf.length>1500,tag+'：PDFにならない');
   await p.emulateMedia({media:'screen'});await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100)}
 }
 ok(await p.evaluate(()=>JSON.stringify([S.locs,S.equipment]))===before,'記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
