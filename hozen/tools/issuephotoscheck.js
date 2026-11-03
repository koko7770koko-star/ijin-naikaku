// 異常の入力窓の写真の確認：小さい試しの写真を6枚付けて 390px で、写真を消す「×」が押しやすく（押せる範囲 44px 以上）、隣の写真の×と重ならず、窓が横にはみ出さず、
// 押すとその1枚だけが消えることを確かめる。usage: node hozen/tools/issuephotoscheck.js [スクリーンショットの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=i=>{const cv=document.createElement('canvas');cv.width=80;cv.height=60;const x=cv.getContext('2d');x.fillStyle='hsl('+(i*50)+',50%,60%)';x.fillRect(0,0,80,60);return cv.toDataURL('image/png')};
  const ids=[...Array(6)].map((_,i)=>{PH['ip'+i]=mk(i);return 'ip'+i});S.issues=[{id:'is1',date:TODAY,title:'異常の試し',place:'A棟',status:'対応中',detail:'',action:'',closed:'',photos:ids}];editIssue('is1')});await p.waitForTimeout(500);
 await p.evaluate(()=>{document.querySelector('#modal .ph').scrollIntoView({block:'center'})});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#modal .ph b')];const hit=bs.map(e=>{const a=e.getBoundingClientRect(),cs=getComputedStyle(e,'::after');return {w:a.width+14,h:a.height+14,cx:a.left+a.width/2,cy:a.top+a.height/2}});
  const ok=bs.map((e,i)=>{const h=hit[i];const q=[[h.cx-20,h.cy-20],[h.cx+20,h.cy+20],[h.cx+20,h.cy-20],[h.cx-20,h.cy+20]];return q.every(([x,y])=>{const t=document.elementFromPoint(x,y);return t===e})});
  return {n:bs.length,w:Math.min(...hit.map(h=>h.w)),h:Math.min(...hit.map(h=>h.h)),ok,sw:document.documentElement.scrollWidth,mw:document.querySelector('#modal').scrollWidth,mc:document.querySelector('#modal').clientWidth}});
 if(r.n!==6)bad.push('写真が '+r.n+' 枚（6枚のはず）');if(r.w<44||r.h<44)bad.push('×の押せる範囲が44px未満 '+r.w+'x'+r.h);if(r.ok.some(x=>!x))bad.push('×の押せる範囲の四隅が別の物に当たる');if(r.sw>392||r.mw>r.mc+1)bad.push('窓が横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>{const e=document.querySelectorAll('#modal .ph b')[2];const a=e.getBoundingClientRect();e.click()});await p.waitForTimeout(200);
 const left=await p.evaluate(()=>[...document.querySelectorAll('#modal .ph img')].length);if(left!==5)bad.push('×で1枚だけ消えない '+left);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
