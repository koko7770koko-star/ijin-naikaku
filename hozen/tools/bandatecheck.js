// ● を付けた日（hz-ban-done-date）：S.banAt[年月][盤id]='YYYY-MM-DD'。
//  banAt の無い古い記録がそのまま開き {} で補われる・● にすると今日の日が入り、盤の名前の下に「● 11/3」・● を全部外すと消える・
//  「この電気室を全部 ●」でも入る・月報 6の3 に（11/3）・保存して読み直すと残る・壊れた値（形が違う・日付でない）は読み込みで捨てる。banChk の形・SCHEMA は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const ready=()=>p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.goto('file://'+FILE);await ready();
 const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
 const old={settings:{name:'確認'},locs:[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r')],banChk:{}};
 await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(old)]);await p.reload();await ready();
 if(await p.evaluate(()=>JSON.stringify(S.banAt))!=='{}')bad.push('古い記録で banAt が {} で補われない');
 if(await p.evaluate(()=>S.schema)!==3&&await p.evaluate(()=>S.schema)!==undefined)bad.push('SCHEMA が変わった');
 await p.evaluate(()=>{V.banB='b';V.banYm=TODAY.slice(0,7);go('ban')});await p.waitForTimeout(150);
 const at=()=>p.evaluate(()=>JSON.stringify(S.banAt));const today=await p.evaluate(()=>TODAY),ym=today.slice(0,7);
 const cell=p.locator('[aria-label="動力盤-1 盤内 発熱"]');
 await cell.click();await cell.click();await p.waitForTimeout(80);
 if(await at()!==JSON.stringify({[ym]:{x:today}}))bad.push('● で今日の日が入らない '+(await at()));
 const md=await p.evaluate(()=>md(TODAY));if(!(await p.evaluate(()=>document.querySelector('#ban-x .bn').innerText)).includes('● '+md))bad.push('盤の名前の下に ● の日が出ない');
 await cell.click();await p.waitForTimeout(80);if(await at()!=='{}')bad.push('● を外しても日が消えない '+(await at()));
 await p.click('[data-room="r"] button:has-text("この電気室を全部 ●")');await p.click('#modal button:has-text("● にする")');await p.waitForTimeout(120);
 if(await at()!==JSON.stringify({[ym]:{x:today,y:today}}))bad.push('全部 ● で日が入らない '+(await at()));
 const rep=await p.evaluate(()=>{const d=new Date();V.ry=d.getFullYear();V.rm=d.getMonth()+1;go('report');const t=[...document.querySelectorAll('.sec')].find(x=>/6の3/.test(x.textContent));return t?t.nextElementSibling.innerText:''});
 if(!rep.includes('動力盤-1 （'+md+'）'))bad.push('月報 6の3 に日が出ない');
 await p.evaluate(()=>{window.__t=Date.now();save()});await p.waitForFunction(()=>(MIRROR_AT.app||0)>=window.__t,null,{timeout:10000});await p.reload();await ready();
 if(await at()!==JSON.stringify({[ym]:{x:today,y:today}}))bad.push('読み直すと日が消える');
 // 壊れた値は捨てる（形・日付）
 const v=await p.evaluate(ym=>{const r=validateData({settings:{},banAt:{'abc':{x:'2026-11-01'},[ym]:{x:'2026-11-01',y:'あいう',z:5},'2026-10':'x'}});return JSON.stringify(r.data.banAt)},ym);
 if(v!==JSON.stringify({[ym]:{x:'2026-11-01'}}))bad.push('壊れた banAt を捨てない '+v);
 const shape=await p.evaluate(()=>Object.values(S.banChk).every(m=>Object.values(m).every(a=>Array.isArray(a)&&a.length===3)));if(!shape)bad.push('banChk の形が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
