// 異常の報告書の印刷：写真 5 枚・長い詳細（15 行）の異常で、①5 枚とも紙に出て絵が読み込まれている（loading=lazy で下の写真が空にならない）
// ②写真が頁の境で切れない ③A4 2 枚まで ④写真が小さすぎない（25mm 以上）・記録は変わらない（hz-v-issue-photo-print）
// usage: node hozen/tools/issuephotoprintcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(async()=>{const ids=[];for(let k=0;k<5;k++){const cv=document.createElement('canvas');cv.width=1200;cv.height=900;const x=cv.getContext('2d');x.fillStyle=['#c33','#3c3','#33c','#cc3','#3cc'][k];x.fillRect(0,0,1200,900);ids.push(await putPhoto(cv.toDataURL('image/jpeg',.7)))}
  const lines=n=>Array.from({length:n},(_,i)=>'詳細'+(i+1)+' 受変電設備の盤内を点検し、端子の緩みと発熱を確かめた').join('\n');
  S.issues=[{id:'isph',date:TODAY,status:'対応中',title:'写真の多い異常',urgency:'高',downH:'',equipId:'',place:'電気室',detail:lines(15),action:'増し締め',cause:'',prevent:'',cost:'',confirmedBy:'',approvals:[],photos:ids}];save();
  go('printDoc',{doc:{t:'issue',id:'isph'}});return JSON.stringify(S.issues)});
 await p.waitForTimeout(400);await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const buf=await p.pdf({format:'A4',printBackground:true});const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 const r=await p.evaluate(()=>{const im=[...document.querySelectorAll('#app .phs img')].filter(x=>x.offsetParent);return {n:im.length,loaded:im.filter(x=>x.complete&&x.naturalWidth>0).length,minW:Math.min(...im.map(x=>x.getBoundingClientRect().width)),
  avoid:im.filter(x=>{const s=getComputedStyle(x.closest('.ph')||x);return s.breakInside==='avoid'||s.pageBreakInside==='avoid'||getComputedStyle(x).breakInside==='avoid'}).length}});
 if(r.n!==5)bad.push('紙に出る写真が '+r.n+' 枚（5 枚のはず）');
 if(r.loaded!==r.n)bad.push('紙で絵が読み込まれていない写真がある '+r.loaded+'/'+r.n+'（loading=lazy）');
 if(r.n&&r.minW<94)bad.push('紙の写真が小さい '+Math.round(r.minW)+'px（25mm=94px 以上）');
 if(r.n&&r.avoid!==r.n)bad.push('写真が頁の境で切れる設定（break-inside:avoid が無い）'+r.avoid+'/'+r.n);
 if(pages>2)bad.push('A4 が '+pages+' 枚（2 枚まで）');
 const after=await p.evaluate(()=>JSON.stringify(S.issues));if(after!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
