// 図面の印を押す確認：印の押せる所が 44px 以上（見た目は小さいまま）・文字は12px以上。
//  1つだけの印を押すとその設備へ1タップ。重なった印を押すと「近くの印」の窓が出て、選んだ印の「設備へ ›」「場所へ ›」で1タップで移れる
//  （場所へは 設備の場所 の木をその場所まで開いて光らせる）。保存の形（pins）は変わらない。390px ではみ出さない。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=800;cv.height=500;const x=cv.getContext('2d');x.fillStyle='#ccd';x.fillRect(0,0,800,500);const id=await putPhoto(cv.toDataURL('image/png'));
  const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r')];
  const eq=(i,loc)=>({id:'e'+i,code:'E-'+i,name:'設備'+i,kind:'',status:'稼働',locId:loc,run:{meters:[]},repairs:[],docs:[],photos:[],health:[]});
  S.equipment=[eq(1,'x'),eq(2,'r'),eq(3,'')];
  S.drawings=[{id:'d1',name:'試験図面',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:id,type:'image/png'}],pins:[{id:'p1',equipId:'e1',label:'',x:.5,y:.5},{id:'p2',equipId:'e2',label:'',x:.51,y:.51},{id:'p3',equipId:'e3',label:'',x:.15,y:.2}]}];
  go('dwg',{dwg:'d1',dwgZ:1});return JSON.stringify(S.drawings[0].pins)});await p.waitForTimeout(500);
 const sz=await p.evaluate(()=>[...document.querySelectorAll('#dwgv .pin')].map(e=>{const a=getComputedStyle(e,'::after');return {w:parseFloat(a.width),h:parseFloat(a.height),f:parseFloat(getComputedStyle(e).fontSize)}}));
 if(sz.some(s=>s.w<44||s.h<44))bad.push('印の押せる所が44px未満 '+JSON.stringify(sz[0]));if(sz.some(s=>s.f<12))bad.push('印の文字が12px未満');
 // 1つだけの印 → 設備へ
 await p.evaluate(()=>{const e=document.querySelectorAll('#dwgv .pin')[2];e.click()});await p.waitForTimeout(200);
 if(await p.evaluate(()=>V.view+':'+V.eq)!=='equipDetail:e3')bad.push('1つだけの印で設備へ移らない '+(await p.evaluate(()=>V.view)));
 // 重なった印 → 窓 → 場所へ
 await p.evaluate(()=>go('dwg',{dwg:'d1',dwgZ:1}));await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelectorAll('#dwgv .pin')[0].click());await p.waitForSelector('#modal button:has-text("場所へ")');
 const mt=await p.evaluate(()=>$('#modal').innerText);if(!/近くの印 2個/.test(mt)||!/A棟 › 1階 › 第1電気室 › 動力盤-1/.test(mt))bad.push('近くの印の窓が違う '+mt.slice(0,120));
 const small=await p.evaluate(()=>[...document.querySelectorAll('#modal button')].filter(e=>e.getBoundingClientRect().height<44).length);if(small)bad.push('窓のボタンが44px未満 '+small);
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'dwgtap.png')})}
 await p.click('#modal button:has-text("場所へ")');await p.waitForTimeout(300);
 const lv=await p.evaluate(()=>({v:V.view,vis:!!document.querySelector('.locn[data-loc="x"]')}));if(lv.v!=='locs'||!lv.vis)bad.push('場所へ移らない／木が開かない '+JSON.stringify(lv));
 // 窓の「設備へ」
 await p.evaluate(()=>go('dwg',{dwg:'d1',dwgZ:1}));await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelectorAll('#dwgv .pin')[0].click());await p.waitForSelector('#modal button:has-text("設備へ")');
 await p.locator('#modal button:has-text("設備へ")').nth(1).click();await p.waitForTimeout(200);
 if(await p.evaluate(()=>V.view+':'+V.eq)!=='equipDetail:e2')bad.push('窓の設備へで移らない');
 if(await p.evaluate(()=>JSON.stringify(S.drawings[0].pins))!==before)bad.push('印の記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
