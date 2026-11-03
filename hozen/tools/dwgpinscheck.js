// 図面の確認：ピンが30個（半分は同じ場所に重なる）あっても、390px で下の一覧から目的の印を選べ（押すと図面の上のその印だけが光り、図面が画面に出る）、
// 「設備へ ›」「外す」が44px以上・横にはみ出さず、保存の形（pins）は変わらないことを確かめる。usage: node hozen/tools/dwgpinscheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const before=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=800;cv.height=500;const x=cv.getContext('2d');x.fillStyle='#ccd';x.fillRect(0,0,800,500);const id=await putPhoto(cv.toDataURL('image/png'));
  S.equipment=[...Array(30)].map((_,i)=>({id:'e'+i,code:'E-'+String(i+1).padStart(3,'0'),name:'設備'+i+'（名前の長い設備 高圧交流負荷開閉器）',kind:'',status:'稼働',locId:'',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}));
  S.drawings=[{id:'d1',name:'試験図面',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:id,type:'image/png'}],pins:[...Array(30)].map((_,i)=>({id:'p'+i,equipId:'e'+i,label:'',x:i<15?.5:.1+(i%10)*.08,y:i<15?.5:.2+Math.floor(i/10)*.2}))}];
  go('dwg',{dwg:'d1',dwgZ:1});return JSON.stringify(S.drawings[0].pins)});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')];const bs=[...document.querySelectorAll('#app .item .btn')];return {n:it.length,small:bs.filter(e=>e.getBoundingClientRect().height<44).length,sw:document.documentElement.scrollWidth,pins:document.querySelectorAll('#dwgv .pin').length,cut:it.filter(e=>e.getBoundingClientRect().right>innerWidth+1).length}});
 if(r.n!==30)bad.push('一覧が '+r.n+' 件（30のはず）');if(r.pins!==30)bad.push('印が '+r.pins);if(r.small)bad.push('44px未満のボタン '+r.small);if(r.sw>392||r.cut)bad.push('横にはみ出す '+r.sw);
 await p.evaluate(()=>document.querySelectorAll('#app .item')[4].click());await p.waitForTimeout(500);
 const h=await p.evaluate(()=>{const v=document.getElementById('dwgv').getBoundingClientRect();return {hl:document.querySelectorAll('#dwgv .pin.hl').length,vis:v.bottom>0&&v.top<innerHeight,which:[...document.querySelectorAll('#dwgv .pin')].findIndex(e=>e.classList.contains('hl')),view:V.view}});
 if(h.view!=='dwg')bad.push('一覧を押したら図面から出てしまった '+h.view);if(h.hl!==1)bad.push('光る印が '+h.hl+' 個（1個のはず）');if(h.which!==4)bad.push('違う印が光る '+h.which);if(!h.vis)bad.push('図面が画面に出ない');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>[...document.querySelectorAll('#app .item .btn')].find(e=>/設備へ/.test(e.textContent)).click());await p.waitForTimeout(300);
 if(await p.evaluate(()=>V.view)!=='equipDetail')bad.push('「設備へ」で設備カルテが開かない');
 await p.evaluate(()=>go('dwg',{dwg:'d1'}));const after=await p.evaluate(()=>JSON.stringify(S.drawings[0].pins));if(after!==before)bad.push('記録（pins）が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
