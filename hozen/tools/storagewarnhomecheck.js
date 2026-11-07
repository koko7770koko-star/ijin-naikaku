// 保存の上限の手前の知らせ：記録が上限（約 500 万字）の 8 割を超えたとき、保存が失敗する前にホームの知らせに「保存領域が ○% 使われています」が出るか。
// ① 開いたとき既に 8 割を超えている ② 開いたまま記録が増えて 8 割を超えた（開き直さなくても出る）③ 小さい記録では出ない。390px・特大ではみ出さない（hz-v-storage-warn-home）。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/storagewarnhomecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(300);
 const warn=()=>p.evaluate(()=>{go('home');return /保存領域が \d+% 使われています/.test(document.querySelector('#app').innerText)});
 // ③ 小さい記録
 if(await warn())bad.push('小さい記録なのに知らせが出る');
 // ② 開いたまま増やす：測定記録を 8 割を少し超えるまで足して保存
 const r=await p.evaluate(()=>{const row=i=>({id:'m'+i,date:addD(TODAY,-(i%700)),equipId:'',type:'絶縁抵抗',name:'測定'+'あ'.repeat(40),rows:[{name:'R',v:String(i%50),min:'5',max:'',unit:'MΩ'}],note:'い'.repeat(60)});
  S.meas=S.meas||[];let i=0;while(JSON.stringify(S).length<4.15e6){for(let k=0;k<500;k++)S.meas.push(row(i++))}save();return {len:JSON.stringify(S).length,fail:SAVE_FAIL.app,w:STORAGE_WARN}});
 if(r.fail)bad.push('8 割で保存に失敗した（試しの記録が大きすぎる）');
 if(!(await warn()))bad.push('開いたまま 8 割を超えても知らせが出ない '+JSON.stringify(r));
 // ① 開き直しても出る
 await p.reload();await p.waitForFunction(READY,null,{timeout:20000});await p.waitForTimeout(800);
 if(!(await warn()))bad.push('開き直すと知らせが出ない');
 // はみ出さない（特大）
 await p.evaluate(()=>{S.settings.fscale='xl';save()});await p.reload();await p.waitForFunction(READY,null,{timeout:20000});await p.waitForTimeout(500);
 const sw=await p.evaluate(()=>{go('home');return document.documentElement.scrollWidth});if(sw>392)bad.push('特大でホームが横にはみ出す '+sw);
 console.log('記録 '+r.len+' 字・'+(r.w||'知らせなし'));
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
