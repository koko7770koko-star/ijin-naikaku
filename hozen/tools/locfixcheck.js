// 古い形から直す手伝いの確認（勝手には変えない・押したときだけ）：
//  棟→階→盤 の階に「電気室を足して移す」、棟→電気室→盤 の棟に「階を足して移す」が出て、名前を入れると選んだ物の parent だけが新しい段へ付け替わる。
//  既にある電気室へも移せる。移した後も盤の ◯/●（banChk）・設備の結びつき・日常点検など locs 以外の記録は1文字も変わらない（変更の履歴 history・操作の記録 opLog に1件ずつ足すだけ）。元に戻すで元の形に戻る。
//  4段の形には出ない。390px ではみ出さない。
// usage: node hozen/tools/locfixcheck.js [スクリーンショットの出力先フォルダ]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const shot=async n=>{if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,n+'.png')})}};
 const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
 const rest=()=>p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k])=>k!=='locs'&&k!=='history'&&k!=='opLog'))));
 const locs=()=>p.evaluate(()=>JSON.stringify(S.locs));
 // ① 棟→階→盤：1F に盤3面。2面だけ新しい電気室へ
 await p.evaluate(L=>{S.locs=L;S.equipment=[{id:'e1',code:'T-1',name:'確認設備',locId:'x1',status:'稼働',place:'',kind:'',importance:''}];S.banChk={[TODAY.slice(0,7)]:{x1:['済','○',''],x2:['延','','']}};go('locs');locFold(true)},
  [mk('b','A棟','建屋',''),mk('f1','1F','階','b'),mk('x1','盤1','盤','f1'),mk('x2','盤2','盤','f1'),mk('x3','盤3','盤','f1')]);await p.waitForTimeout(200);
 const r0=await rest(),l0=await locs();
 const btn=await p.$$eval('.locfix button',e=>e.map(x=>x.textContent));if(btn.join()!=='電気室を足して移す')bad.push('階に「電気室を足して移す」が出ない '+btn.join());
 if(await p.evaluate(()=>S.locs.length)!==5)bad.push('開いただけで形が変わった');
 await shot('fix1-floor');
 await p.click('.locfix button');await p.waitForSelector('#lf_name');
 if(await p.inputValue('#lf_name'))bad.push('名前に初期値がある');
 await p.fill('#lf_name','第1電気室');await p.uncheck('#lf_list input[value="x3"]');await shot('fix2-modal');await p.click('#modal button:text-is("移す")');await p.waitForTimeout(150);
 const g=await p.evaluate(()=>{const r=S.locs.find(l=>l.name==='第1電気室');return {r:r&&r.type+'/'+r.parent,x1:locById('x1').parent===(r||{}).id,x2:locById('x2').parent===(r||{}).id,x3:locById('x3').parent}});
 if(g.r!=='電気室/f1'||!g.x1||!g.x2||g.x3!=='f1')bad.push('電気室を足して移すが違う '+JSON.stringify(g));
 if(await rest()!==r0)bad.push('locs 以外の記録が変わった（盤の◯/●・設備など）');
 if(await p.evaluate(()=>JSON.stringify(S.banChk[TODAY.slice(0,7)]))!=='{"x1":["済","○",""],"x2":["延","",""]}')bad.push('盤の ◯/● が残らない');
 // 残った盤3 を既にある電気室へ
 await p.click('.locfix button');await p.waitForSelector('#lf_to');const rid=await p.evaluate(()=>S.locs.find(l=>l.name==='第1電気室').id);
 await p.selectOption('#lf_to',rid);await p.click('#modal button:text-is("移す")');await p.waitForTimeout(150);
 if(await p.evaluate(r=>locById('x3').parent===r&&S.locs.length===6,rid)!==true)bad.push('既にある電気室へ移せない');
 if(await p.$('.locfix'))bad.push('直した後も手伝いが出る');
 await shot('fix3-done');
 await p.click('#undobar button');await p.waitForTimeout(150);
 if(await p.evaluate(()=>locById('x3').parent)!=='f1')bad.push('元に戻せない（盤3）');
 // ② 棟→電気室→盤：棟に「階を足して移す」
 await p.evaluate(L=>{S.locs=L;go('locs');locFold(true)},[mk('b','A棟','建屋',''),mk('r','第1電気室','電気室','b'),mk('y1','動力盤','盤','r')]);await p.waitForTimeout(150);
 const l2=await locs();
 const btn2=await p.$$eval('.locfix button',e=>e.map(x=>x.textContent));if(btn2.join()!=='階を足して移す')bad.push('棟に「階を足して移す」が出ない '+btn2.join());
 await p.click('.locfix button');await p.waitForSelector('#lf_name');await p.fill('#lf_name','1階');await p.click('#modal button:text-is("移す")');await p.waitForTimeout(150);
 const g2=await p.evaluate(()=>{const f=S.locs.find(l=>l.name==='1階');return {f:f&&f.type+'/'+f.parent,r:locById('r').parent===(f||{}).id,y:locById('y1').parent}});
 if(g2.f!=='階/b'||!g2.r||g2.y!=='r')bad.push('階を足して移すが違う '+JSON.stringify(g2));
 await p.click('#undobar button');await p.waitForTimeout(150);
 if(await locs()!==l2)bad.push('元に戻すで元の形に戻らない');
 // ③ 4段の形には出ない
 await p.evaluate(L=>{S.locs=L;go('locs');locFold(true)},[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('z','動力盤','盤','r')]);await p.waitForTimeout(150);
 if(await p.$('.locfix'))bad.push('4段の形に手伝いが出る');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
