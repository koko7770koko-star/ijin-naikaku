// 棟と階：古い記録（施設・建屋・電気室・盤だけ）がそのまま開き、まとめて作る・重ねない・階で設備を絞れることを確かめる。
// usage: node hozen/tools/bldgcheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const old={settings:{name:'確認'},locs:[{id:'l1',name:'本館',type:'施設',parent:'',note:'',pos:{}},{id:'l2',name:'A棟',type:'建屋',parent:'l1',note:'',pos:{}},{id:'l3',name:'1F',type:'階',parent:'l2',note:'',pos:{floor:'1F'}},{id:'l4',name:'第1電気室',type:'電気室',parent:'l2',note:'',pos:{}}],
  equipment:[{id:'e1',code:'T-1',name:'確認設備',locId:'l3',status:'稼働',place:''}]};
 await p.addInitScript(([k,v])=>{if(sessionStorage.getItem('__bc'))return;sessionStorage.setItem('__bc','1');localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(old)]);
 await p.goto('file://'+FILE);await p.waitForTimeout(2000);
 const n0=await p.evaluate(()=>S.locs.length);if(n0!==4)errs.push('古い記録の場所が変わった '+n0);
 await p.evaluate(()=>go('locs'));await p.waitForTimeout(300);
 await p.evaluate(()=>bldgWizard());await p.waitForTimeout(200);
 await p.evaluate(()=>{document.querySelector('[data-n="B"]').checked=true;document.querySelector('[data-dn="A"]').value=1;document.querySelector('[data-up="B"]').value=2});
 await p.screenshot({path:process.argv[2]||'/dev/null'});
 await p.evaluate(()=>applyBldgWizard());await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({A:S.locs.filter(l=>l.parent==='l2'&&l.type==='階').map(l=>l.name).sort(),bn:S.locs.filter(l=>l.type==='建屋').map(l=>l.name),B:(()=>{const b=S.locs.find(l=>l.name==='B棟');return b?S.locs.filter(l=>l.parent===b.id).map(l=>l.name):null})()}));
 if(r.A.join()!=='1F,2F,3F,B1F')errs.push('A棟の階が違う（既にある1Fは重ねない）: '+r.A.join());
 if(r.bn.join()!=='A棟,B棟')errs.push('棟が違う: '+r.bn.join());
 if(!r.B||r.B.join()!=='1F,2F')errs.push('B棟の階が違う: '+r.B);
 const n1=await p.evaluate(()=>S.locs.length);
 await p.evaluate(()=>{bldgWizard();document.querySelector('[data-n="B"]').checked=true;document.querySelector('[data-dn="A"]').value=1;document.querySelector('[data-up="B"]').value=2;applyBldgWizard()});await p.waitForTimeout(200);
 if((await p.evaluate(()=>S.locs.length))!==n1)errs.push('2回目で重なった');
 await p.evaluate(()=>{V.eqLoc='l2';go('equip')});await p.waitForTimeout(300);
 if(!(await p.evaluate(()=>document.body.textContent.includes('確認設備'))))errs.push('A棟で絞り込むと階の設備が出ない');
 await p.evaluate(()=>{V.eqLoc=S.locs.find(l=>l.name==='B棟').id;render()});await p.waitForTimeout(200);
 if(await p.evaluate(()=>document.body.textContent.includes('確認設備')))errs.push('B棟で絞り込んでも出る');
 await p.reload();await p.waitForTimeout(1500);
 if((await p.evaluate(()=>S.locs.length))!==n1)errs.push('読み直しで場所の数が変わった');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w);
 console.log(errs.length?'NG\n  '+errs.join('\n  '):'OK 棟と階');await b.close();process.exit(errs.length?1:0)})();
