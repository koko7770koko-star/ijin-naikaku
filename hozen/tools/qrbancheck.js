// 盤の QR ラベル（hz-qr-ban）：場所の「⋯」から盤の QR（内容は「BAN:内部ID」だけ）→ ラベル印刷へ、電気室の「⋯」から中の盤のラベルをまとめて、
//  QR の画面は 設備／盤 を切り替え。読むと（qrOpen）盤の点検のその棟・その盤が光る（畳んだ階でも開く）。知らない id は案内だけ。設備の QR は今までどおり。
//  印刷でラベルが出る。記録は変わらない。390px・44px。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('a','A棟','建屋',''),mk('b','B棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r'),mk('fa','1階','階','a'),mk('ra','第1電気室','電気室','fa'),mk('z','電灯盤-1','盤','ra')];
  S.equipment=[{id:'e1',code:'E-1',name:'変圧器',kind:'',status:'稼働',locId:'x',place:'',importance:''}];
  S.banChk={[TODAY.slice(0,7)]:{x:['済','済','済'],y:['済','済','済']}};go('locs');locFold(true);return JSON.stringify({l:S.locs,c:S.banChk,e:S.equipment})});await p.waitForTimeout(150);
 await p.click('[aria-label="動力盤-1の操作"]');await p.click('#modal button:has-text("この盤のQRラベル")');await p.waitForSelector('#modal svg');
 if(!/BAN:x/.test(await p.evaluate(()=>$('#modal').innerText)))bad.push('盤の QR の内容が BAN:内部ID でない');
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'qrban1.png')})}
 await p.click('#modal button:has-text("ラベル印刷へ")');await p.waitForTimeout(200);
 let q=await p.evaluate(()=>({v:V.view,n:document.querySelectorAll('.qrl[data-ban]').length,t:document.querySelector('.qrl[data-ban]')?.innerText||''}));
 if(q.v!=='qr'||q.n!==1||!/動力盤-1/.test(q.t))bad.push('ラベル印刷へで盤のラベル1枚にならない '+JSON.stringify(q));
 await p.evaluate(()=>{V.qrAll=false;go('locs');locFold(true)});await p.waitForTimeout(100);
 await p.click('[aria-label="第1電気室の操作"] >> nth=0');await p.click('#modal button:has-text("中の盤のQRラベル")');await p.waitForTimeout(200);
 q=await p.evaluate(()=>document.querySelectorAll('.qrl[data-ban]').length);if(q!==1&&q!==2)bad.push('電気室の中の盤のラベルが違う '+q);
 // 切り替え（場所の絞り込みは切り替えても残るので、ここでは外してから）
 await p.evaluate(()=>{V.qrLoc='';render()});await p.click('.seg button:has-text("設備")');await p.waitForTimeout(100);if(await p.evaluate(()=>document.querySelectorAll('.qrl[data-ban]').length)||!(await p.$('.qrl')))bad.push('設備に切り替わらない');
 await p.click('.seg button:has-text("盤")');await p.waitForTimeout(100);if(await p.evaluate(()=>document.querySelectorAll('.qrl[data-ban]').length)!==3)bad.push('盤に切り替えて全部（3枚）出ない');
 const small=await p.evaluate(()=>[...document.querySelectorAll('#app .card button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44}).length);if(small)bad.push('44px 未満 '+small);
 // 印刷にラベルが出る
 await p.emulateMedia({media:'print'});const pv=await p.evaluate(()=>[...document.querySelectorAll('.qrl[data-ban]')].filter(e=>getComputedStyle(e).display!=='none').length);await p.emulateMedia({media:'screen'});if(pv!==3)bad.push('印刷でラベルが出ない '+pv);
 // 読む：B棟の 動力盤-2（全部済みの階 → 畳まれている）へ
 await p.evaluate(()=>{V.banB='a';qrOpen('BAN:y')});await p.waitForTimeout(300);
 const g=await p.evaluate(()=>({v:V.view,b:V.banB,f:document.querySelector('.banrow.flash')?.id||''}));if(g.v!=='ban'||g.b!=='b'||g.f!=='ban-y')bad.push('読むと盤の点検のその盤へ行かない '+JSON.stringify(g));
 await p.evaluate(()=>qrOpen('BAN:nothing'));await p.waitForTimeout(100);if(await p.evaluate(()=>V.view)!=='ban')bad.push('知らない id で画面が変わった');
 await p.evaluate(()=>qrOpen('EQ:E-1'));await p.waitForTimeout(150);if(await p.evaluate(()=>V.view+':'+V.eq)!=='equipDetail:e1')bad.push('設備の QR が今までどおり開かない');
 if(await p.evaluate(()=>JSON.stringify({l:S.locs,c:S.banChk,e:S.equipment}))!==before)bad.push('記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
