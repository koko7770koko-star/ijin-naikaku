// 年間計画：年度の境（3 月→ 4 月）で、年 1 回・6 ヶ月・毎月の点検が正しい年度の列に ◯・● で出て、印刷（A4 横）の見出しの年度が正しいか（hz-v-plan-fy-edge）。
// 保存の形（hospElecSched_v1 の marks[年度][項目]＝12 要素）は変えない。
// usage: node hozen/tools/planfyedgecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const FY=await p.evaluate(()=>fyOf(now.getFullYear(),now.getMonth()+1)+1); // 来年度（今日より前で捨てられない）
 const r=await p.evaluate(fy=>{
  const o=[];
  // 年度の判定：3/31→4/1 と 12/31→1/1
  const f=(y,m)=>fyOf(y,m);
  if(f(fy,3)!==fy-1||f(fy,4)!==fy)o.push('年度の境が違う '+f(fy,3)+'/'+f(fy,4));
  if(f(fy+1,3)!==fy||f(fy,12)!==fy||f(fy+1,1)!==fy)o.push('1〜3 月が前の年度に入らない');
  // 自動作成：年 1 回（初回 3/10）・6 ヶ月（初回 3/20）・毎月（初回 3/15）
  S.items=[{id:'c1',name:'年次',cat:'その他',cycle:'年1回',base:(fy+1)+'-03-10'},{id:'c2',name:'半年',cat:'その他',cycle:'6ヶ月',base:(fy+1)+'-03-20'},{id:'c3',name:'毎月',cat:'その他',cycle:'毎月',base:fy+'-03-15'},{id:'c4',name:'四月',cat:'その他',cycle:'年1回',base:fy+'-04-01'}];
  S.tasks=[];S.marks={};
  genPlan(fy);closeModal(true);
  const mk=S.marks[fy]||{};
  const row=id=>(mk[id]||[]).join('|');
  const idx=m=>MONTHS.indexOf(m);
  const mr=id=>(mk[id]||[]);
  if(!mr('c1')[idx(3)]||mr('c1').filter(Boolean).length!==1)o.push('年 1 回（3 月）が 3 月の列だけに出ない '+row('c1'));
  const h=mr('c2').map((v,i)=>v?MONTHS[i]:0).filter(Boolean).sort((a,b)=>a-b).join(',');
  if(h!=='3,9')o.push('6 ヶ月（3 月・9 月）の列 '+h);
  if(mr('c3').filter(Boolean).length!==12)o.push('毎月が 12 列にならない '+row('c3'));
  if(!mr('c4')[idx(4)]||mr('c4').filter(Boolean).length!==1)o.push('年 1 回（4 月）が 4 月の列だけに出ない '+row('c4'));
  // 前の年度・次の年度の行に混ざらない
  const nx=S.marks[fy+1]||{},pv=S.marks[fy-1]||{};
  if(Object.keys(nx).length||Object.keys(pv).length)o.push('隣の年度に印が入った');
  // 3/31 → 4/1 に ● を付けても別の年度の行
  setMark('c3',(fy+1)+'-03-31','済');setMark('c3',(fy+1)+'-01-01','済');setMark('c3',(fy+1)+'-04-01','済');
  if(S.marks[fy].c3[idx(3)]!=='済'||S.marks[fy].c3[idx(1)]!=='済')o.push('3/31・1/1 の ● が今の年度の 3 月・1 月の列でない '+S.marks[fy].c3.join('|'));
  if(!(S.marks[fy+1]&&S.marks[fy+1].c3)||S.marks[fy+1].c3[idx(4)]!=='済'||S.marks[fy+1].c3.filter(Boolean).length!==1)o.push('4/1 の ● が次の年度の 4 月の列だけでない');
  // 画面：見出し・列の並び
  V.fy=fy;go('year');
  const th=[...document.querySelectorAll('table.yr thead th')].map(x=>x.textContent.trim());
  const nav=document.querySelector('#app').textContent;
  const hd=[...document.querySelectorAll('#app h2')].map(x=>x.textContent).find(x=>/年間点検計画/.test(x))||'';
  const col=th.slice(1,13).join(',');
  const cells=[...document.querySelectorAll('table.yr tr')].filter(tr=>tr.querySelector('td.nm')&&/毎月/.test(tr.querySelector('td.nm').textContent))[0];
  return {o,th:col,hd,navOk:nav.includes(fy+'年度'),first:cells?cells.querySelectorAll('td.mk')[0].textContent.trim():'',sw:document.documentElement.scrollWidth,fy}},FY);
 r.o.forEach(x=>bad.push(x));
 if(r.th!=='4月,5月,6月,7月,8月,9月,10月,11月,12月,1月,2月,3月')bad.push('列の並び '+r.th);
 if(!r.navOk)bad.push('年度の見出しに '+r.fy+'年度 が無い');
 if(!new RegExp(r.fy+'/4〜'+(r.fy+1)+'/3').test(r.hd))bad.push('見出しの期間 '+r.hd);
 if(r.sw>392)bad.push('390px ではみ出す '+r.sw);
 // 印刷（A4 横）
 await c.close();
 const c2=await b.newContext({viewport:{width:1123,height:794}});const q=await c2.newPage();q.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c2.route('**/*',rr=>/^(file|data|blob):/.test(rr.request().url())?rr.continue():rr.abort());
 await q.goto('file://'+FILE);await q.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await q.waitForTimeout(150);
 await q.evaluate(fy=>{S.items=[{id:'c1',name:'年次',cat:'その他',cycle:'年1回'}];S.marks={[fy]:{c1:['','','','','','','','','','','','○']}};V.fy=fy;go('year')},FY);await q.waitForTimeout(300);
 await q.emulateMedia({media:'print'});await q.waitForTimeout(200);
 const pr=await q.evaluate(()=>({pg:document.querySelector('#pageStyle').textContent,txt:document.querySelector('#app').innerText,last:[...document.querySelectorAll('table.yr td.mk')].map(x=>x.textContent.trim()).join('')}));
 if(!/landscape/.test(pr.pg))bad.push('用紙が横向きでない');
 if(!new RegExp(FY+'/4〜'+(FY+1)+'/3').test(pr.txt))bad.push('印刷の見出しに '+FY+'/4〜'+(FY+1)+'/3 が無い');
 if(pr.last!=='◯')bad.push('3 月の ◯ が印刷に出ない '+pr.last);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
