// 設備の場所：棟 6・階 10・電気室 5・盤 10（約 3400 か所）と設備 500 台で、⋯の窓（棟・盤）・別の親へ移す・上へ・消す（中に物があるとき確かめ）・
// 盤を数でまとめて足す・棟と階をまとめて足す が、それぞれ 1 秒以内で、記録が正しく移る（中の物も一緒・設備は場所未設定に・元に戻す）か。390px（hz-v-locs-move-many）。
// 保存の形は変えない。usage: node hozen/tools/locsmovemanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=1000;
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.equipment=[...Array(500)].map((_,i)=>({id:'leq'+i,code:'L'+i,name:'設備'+i,kind:'変圧器',locId:L[(i*7)%L.length].id,status:'稼働',importance:'',repairs:[]}));save();go('locs')});
 await p.waitForTimeout(300);
 const n0=await p.evaluate(()=>S.locs.length);const tm={};
 const T=async(k,fn,arg)=>{const s=Date.now();await p.evaluate(fn,arg);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));tm[k]=Date.now()-s};
 await T('menuBan',()=>locMenu('lb1f2r3p4'));
 const cand=await p.evaluate(()=>document.querySelectorAll('#lm_parent option').length);if(cand<300)bad.push('盤の移す先の数 '+cand);
 await p.evaluate(()=>closeModal(true));
 await T('menuBldg',()=>locMenu('lb0'));await p.evaluate(()=>closeModal(true));
 // 電気室を別の棟の直下へ移す（中の盤 10 も一緒）
 await T('move',()=>{locMenu('lb0f1r1');locMoveTo('lb0f1r1','lb5')});
 let r=await p.evaluate(()=>({par:locById('lb0f1r1').parent,kids:S.locs.filter(l=>l.parent==='lb0f1r1').length,path:locPath('lb0f1r1p3')}));
 if(r.par!=='lb5'||r.kids!==10||!/^F棟 › 第1電気室 › 盤3$/.test(r.path))bad.push('移した結果 '+JSON.stringify(r));
 // 同じ名前のある所へは移せない（記録は変わらない）
 await p.evaluate(()=>locMoveTo('lb0f1r2','lb5f10'));if(await p.evaluate(()=>locById('lb0f1r2').parent)!=='lb0f1')bad.push('同じ名前の所へ移せてしまう');
 // 上へ
 await T('shift',()=>locShift('lb2f3r5',-1));
 r=await p.evaluate(()=>locKids('lb2f3').map(l=>l.name).join(','));if(r!=='第1電気室,第2電気室,第3電気室,第5電気室,第4電気室')bad.push('上へ '+r);
 // 消す（階：電気室 5・盤 50、中の設備は場所未設定に）→ 元に戻す
 const eqIn=await p.evaluate(()=>{const ids=locDesc('lb3f4');return S.equipment.filter(e=>ids.has(e.locId)).map(e=>e.id)});
 await T('del',()=>delLoc('lb3f4'));
 r=await p.evaluate(ids=>({n:S.locs.length,gone:!locById('lb3f4')&&!locById('lb3f4r2p7'),eq:ids.every(id=>S.equipment.find(e=>e.id===id).locId==='')}),eqIn);
 if(r.n!==n0-56||!r.gone||!r.eq)bad.push('消した結果 '+JSON.stringify(r)+'（設備 '+eqIn.length+'台）');
 await T('undo',()=>document.querySelector('#undobar button').click());
 r=await p.evaluate(ids=>({n:S.locs.length,back:!!locById('lb3f4r2p7'),eq:ids.every(id=>S.equipment.find(e=>e.id===id).locId)}),eqIn);if(r.n!==n0||!r.back||!r.eq)bad.push('元に戻す '+JSON.stringify(r));
 // 盤を数でまとめて足す（60 面）
 await p.evaluate(()=>locAdd('lb4f5r5'));await p.waitForTimeout(100);
 const hasMany=await p.$('#la_pre');if(!hasMany)bad.push('盤をまとめて足す欄が無い');else{
  await p.evaluate(()=>{$('#la_pre').value='分電盤-';$('#la_n').value='60';const t=$('#la_type');if(t)t.value='盤'});
  await T('addMany',()=>locAddMany('lb4f5r5'));r=await p.evaluate(()=>locKids('lb4f5r5').length);if(r!==70)bad.push('まとめて足した数 '+r)}
 // 棟と階をまとめて足す（2 棟 × 地下1〜地上20 階、電気室 1・盤 10）
 await p.evaluate(()=>bldgWizard());await p.waitForTimeout(100);
 await p.evaluate(()=>{$('#bw_names').value='G棟 H棟';$('#bw_dn').value='1';$('#bw_up').value='20';$('#bw_room').value='第1電気室';$('#bw_bpre').value='盤-';$('#bw_bn').value='10'});
 const nb=await p.evaluate(()=>S.locs.length);await T('wizard',()=>applyBldgWizard());
 r=await p.evaluate(()=>S.locs.length);if(r-nb!==2+2*21+2*21+2*21*10)bad.push('棟と階をまとめて足した数 '+(r-nb));
 for(const k in tm)if(tm[k]>LIM)bad.push(k+' '+tm[k]+'ms');
 await p.waitForTimeout(400);const sv=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return {n:o.locs.length,k:Object.keys(o.locs[0]).sort().join(',')}});
 if(sv.n!==await p.evaluate(()=>S.locs.length))bad.push('保存されない '+sv.n);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log('場所 '+n0+'・'+JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
