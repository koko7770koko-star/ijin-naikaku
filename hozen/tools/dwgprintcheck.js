// 図面の印刷：横長・縦長の図面に印を 10 個つけ、拡大したまま印刷しても、図面が A4 縦 1 枚（幅・高さ）に収まり、
// 図面の名前と版が上に出て、印が図面の同じ所に乗り、拡大・印を置く・版の選択などの操作の部品が印刷に出ない・記録は変わらない。usage: node hozen/tools/dwgprintcheck.js [PDFの出力先の頭]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(async()=>{const mk=async(w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.fillStyle='#dde';x.fillRect(0,0,w,h);x.strokeStyle='#000';x.lineWidth=8;x.strokeRect(0,0,w,h);return putPhoto(cv.toDataURL('image/png'))};
  const a=await mk(1600,800),t=await mk(600,1400);
  S.equipment=[...Array(10)].map((_,i)=>({id:'pe'+i,code:'E-'+i,name:'設備'+i,kind:'',status:'稼働',locId:'',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}));
  const pins=()=>[...Array(10)].map((_,i)=>({id:'pp'+i,equipId:'pe'+i,label:'',x:.05+i*.09,y:i%2?.15:.85}));
  S.drawings=[{id:'dw',name:'横長の図面',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:a,type:'image/png'}],pins:pins()},{id:'dt',name:'縦長の図面',kind:'平面図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:t,type:'image/png'}],pins:pins()}];
  save();return JSON.stringify(S.drawings)});
 for(const id of ['dw','dt']){
  await p.setViewportSize({width:390,height:844});await p.emulateMedia({media:'screen'});
  await p.evaluate(id=>go('dwg',{dwg:id,dwgZ:2}),id);await p.waitForTimeout(500);
  await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
   const im=document.querySelector('#dwgv img'),ib=im.getBoundingClientRect();
   const off=[...document.querySelectorAll('#dwgv .pin')].map(e=>{const pb=e.getBoundingClientRect(),cx=(pb.left+pb.right)/2,cy=pb.bottom;/* 印は下の真ん中が図面の点（translate(-50%,-100%)） */return {cx,cy}});
   const ctl=[...document.querySelectorAll('#app button,#app select,#app input')].filter(vis).map(e=>(e.textContent||'').trim().slice(0,10));
   const hd=[...document.querySelectorAll('#app .mprint')].filter(vis).map(e=>e.textContent).join(' ');return {hd,w:ib.width,h:ib.height,l:ib.left,t:ib.top,r:ib.right,off,ctl,W:innerWidth,sw:document.documentElement.scrollWidth}});
  const P=await p.evaluate(id=>S.drawings.find(d=>d.id===id).pins.map(x=>({x:x.x,y:x.y})),id);
  if(r.r>r.W+1||r.sw>r.W+1)bad.push(id+'：図面が A4 の幅からはみ出す '+Math.round(r.r)+'/'+r.W);
  if(r.h>945)bad.push(id+'：図面が A4 の高さ（250mm）を超える '+Math.round(r.h));
  const far=P.map((q,i)=>{const o=r.off[i];if(!o)return 999;return Math.max(Math.abs(o.cx-(r.l+q.x*r.w)),Math.abs(o.cy-(r.t+q.y*r.h)))}).filter(d=>d>4);
  if(far.length)bad.push(id+'：印が図面とずれる '+far.map(Math.round).join(','));
  if(!new RegExp(id==='dw'?'横長の図面':'縦長の図面').test(r.hd)||!/版 1/.test(r.hd))bad.push(id+'：印刷に図面の名前・版が出ない '+r.hd);
  if(r.ctl.length)bad.push(id+'：印刷に操作の部品が残る '+r.ctl.join('|'));
  const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(process.argv[2])require('fs').writeFileSync(process.argv[2]+'-'+id+'.pdf',buf);
 }
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.drawings))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
