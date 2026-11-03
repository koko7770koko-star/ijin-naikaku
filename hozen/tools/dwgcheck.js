// 図面の確認：縦長・横長どちらも390pxで収まる・拡大ボタンで大きくなり横スクロールは図面の枠の中だけ・印の位置が画像と一緒に動く・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 for(const [w,h,nm] of [[1600,600,'横長'],[600,1600,'縦長']]){
  await p.evaluate(async([w,h])=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.fillStyle='#ccd';x.fillRect(0,0,w,h);
   const id=await putPhoto(cv.toDataURL('image/png'));
   S.drawings=[{id:'d1',name:'試験図面',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:id,type:'image/png'}],pins:[{id:'p1',equipId:'',label:'印',x:.5,y:.5}]}];
   go('dwg',{dwg:'d1',dwgZ:1})},[w,h]);await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{const v=document.querySelector('#dwgv').getBoundingClientRect(),pn=document.querySelector('#dwgv .pin').getBoundingClientRect();return{w:v.width,h:v.height,sw:document.documentElement.scrollWidth,px:pn.left+pn.width/2,vx:v.left+v.width/2}});
  if(r.sw>392)bad.push(nm+'：横にはみ出す '+r.sw);if(r.h>0.8*844)bad.push(nm+'：高さが大きすぎる '+r.h);if(Math.abs(r.px-r.vx)>8)bad.push(nm+'：印の位置がずれる');
  await p.evaluate(()=>{V.dwgZ=3;render()});await p.waitForTimeout(300);
  const z=await p.evaluate(()=>({w:document.querySelector('#dwgv').getBoundingClientRect().width,sw:document.documentElement.scrollWidth}));
  if(z.w<r.w*1.5)bad.push(nm+'：拡大しても大きくならない');if(z.sw>392)bad.push(nm+'：拡大でページが横にはみ出す '+z.sw);
 }
 await p.evaluate(()=>dwgErr(new Error('保存容量が足りません')));await p.waitForTimeout(200);
 if(!/いっぱい/.test(await p.evaluate(()=>document.querySelector('#modal').innerText)))bad.push('容量不足の案内が出ない');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
