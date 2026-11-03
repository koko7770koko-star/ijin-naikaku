// 棟と階：古い記録（施設・建屋・電気室・盤だけ）がそのまま開き、まとめて作る・重ねない・階で設備を絞れることを確かめる。初回の登録（棟→階の範囲→電気室→盤）を窓1回で足せること（hz-locs-first-setup）。
// usage: node hozen/tools/bldgcheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const old={settings:{name:'確認'},locs:[{id:'l1',name:'本館',type:'施設',parent:'',note:'',pos:{}},{id:'l2',name:'A棟',type:'建屋',parent:'l1',note:'',pos:{}},{id:'l3',name:'1F',type:'階',parent:'l2',note:'',pos:{floor:'1F'}},{id:'l4',name:'第1電気室',type:'電気室',parent:'l2',note:'',pos:{}}],
  equipment:[{id:'e1',code:'T-1',name:'確認設備',locId:'l3',status:'稼働',place:''}]};
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(old)]);await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const n0=await p.evaluate(()=>S.locs.length);if(n0!==4)errs.push('古い記録の場所が変わった '+n0);
 await p.evaluate(()=>go('locs'));await p.waitForTimeout(300);
 await p.evaluate(()=>bldgWizard());await p.waitForTimeout(200);
 // 棟の名前は使う人が入れる（初期値なし）。新しい B棟 と既にある A棟 に、地下1〜地上2階（1F・B1F の書き方）を足す
 if(await p.evaluate(()=>document.querySelector('#bw_names').value!==''))errs.push('棟の名前に初期値が入っている');
 await p.evaluate(()=>{document.querySelector('#bw_names').value='B棟';document.querySelector('[data-ex="l2"]').checked=true;document.querySelector('#bw_dn').value=1;document.querySelector('#bw_up').value=2;document.querySelector('#bw_fmt').value='F'});
 await p.screenshot({path:process.argv[2]||require('path').join(require('os').tmpdir(),'bldgcheck.png')});
 await p.evaluate(()=>applyBldgWizard());await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({A:S.locs.filter(l=>l.parent==='l2'&&l.type==='階').map(l=>l.name).sort(),bn:S.locs.filter(l=>l.type==='建屋').map(l=>l.name),B:(()=>{const b=S.locs.find(l=>l.name==='B棟');return b?S.locs.filter(l=>l.parent===b.id).map(l=>l.name):null})()}));
 if(r.A.join()!=='1F,2F,B1F')errs.push('A棟の階が違う（既にある1Fは重ねない）: '+r.A.join());
 if(r.bn.join()!=='A棟,B棟')errs.push('棟が違う: '+r.bn.join());
 if(!r.B||r.B.slice().sort().join()!=='1F,2F,B1F')errs.push('B棟の階が違う: '+r.B);
 const n1=await p.evaluate(()=>S.locs.length);
 await p.evaluate(()=>{bldgWizard();document.querySelector('#bw_names').value='B棟、A棟';document.querySelector('#bw_dn').value=1;document.querySelector('#bw_up').value=2;document.querySelector('#bw_fmt').value='F';applyBldgWizard()});await p.waitForTimeout(200);
 if((await p.evaluate(()=>S.locs.length))!==n1)errs.push('2回目で重なった');
 const n2=await p.evaluate(()=>{bldgWizard();document.querySelector('#bw_names').value='C棟 D棟';document.querySelector('#bw_dn').value=1;document.querySelector('#bw_up').value=1;document.querySelector('#bw_fmt').value='階';applyBldgWizard();const c=S.locs.find(l=>l.name==='C棟');return {d:!!S.locs.find(l=>l.name==='D棟'),c:c?S.locs.filter(l=>l.parent===c.id).map(l=>l.name).sort().join():''}});
 if(!n2.d||n2.c!=='1階,地下1階')errs.push('空白区切りの棟・「1階」の書き方が違う '+JSON.stringify(n2));
 // 初回の登録を窓1回で（hz-locs-first-setup）：2棟 × 3階 × 電気室1 × 盤2 → 木に出て、盤の点検に 12 面が並ぶ。もう一度押しても重ならない
 const one=async()=>{await p.evaluate(()=>{bldgWizard();document.querySelector('#bw_more').open=true;const f=(id,v)=>{const e=document.querySelector(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};
   f('#bw_names','E棟 F棟');f('#bw_dn','0');f('#bw_up','3');document.querySelector('#bw_fmt').value='階';f('#bw_room','第1電気室');f('#bw_bpre','動力盤-');f('#bw_bn','2')});
   const sum=await p.evaluate(()=>document.querySelector('#bw_sum').textContent);await p.evaluate(()=>applyBldgWizard());await p.waitForTimeout(200);return sum};
 const sum=await one();if(!/棟 2・階 6・電気室 6・盤 12/.test(sum))errs.push('足す数の目安が違う '+sum);
 const g=await p.evaluate(()=>{const E=S.locs.filter(l=>['E棟','F棟'].includes(l.name));return {b:E.length,f:S.locs.filter(l=>l.type==='階'&&E.some(e=>e.id===l.parent)).length,r:E.reduce((n,e)=>n+banBoards(e.id).length,0),
   rooms:S.locs.filter(l=>l.type==='電気室'&&l.name==='第1電気室'&&E.some(e=>locDesc(e.id).has(l.id))).length,names:banBoards(E[0].id).map(x=>x.name).join()}});
 if(g.b!==2||g.f!==6||g.r!==12||g.rooms!==6||g.names!=='動力盤-1,動力盤-2,動力盤-1,動力盤-2,動力盤-1,動力盤-2')errs.push('窓1回の登録が違う '+JSON.stringify(g));
 const n1b=await p.evaluate(()=>S.locs.length);await one();if(await p.evaluate(()=>S.locs.length)!==n1b)errs.push('2回目で重なった（電気室・盤）');
 const banN=await p.evaluate(()=>{V.banB=S.locs.find(l=>l.name==='E棟').id;go('ban');return document.querySelectorAll('.banrow:not(.bh)').length});if(banN!==6)errs.push('盤の点検に E棟の 6面が並ばない '+banN);
 await p.evaluate(()=>{V.eqLoc='l2';go('equip')});await p.waitForTimeout(300);
 if(!(await p.evaluate(()=>document.body.textContent.includes('確認設備'))))errs.push('A棟で絞り込むと階の設備が出ない');
 await p.evaluate(()=>{V.eqLoc=S.locs.find(l=>l.name==='B棟').id;render()});await p.waitForTimeout(200);
 if(await p.evaluate(()=>document.body.textContent.includes('確認設備')))errs.push('B棟で絞り込んでも出る');
 const nS=await p.evaluate(()=>S.locs.length);
 await p.evaluate(()=>{window.__t=Date.now();save()});await p.waitForFunction(()=>(MIRROR_AT.app||0)>=window.__t,null,{timeout:10000});await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const n3=await p.evaluate(()=>S.locs.length);
 if(n3!==nS)errs.push('読み直しで場所の数が変わった '+nS+'→'+n3);
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w);
 console.log(errs.length?'NG\n  '+errs.join('\n  '):'OK 棟と階');await b.close();process.exit(errs.length?1:0)})();
