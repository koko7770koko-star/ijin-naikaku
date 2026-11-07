// 図面：1 枚に設備の印 300 個（50 個は同じ場所に重なる）で、図面が 1 秒以内に開き、印が全部描かれ、下の一覧から印を押すたびに 1 秒以内で
// その印だけが光り、「設備へ ›」「外す」が 44px 以上・横にはみ出さず、保存の形（pins）は変わらないか（hz-v-dwg-pins-many）。usage: node hozen/tools/dwgpinsmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=800;cv.height=500;const x=cv.getContext('2d');x.fillStyle='#ccd';x.fillRect(0,0,800,500);const id=await putPhoto(cv.toDataURL('image/png'));
  S.equipment=[...Array(300)].map((_,i)=>({id:'e'+i,code:'E-'+String(i+1).padStart(3,'0'),name:'設備'+i+'（名前の長い設備 高圧交流負荷開閉器）',kind:'',status:'稼働',locId:'',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}));
  S.drawings=[{id:'d1',name:'試験図面',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:id,type:'image/png'}],pins:[...Array(300)].map((_,i)=>({id:'p'+i,equipId:'e'+i,label:'',x:i<50?.5:.05+(i%25)*.037,y:i<50?.5:.05+Math.floor(i/25)*.075}))}];
  save();const s=performance.now();go('dwg',{dwg:'d1',dwgZ:1});window.__dwgMs=performance.now()-s;return JSON.stringify(S.drawings[0].pins)});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')];const bs=[...document.querySelectorAll('#app .item .btn')];return {n:it.length,small:bs.filter(e=>e.getBoundingClientRect().height<44).length,sw:document.documentElement.scrollWidth,pins:document.querySelectorAll('#dwgv .pin').length,cut:it.filter(e=>e.getBoundingClientRect().right>innerWidth+1).length}});
 const dms=await p.evaluate(()=>window.__dwgMs);if(dms>1000)bad.push('図面が開くまで '+Math.round(dms)+'ms');
 if(r.n!==300)bad.push('一覧が '+r.n+' 件（300のはず）');if(r.pins!==300)bad.push('印が '+r.pins);if(r.small)bad.push('44px未満のボタン '+r.small);if(r.sw>392||r.cut)bad.push('横にはみ出す '+r.sw);
 const taps=[];for(const k of [250,120,4]){taps.push(Math.round(await p.evaluate(k=>{const s=performance.now();document.querySelectorAll('#app .item')[k].click();return performance.now()-s},k)));await p.waitForTimeout(400)}
 if(Math.max(...taps)>1000)bad.push('一覧の印を押すたび '+taps.join('/')+'ms');console.log('図面 '+Math.round(dms)+'ms・押すたび '+taps.join('/')+'ms');
 const h=await p.evaluate(()=>{const v=document.getElementById('dwgv').getBoundingClientRect();return {hl:document.querySelectorAll('#dwgv .pin.hl').length,vis:v.bottom>0&&v.top<innerHeight,which:[...document.querySelectorAll('#dwgv .pin')].findIndex(e=>e.classList.contains('hl')),view:V.view}});
 if(h.view!=='dwg')bad.push('一覧を押したら図面から出てしまった '+h.view);if(h.hl!==1)bad.push('光る印が '+h.hl+' 個（1個のはず）');if(h.which!==4)bad.push('違う印が光る '+h.which);if(!h.vis)bad.push('図面が画面に出ない');
 await p.evaluate(()=>[...document.querySelectorAll('#app .item .btn')].find(e=>/設備へ/.test(e.textContent)).click());await p.waitForTimeout(300);
 if(await p.evaluate(()=>V.view)!=='equipDetail')bad.push('「設備へ」で設備カルテが開かない');
 await p.evaluate(()=>go('dwg',{dwg:'d1'}));const after=await p.evaluate(()=>JSON.stringify(S.drawings[0].pins));if(after!==before)bad.push('記録（pins）が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
