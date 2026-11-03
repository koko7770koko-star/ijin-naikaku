// 盤の点検表から異常を記録する確認：⚠ を押すと項目（盤内 発熱・端子および碍子・その他異常）を選ぶ窓が出て、
//  選ぶと題「盤の異常：動力盤-1（端子および碍子）」・場所「A棟 › 1階 › 第1電気室 › 動力盤-1」・その盤の設備（1台だけのとき）が入った異常の記録が開く。
//  保存すると ⚠ が赤くなり（対応中の件数）、次に ⚠ を押すとその異常へ行ける。完了にすると戻る。issues の形と盤の印は変えない。390px・44px。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
 await p.evaluate(L=>{S.locs=L;S.issues=[];S.equipment=[{id:'e1',code:'P-1',name:'動力盤本体',locId:'x',status:'稼働',place:'',kind:'',importance:''}];S.banChk={[TODAY.slice(0,7)]:{x:['済','','']}};V.banB='b';go('ban')},
  [mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r')]);await p.waitForTimeout(200);
 const chk0=await p.evaluate(()=>JSON.stringify(S.banChk));
 await p.click('[aria-label="動力盤-1の異常を記録"]');await p.waitForSelector('#modal button:has-text("端子および碍子")');
 const small=await p.evaluate(()=>[...document.querySelectorAll('#modal button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44}).length);if(small)bad.push('窓のボタンが44px未満 '+small);
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'iss1-pick.png')})}
 await p.click('#modal button:has-text("端子および碍子")');await p.waitForSelector('#is_title');await p.waitForTimeout(200);
 const f=await p.evaluate(()=>({t:$('#is_title').value,pl:$('#is_place').value,eq:($('#is_equip')||{}).value}));
 if(f.t!=='盤の異常：動力盤-1（端子および碍子）')bad.push('題が入らない '+f.t);
 if(f.pl!=='A棟 › 1階 › 第1電気室 › 動力盤-1')bad.push('場所が4段で入らない '+f.pl);
 if(f.eq!=='e1')bad.push('盤の設備が入らない '+f.eq);
 await p.click('#modal button:text-is("保存")');await p.waitForTimeout(250);
 if(await p.evaluate(()=>S.issues.length)!==1)bad.push('異常が保存されない');
 await p.evaluate(()=>{closeModal(true);go('ban')});await p.waitForTimeout(150);
 const cls=await p.evaluate(()=>({x:document.querySelector('[aria-label^="動力盤-1の異常を記録"]').className,y:document.querySelector('[aria-label^="動力盤-2の異常を記録"]').className}));
 if(!/mk-iss/.test(cls.x)||/mk-iss/.test(cls.y))bad.push('対応中の異常のある盤だけ ⚠ が赤くならない '+JSON.stringify(cls));
 if(OUT)await p.screenshot({path:path.join(OUT,'iss2-red.png')});
 await p.click('[aria-label^="動力盤-1の異常を記録"]');await p.waitForSelector('#modal .al');
 if(!/対応中の異常 1件/.test(await p.evaluate(()=>$('#modal').innerText)))bad.push('対応中の異常が窓に出ない');
 await p.evaluate(()=>{closeModal(true);S.issues[0].status='完了';render()});await p.waitForTimeout(100);
 if(/mk-iss/.test(await p.evaluate(()=>document.querySelector('[aria-label^="動力盤-1の異常を記録"]').className)))bad.push('完了にしても赤いまま');
 if(await p.evaluate(()=>JSON.stringify(S.banChk))!==chk0)bad.push('盤の印が変わった');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
