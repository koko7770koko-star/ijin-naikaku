// 盤の点検：先月と同じ盤に ◯ を置く（hz-ban-plan-copy）。
//  今月の盤が全部空のときだけ「📋 先月と同じ盤に ◯ を置く（2面）」が出る → 確かめの窓（やめると変わらない）→ 先月 ◯ か ● だった項目が今月 ◯ になる
//  （● は写さない・延期は写さない・先月空の項目は空のまま）→ 元に戻すで今月が空に戻る。今月に印が1つでもあれば出ない。390px・44px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const ym=await p.evaluate(()=>TODAY.slice(0,7)),pv=await p.evaluate(ym=>banPrevYm(ym),ym);
 await p.evaluate(([ym,pv])=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r'),mk('z','動力盤-3','盤','r')];
  S.banChk={[pv]:{x:['済','済','済'],y:['○','','延'],z:['','','']}};V.banB='b';V.banYm=ym;go('ban')},[ym,pv]);await p.waitForTimeout(200);
 const btn=()=>p.evaluate(()=>{const e=[...document.querySelectorAll('#app button')].find(x=>/先月と同じ盤に ◯ を置く/.test(x.textContent));return e?e.textContent:''});
 if(!/2面/.test(await btn()))bad.push('今月が空なのにボタンが出ない／面の数が違う '+(await btn()));
 await p.click('button:has-text("先月と同じ盤に ◯ を置く")');await p.waitForSelector('#modal button:has-text("やめる")');
 if(!/2面・4項目/.test(await p.evaluate(()=>$('#modal').innerText)))bad.push('確かめに面と項目の数が出ない');
 await p.click('#modal button:has-text("やめる")');await p.waitForTimeout(100);if(await p.evaluate(ym=>!!S.banChk[ym],ym))bad.push('やめても変わった');
 await p.click('button:has-text("先月と同じ盤に ◯ を置く")');await p.click('#modal button:has-text("面に ◯ を置く")');await p.waitForTimeout(150);
 const cur=await p.evaluate(ym=>JSON.stringify(S.banChk[ym]),ym);if(cur!=='{"x":["○","○","○"],"y":["○","",""]}')bad.push('写した印が違う '+cur);
 if(await p.evaluate(pv=>JSON.stringify(S.banChk[pv]),pv)!=='{"x":["済","済","済"],"y":["○","","延"],"z":["","",""]}')bad.push('先月の記録が変わった');
 if(await btn())bad.push('今月に印があるのにボタンが出る');
 await p.click('#undobar button');await p.waitForTimeout(150);if(await p.evaluate(ym=>S.banChk[ym]!==undefined,ym))bad.push('元に戻すで今月が空に戻らない');
 const small=await p.evaluate(()=>[...document.querySelectorAll('#app button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44}).length);if(small)bad.push('44px 未満 '+small);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
