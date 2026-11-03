// 使い始めの確認：日常点検の記録が0件なら、ホームに「未実施 n日」を出さない。記録があれば、その最初の日より前は数えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const txt=()=>p.evaluate(()=>document.getElementById('app').innerText);
 if(/日常点検の未実施/.test(await txt()))bad.push('記録0件なのに「日常点検の未実施」が出る');
 if(!/今日の日常点検が未入力/.test(await txt()))bad.push('記録0件で「今日の日常点検が未入力です」が出ない');
 // 3日前に1件だけ記録 → 昨日・一昨日は未実施、4日前以前は数えない（最大2日）
 const n=await p.evaluate(()=>{const k=addD(TODAY,-3),id=numDefs().length?numDefs()[0].id:null;S.daily[k]={c:{x:'ok'},done:true};if(!hasRec(S.daily[k]))return -1;go('home');
  const m=document.getElementById('app').innerText.match(/日常点検の未実施 (\d+)日/);return m?+m[1]:0});
 if(n!==2)bad.push('3日前に記録があるとき未実施は2日のはず '+n);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
