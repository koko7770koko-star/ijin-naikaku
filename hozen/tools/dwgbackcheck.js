// 図面から戻る（hz-dwg-back）：図面を拡大して位置をずらす → 印を押して設備カルテへ → 戻る（Android の戻る＝history.back と、画面の ‹ の両方）で
//  同じ図面・同じ拡大・ほぼ同じ位置に戻る。保存の形（drawings・pins）は変わらない。390px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=1600;cv.height=1000;const x=cv.getContext('2d');x.fillStyle='#ccd';x.fillRect(0,0,1600,1000);const id=await putPhoto(cv.toDataURL('image/png'));
  S.equipment=[{id:'e1',code:'E-1',name:'変圧器',kind:'',status:'稼働',locId:'',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}];
  S.drawings=[{id:'d1',name:'試験図面',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:id,type:'image/png'}],pins:[{id:'p1',equipId:'e1',label:'',x:.7,y:.6}]}];
  go('dwgs');go('dwg',{dwg:'d1',dwgZ:1});return JSON.stringify(S.drawings)});await p.waitForTimeout(400);
 // 拡大 2.5 倍・図面の中を右下へ・ページも少し下へ
 await p.evaluate(()=>{V.dwgZ=2.5;render()});await p.waitForTimeout(300);
 await p.evaluate(()=>{const w=document.querySelector('.dwgw');w.scrollLeft=420;w.scrollTop=260;window.scrollTo(0,120)});await p.waitForTimeout(150);
 const pos=()=>p.evaluate(()=>{const w=document.querySelector('.dwgw');return {v:V.view,d:V.dwg,z:V.dwgZ,l:w?w.scrollLeft:-1,t:w?w.scrollTop:-1,y:Math.round(window.scrollY)}});
 const p0=await pos();
 const near=(a,b)=>a.v==='dwg'&&a.d===b.d&&a.z===b.z&&Math.abs(a.l-b.l)<=30&&Math.abs(a.t-b.t)<=30&&Math.abs(a.y-b.y)<=30;
 // ① Android の戻る
 await p.evaluate(()=>{const e=[...document.querySelectorAll('#dwgv .pin')][0];e.click()});await p.waitForTimeout(300);
 if(await p.evaluate(()=>V.view)!=='equipDetail')bad.push('印で設備カルテへ行かない');
 await p.goBack();await p.waitForTimeout(400);let p1=await pos();if(!near(p1,p0))bad.push('戻る（端末）で同じ拡大・位置に戻らない '+JSON.stringify({p0,p1}));
 // ② 画面の ‹
 await p.evaluate(()=>{const e=[...document.querySelectorAll('#dwgv .pin')][0];e.click()});await p.waitForTimeout(300);
 await p.click('#hback');await p.waitForTimeout(400);p1=await pos();if(!near(p1,p0))bad.push('‹ で図面の同じ拡大・位置に戻らない '+JSON.stringify({p0,p1}));
 // 一覧から別に開いたときは、前の位置を引きずらない（最初から）
 await p.evaluate(()=>{go('dwgs');go('dwg',{dwg:'d1',dwgZ:1})});await p.waitForTimeout(300);const p2=await pos();if(p2.z!==1||p2.y!==0)bad.push('一覧から開き直しても前の拡大・位置のまま '+JSON.stringify(p2));
 if(await p.evaluate(()=>JSON.stringify(S.drawings))!==before)bad.push('図面の記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
