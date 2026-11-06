// 文字「大」「特大」・360px：日常点検の写真（6 枚）の並び・消す「×」・写真を足すボタンが、重ならず・切れず・押しやすい（押せる範囲 44px 以上）ことを確かめる（hz-l-day-photos）。
// usage: node hozen/tools/dayphotosxlcheck.js [スクリーンショットの出力先]   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const fsc of ['l','xl']){
 const c=await b.newContext({viewport:{width:360,height:780},hasTouch:true});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(fsc=>{const mk=i=>{const cv=document.createElement('canvas');cv.width=80;cv.height=60;const x=cv.getContext('2d');x.fillStyle='hsl('+(i*50)+',50%,60%)';x.fillRect(0,0,80,60);return cv.toDataURL('image/png')};
  const ids=[...Array(6)].map((_,i)=>{PH['dp'+i]=mk(i);return 'dp'+i});S.daily[TODAY]={c:{},by:'職員1',photos:ids};S.settings.fscale=fsc;applyFScale();V.day=TODAY;go('day')},fsc);
 await p.waitForTimeout(500);
 await p.evaluate(()=>{const e=document.querySelector('.phs');if(e)e.scrollIntoView({block:'center'})});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const z=parseFloat(document.documentElement.style.zoom)||1;const ph=[...document.querySelectorAll('.phs .ph')];const bs=ph.map(e=>e.querySelector('b'));
  const rect=e=>{const a=e.getBoundingClientRect();return {l:a.left,t:a.top,r:a.right,b:a.bottom,w:a.width,h:a.height}};
  const hit=bs.map(e=>{const a=rect(e);return {w:a.w+14*z,h:a.h+14*z,cx:(a.l+a.r)/2,cy:(a.t+a.b)/2}});
  const ok=bs.map((e,i)=>{const h=hit[i];return [[h.cx-18*z,h.cy-18*z],[h.cx+18*z,h.cy+18*z]].every(([x,y])=>{const t=document.elementFromPoint(x,y);return t===e})});
  const imgs=ph.map(e=>rect(e.querySelector('img')));let over=0;for(let i=0;i<imgs.length;i++)for(let j=i+1;j<imgs.length;j++){const a=imgs[i],c=imgs[j];if(a.l<c.r-1&&c.l<a.r-1&&a.t<c.b-1&&c.t<a.b-1)over++}
  const add=[...document.querySelectorAll('label,button')].filter(e=>/写真/.test(e.textContent)&&e.getBoundingClientRect().width>0).map(e=>({t:e.textContent.trim().slice(0,12),w:rect(e).w,h:rect(e).h,sw:e.scrollWidth,cw:e.clientWidth,sh:e.scrollHeight,ch:e.clientHeight,r:rect(e).r}));
  return {n:bs.length,minw:Math.min(...hit.map(h=>h.w))/z,minh:Math.min(...hit.map(h=>h.h))/z,ok,over,add,sw:document.documentElement.scrollWidth,iw:innerWidth,right:Math.max(...imgs.map(i=>i.r))}});
 const tag='['+fsc+'] ';
 if(r.n!==6)bad.push(tag+'写真が '+r.n+' 枚');if(r.minw<44||r.minh<44)bad.push(tag+'×の押せる範囲が44px未満 '+r.minw+'x'+r.minh);
 if(r.ok.some(x=>!x))bad.push(tag+'×の押せる範囲が別の物に隠れる '+JSON.stringify(r.ok));if(r.over)bad.push(tag+'写真どうしが重なる '+r.over);
 if(r.sw>r.iw+2)bad.push(tag+'横にはみ出す '+r.sw+'>'+r.iw);if(r.right>r.iw+1)bad.push(tag+'写真が画面の右に出る '+r.right);
 r.add.forEach(a=>{if(a.sw>a.cw+1||a.sh>a.ch+1)bad.push(tag+'ボタンの文字が切れる '+JSON.stringify(a));if(a.r>r.iw+1)bad.push(tag+'ボタンが画面の右に出る '+JSON.stringify(a))});
 if(process.argv[2])await p.screenshot({path:process.argv[2].replace(/(\.\w+)?$/,'-'+fsc+'$1')});
 await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
