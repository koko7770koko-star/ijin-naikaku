// 盤の点検：月が変わったとき（今日 2027/1/1、年もまたぐ）新しい月の盤はまだ（◯ のまま・● なし）、ホームの「あと n 面（全 m 面）」も新しい月で数え、
// 「先月のやり残し」は 12 月に ◯ のまま・空だった盤だけを数え、押すと 12 月へ行って 12 月の ● はそのまま残っているか。記録は変えない（hz-v-ban-monthturn）。
// usage: node hozen/tools/banmonthturncheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.clock.setFixedTime(new Date('2027-01-01T08:00:00+09:00'));
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const r=await p.evaluate(()=>{const o=[];if(TODAY!=='2027-01-01')o.push('今日が '+TODAY);const L=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});
  S.locs=[L('tb1','A棟','建屋',''),L('tf1','1F','階','tb1'),L('tr1','第1電気室','電気室','tf1'),L('tp1','盤1','盤','tr1'),L('tp2','盤2','盤','tr1'),L('tp3','盤3','盤','tr1')];
  S.banChk={'2026-12':{tp1:['済','済','済'],tp2:['○','済','済']}};save();
  const pend=ym=>banBoardsOf('tb1').filter(x=>banPend(ym,x)).map(x=>x.id).join(',');
  if(pend('2027-01')!=='tp1,tp2,tp3')o.push('1 月にまだの盤 '+pend('2027-01'));if(pend('2026-12')!=='tp2,tp3')o.push('12 月にまだの盤 '+pend('2026-12'));
  if(banPrevYm('2027-01')!=='2026-12')o.push('前の月 '+banPrevYm('2027-01'));
  const cr=banCarry('2027-01').map(x=>x.id).join(',');if(cr!=='tp2,tp3')o.push('先月のやり残し '+cr);
  const h=homeBanLine();const d=document.createElement('div');d.innerHTML=h;const t=d.textContent;if(!/3面/.test(t)||!/全3面|3面中|／3/.test(t))o.push('ホームの残り '+t.replace(/\s+/g,' ').slice(0,60));
  return o});r.forEach(x=>bad.push(x));
 const before=await p.evaluate(()=>JSON.stringify(S.banChk));
 await p.evaluate(()=>{V.banYm='2027-01';V.banB='tb1';V.banEdit=false;V.banQ='';go('ban')});await p.waitForTimeout(250);
 let s=await p.evaluate(()=>({t:document.querySelector('#app').textContent,ym:V.banYm}));
 if(!/先月のやり残し 2面/.test(s.t))bad.push('先月のやり残しのボタンが無い・数が違う');
 const dots=()=>p.evaluate(()=>['tp1','tp2','tp3'].map(id=>{const e=document.getElementById('ban-'+id);return e?e.querySelectorAll('.bm.mk-d').length:-1}));
 let d=await dots();if(d.some(x=>x>0))bad.push('1 月の盤に ● がある '+d);
 await p.evaluate(()=>banCarryGo());await p.waitForTimeout(300);
 s=await p.evaluate(()=>V.banYm);if(s!=='2026-12')bad.push('やり残しを押しても 12 月へ行かない '+s);
 await p.evaluate(()=>{['tf1','tr1'].forEach(k=>{V['bf_'+k]=true;V['br_'+k]=true});render()});await p.waitForTimeout(200);
 d=await p.evaluate(()=>['tp1','tp2'].map(id=>{const e=document.getElementById('ban-'+id);return e?e.querySelectorAll('.bm.mk-d').length:-1}));
 if(d[0]<3)bad.push('12 月の盤1 の ● が残っていない '+d[0]);if(d[1]!==2)bad.push('12 月の盤2 の ● の数 '+d[1]);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('はみ出す '+sw);
 const after=await p.evaluate(()=>JSON.stringify(S.banChk));if(after!==before)bad.push('見ただけで記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
