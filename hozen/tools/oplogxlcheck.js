// 操作ログの窓：文字「大」「特大」・360px で、①ボタンが 44px 以上②日時と中身が割れて切れない③閉じる・CSV が窓の中に見える④横にはみ出さない を見る。
// usage: node hozen/tools/oplogxlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();
  S.opLog=[];for(let i=1;i<=40;i++)S.opLog.push({at:new Date(2026,10,1,8,i).toISOString(),op:'バックアップの復元（全部）'+i,detail:'設備1〜設備'+i+'・点検の記録・測定の記録・不具合の記録をまとめて戻しました（長い中身の例 長長長長長長長長長長長長長長長長長長長長）',by:'職員'+i});
  showOpLog()},fs);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const m=document.querySelector('.modal,#modal,.sheet')||document.body;const small=[],ov=[];const M=document.querySelector('.modal-bd,.modal,#modal')||document.body;const MR=M.getBoundingClientRect();
  document.querySelectorAll('.btn').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(q.height<43.5)small.push((e.textContent.trim()).slice(0,8)+' '+Math.round(q.height))});
  document.querySelectorAll('.item .meta,.item .ti').forEach(e=>{const q=e.getBoundingClientRect();if(q.width&&(q.right>innerWidth+1||q.left<-1))ov.push(e.textContent.trim().slice(0,12))});
  const foot=[...document.querySelectorAll('.btn')].filter(e=>/閉じる|CSV/.test(e.textContent));const fv=foot.map(e=>{const q=e.getBoundingClientRect();return q.bottom<=innerHeight+1&&q.top>=0&&q.right<=innerWidth+1});
  return {small:[...new Set(small)],ov:[...new Set(ov)],foot:fv,n:document.querySelectorAll('.item').length,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 if(!r.n)errs.push(tag+'：ログの行が無い');
 if(r.small.length)errs.push(tag+'：44px 未満 '+r.small.join(' | '));
 if(r.ov.length)errs.push(tag+'：文字が画面の外へ '+r.ov.slice(0,3).join(' | '));
 if(r.foot.length<2||r.foot.some(x=>!x))errs.push(tag+'：閉じる・CSV が窓の中に見えない '+JSON.stringify(r.foot));
 if(r.sw>r.cw+1)errs.push(tag+'：横にはみ出す '+r.sw+'>'+r.cw);
 if(shot)await p.screenshot({path:shot+'-'+w+fs+'.png'});
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
