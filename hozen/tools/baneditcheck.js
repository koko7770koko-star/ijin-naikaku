// 盤の点検表の中で盤を直す確認：「✎ 盤の名前・並びを直す」を押すと、盤の行が 名前の入力・↑・↓ に変わり、
//  名前をその場で変えられる（空・同じ名前は戻す）・同じ電気室の中で順番を変えられる（ord）・電気室ごとに「＋盤を足す」。
//  点検の印（banChk）は1文字も変わらない。直し終えると ◯/● の表に戻り、新しい順番で並ぶ。390px ではみ出さない・ボタン44px。
// usage: node hozen/tools/baneditcheck.js [スクリーンショットの出力先フォルダ]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
 await p.evaluate(L=>{S.locs=L;S.banChk={[TODAY.slice(0,7)]:{p1:['済','○',''],p3:['延','','']}};V.banB='b';go('ban')},
  [mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('r2','第2電気室','電気室','f'),mk('p1','動力盤-1','盤','r'),mk('p2','動力盤-2','盤','r'),mk('p3','動力盤-3','盤','r')]);await p.waitForTimeout(200);
 const chk0=await p.evaluate(()=>JSON.stringify(S.banChk));
 await p.click('button:has-text("盤の名前・並びを直す")');await p.waitForTimeout(150);
 if(await p.$('.banrow .bm'))bad.push('直すときに ◯/● のボタンが残る');
 const small=await p.evaluate(()=>[...document.querySelectorAll('#app button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<44||r.height<44)}).length);if(small)bad.push('44px 未満のボタン '+small);
 // 名前をその場で変える
 await p.fill('[aria-label="動力盤-2の名前"]','電灯盤-1');await p.press('[aria-label="動力盤-2の名前"]','Enter');await p.waitForTimeout(150);
 if(await p.evaluate(()=>locById('p2').name)!=='電灯盤-1')bad.push('名前を変えられない');
 await p.fill('[aria-label="動力盤-1の名前"]','動力盤-3');await p.press('[aria-label="動力盤-1の名前"]','Enter');await p.waitForTimeout(150);
 if(await p.evaluate(()=>locById('p1').name)!=='動力盤-1')bad.push('同じ名前を許した');
 await p.fill('[aria-label="動力盤-1の名前"]','');await p.press('[aria-label="動力盤-1の名前"]','Enter');await p.waitForTimeout(150);
 if(await p.evaluate(()=>locById('p1').name)!=='動力盤-1')bad.push('空の名前を許した');
 // 並べ替え：動力盤-3 を一番上へ
 const ord=()=>p.evaluate(()=>locKids('r').map(l=>l.id).join());const o0=(await ord()).split(',');
 const last=await p.evaluate(i=>locById(i).name,o0[2]);
 await p.click(`[aria-label="${last}を上へ"]`);await p.waitForTimeout(100);await p.click(`[aria-label="${last}を上へ"]`);await p.waitForTimeout(100);
 if(await ord()!==[o0[2],o0[0],o0[1]].join())bad.push('並べ替えが違う '+(await ord()));
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'banedit1.png')})}
 // 盤の無い電気室にも「＋盤を足す」
 if(!(await p.$('button:has-text("第2電気室に盤を足す")')))bad.push('電気室ごとの「＋盤を足す」が無い');
 if(await p.evaluate(()=>JSON.stringify(S.banChk))!==chk0)bad.push('点検の印が変わった');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 // 直し終える → 新しい順番で ◯/● の表
 await p.click('button:has-text("直し終える")');await p.waitForTimeout(150);
 const rows=await p.evaluate(()=>[...document.querySelectorAll('[data-room="r"] .banrow:not(.bh)')].map(e=>e.id.slice(4)).join());
 if(rows!==[o0[2],o0[0],o0[1]].join())bad.push('点検表が新しい順番で並ばない '+rows);
 if(!(await p.$('.banrow .bm')))bad.push('直し終えても ◯/● に戻らない');
 // 保存して読み直しても順番が残る
 await p.evaluate(()=>{window.__t=Date.now();save()});await p.waitForFunction(()=>(MIRROR_AT.app||0)>=window.__t,null,{timeout:10000});await p.reload();
 await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 if(await ord()!==[o0[2],o0[0],o0[1]].join())bad.push('読み直すと順番が変わる');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
