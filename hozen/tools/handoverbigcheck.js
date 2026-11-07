// 申し送り（引継ぎ）：上限の 3000 字の申し送りを 1 年分（毎日）書いたとき、①日常点検の画面が 0.5 秒以内 ②前日の申し送りが特大（空白の無い英数字の続きも）でも
// ホーム・日常点検で横にはみ出さない ③日報の印刷で 3000 字（75 行）の申し送りが頁の境で切れずに続き、最初と最後の行が紙に出て、空に近い頁が出ない（hz-v-handover-print-many）。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/handoverbigcheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 for(const kind of ['lines','ascii']){const tag=(kind==='lines'?'75 行':'空白なしの英数字')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const len=await p.evaluate(kind=>{const T=(d,k)=>k==='lines'?[...Array(75)].map((_,i)=>(i===0?'申継の最初':i===74?'申継の最後':'申継'+(i+1)+'行目')+'：受変電設備の点検結果と引き継ぎ事項の文。').join('\n').slice(0,3000).padEnd(3000,'。'):('A'+d.replace(/-/g,'')).repeat(400).slice(0,3000);
  S.handover={};for(let i=0;i<366;i++){const d=addD(TODAY,-i);S.handover[d]={text:T(d,kind),by:'職員'+(i%5+1),at:new Date().toISOString()}}
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);S.handover=m.handover}save();return {n:Object.keys(S.handover).length,max:Math.max(...Object.values(S.handover).map(h=>h.text.length)),fail:SAVE_FAIL.app}},kind);
 if(len.n<366||len.max!==3000)bad.push(tag+'申し送り 1 年分が入らない '+JSON.stringify(len));if(len.fail)bad.push(tag+'保存に失敗');
 for(const fs of ['m','xl']){const t2=tag+(fs==='xl'?'特大・':'標準・');
  const r=await p.evaluate(fs=>{S.settings.fscale=fs;applyFScale();const s=performance.now();go('day',{day:TODAY});const ms=performance.now()-s;const sw1=document.documentElement.scrollWidth;go('home');const sw2=document.documentElement.scrollWidth;
   const wide=[...document.querySelectorAll('#app *')].filter(e=>e.getBoundingClientRect().right>392).length;return {ms:Math.round(ms),sw1,sw2,wide}},fs);
  console.log(t2+JSON.stringify(r));if(r.ms>500)bad.push(t2+'日常点検が遅い '+r.ms+'ms');if(r.sw1>392)bad.push(t2+'日常点検で横にはみ出す '+r.sw1);if(r.sw2>392||r.wide)bad.push(t2+'ホームで横にはみ出す '+r.sw2+' 要素'+r.wide)}
 {await p.evaluate(()=>{S.settings.fscale='m';applyFScale();go('dailyRep',{day:addD(TODAY,-1)})});await p.waitForTimeout(400);await p.emulateMedia({media:'print'});
  await p.setViewportSize({width:794,height:1123});const pw=await p.evaluate(()=>{const o=[...document.querySelectorAll('.rep td.obs')].map(e=>e.scrollWidth-e.clientWidth);return {doc:document.documentElement.scrollWidth,td:Math.max(0,...o)}});if(pw.doc>796||pw.td>2)bad.push(tag+'日報の紙の幅からはみ出す '+JSON.stringify(pw));
  const buf=await p.pdf({format:'A4'});const f=path.join(os.tmpdir(),'hob'+process.pid+'.pdf');fs.writeFileSync(f,buf);
  try{const n=+execSync('pdfinfo '+f,{encoding:'utf8'}).match(/Pages:\s+(\d+)/)[1];if(n>5)bad.push(tag+'日報が A4 '+n+' 枚（5 枚まで）');
   const all=execSync('pdftotext -layout '+f+' -',{encoding:'utf8'}).replace(/\s+/g,'');for(const k of kind==='lines'?['申継の最初','申継40行目','申継の最後']:[])if(!all.includes(k))bad.push(tag+'日報の紙に出ない：'+k);
   for(let i=1;i<=n;i++){const t=execSync('pdftotext -f '+i+' -l '+i+' -layout '+f+' -',{encoding:'utf8'});const L=t.split('\n').filter(x=>x.trim()).length;if(L<8)bad.push(tag+'日報の A4 '+i+' 枚目が空に近い（'+L+' 行）')}
   console.log(tag+'日報 A4 '+n+' 枚')}finally{fs.unlinkSync(f)}}
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
