// 設定の復元：設備 1000・異常 2000・測定 5000・修正履歴 3 万件（古い分は端末内の別の保管場所へ移る）のバックアップを空の端末に戻すとき、
// 戻す前の確かめ（件数の表・差分の表）が 2 秒以内に出て設備・異常・測定の数が正しく、戻した後のホームが 1 秒以内に出て、
// 件数がそろい、読み直しても保管分を含めた修正履歴が 3 万件のままか（hz-v-backup-restore-time）。backupmanytimecheck と重ならない所。
// （設備 2000・異常 5000・測定 2 万は、読み込みで項目を補うと約 920 万字になり、元の端末でも保存の上限（約 520 万字）を超えるので、上限の内に収まる数にした）
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/backuprestoretimecheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const errs=[];const NH=30000;
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 const mk=async()=>{const c=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await c.newPage();p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});return p};
 const p=await mk();
 await p.evaluate(NH=>{const T=TODAY;
  S.equipment=[...Array(1000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',installed:'2005-04',life:20,photos:[],docs:[],health:[],repairs:[]}));
  S.issues=[...Array(2000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%700)),equipId:'e'+(i%1000),title:'異常'+i,status:i%3?'完了':'対応中',urgency:'中',closed:i%3?addD(T,-(i%700)):'',photos:[],log:[]}));
  S.meas=[...Array(5000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%700)),equipId:'e'+(i%1000),type:'絶縁抵抗',name:'測定',rows:[{name:'R',v:String(i%50),min:'5',max:'',unit:'MΩ'}]}));
  S.history=[];for(let i=0;i<NH;i++)S.history.push({at:new Date(Date.now()-(NH-i)*60000).toISOString(),type:'task',ref:'tk'+(i%500),field:'状態',from:'予定'+i,to:'完了'+i,by:'確認者'});
  save();trimHistory()},NH);
 await p.waitForFunction(()=>S.history.length<=3000&&(S.histArcKeys||[]).length>0,null,{timeout:30000}).catch(()=>bad.push('古い修正履歴が保管に移らない'));
 // 開き直して、読み込みの補い（足りない項目の初期値）を通した形にそろえる。元の端末で保存できていることも確かめる
 await p.reload();await p.waitForFunction(READY,null,{timeout:20000});await p.evaluate(()=>save());
 const srcSize=await p.evaluate(()=>({len:JSON.stringify(S).length,fail:SAVE_FAIL.app}));console.log('元の端末の記録 '+srcSize.len+' 字'+(srcSize.fail?'（保存できていない）':''));
 if(srcSize.fail)bad.push('元の端末で保存できていない（試しの記録が大きすぎる）');
 const src=await p.evaluate(async()=>({t:S.tasks.length,e:S.equipment.length,i:S.issues.length,m:S.meas.length,h:(await allHistory()).length,body:S.history.length}));
 if(src.h!==NH)bad.push('書き出す前の修正履歴が '+src.h+' 件（'+NH+' のはず）');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'brt-'));const file=path.join(tmp,'big.json');
 const t0=Date.now();const txt=await p.evaluate(async()=>{const r=await buildBackup();return await r.blob.text()});const msB=Date.now()-t0;fs.writeFileSync(file,txt);
 // 空の端末に戻す
 const q=await mk();await q.evaluate(()=>go('set'));await q.waitForTimeout(300);
 const t1=Date.now();await q.setInputFiles('input[onchange^="restore("]',file,{timeout:5000});
 await q.waitForFunction(()=>/復元の確認|復元できません/.test(document.body.innerText),null,{timeout:30000}).catch(()=>bad.push('戻す前の確かめが出ない'));const msC=Date.now()-t1;
 const tbl=await q.evaluate(()=>{const R={};document.querySelectorAll('#modal table tr').forEach(tr=>{const td=[...tr.querySelectorAll('td,th')].map(x=>x.textContent.trim());if(td.length>=3&&!(td[0] in R))R[td[0]]=td[2]});return R});
 const shown={e:+tbl['設備'],i:+tbl['異常案件'],m:+tbl['測定記録']};
 if(shown.e!==src.e||shown.i!==src.i||shown.m!==src.m)bad.push('件数の表が違う '+JSON.stringify(shown)+' / '+JSON.stringify(src));
 if(msC>2000)bad.push('戻す前の確かめが遅い '+msC+'ms');
 const t2=Date.now();await q.evaluate(()=>applyRestore());
 await q.waitForFunction(n=>S.meas&&S.meas.length===n,src.m,{timeout:30000}).catch(async()=>bad.push('戻しが終わらない：'+(await q.evaluate(()=>(document.querySelector('#modal')||{}).innerText||'')).slice(0,300)));const msR=Date.now()-t2;
 await q.waitForTimeout(500);
 const msH=await q.evaluate(()=>new Promise(r=>{const s=performance.now();go('home');requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now()-s)))}));
 if(msH>1000)bad.push('戻した後のホームが遅い '+Math.round(msH)+'ms');
 const dst=await q.evaluate(async()=>({t:S.tasks.length,e:S.equipment.length,i:S.issues.length,m:S.meas.length,h:(await allHistory()).length,body:S.history.length}));
 for(const k of ['t','e','i','m'])if(dst[k]!==src[k])bad.push('戻した後の件数が違う '+k+' '+dst[k]+'/'+src[k]);
 if(dst.h!==NH)bad.push('戻した後の修正履歴が '+dst.h+' 件（'+NH+'）');
 if(await q.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('戻した後のホームが横にはみ出す');
 await q.reload();await q.waitForFunction(READY,null,{timeout:20000});
 const h2=await q.evaluate(async()=>({h:(await allHistory()).length,m:S.meas.length}));
 if(h2.h!==NH||h2.m!==src.m)bad.push('読み直すと件数が違う '+JSON.stringify(h2));
 console.log('書き出し '+msB+'ms（'+txt.length+' 字）・確かめの表 '+msC+'ms・戻し '+msR+'ms・ホーム '+Math.round(msH)+'ms・修正履歴 本体 '+dst.body+'＋保管 '+(dst.h-dst.body));
 console.log([...errs,...bad].slice(0,15).join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
