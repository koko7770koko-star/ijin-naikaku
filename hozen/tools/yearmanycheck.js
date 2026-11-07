// 年間計画：点検項目 2000（設備 500 に結びつく）・カレンダーの予定 6000 件（完了を含む）・3 年度分の印で、年間表が 1.5 秒以内に出て、
// マス（◯●）を押すたびに 1.5 秒以内に描き直し、押した印が保存され、期限管理の前回日が正しく、印刷の見た目（A4 横の表）が崩れず、「周期から予定を自動作成」が 3 秒以内で同じ月に同じ点検を重ねないか。
// 390px・文字「標準」「特大」（hz-v-year-many）。usage: node hozen/tools/yearmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
// 前は期限管理（deadlines→lastDone）が項目×予定をなめて 2.8 秒。直した後は 0.7〜0.9 秒で、残りの約 0.6 秒は 2000 行の表の配置（ブラウザの計算）なので上限は 1.5 秒
const NI=2000,NT=6000,LIM=1500;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(([f,NI,NT])=>{S.settings.fscale=f;const CY=['毎月','3か月','6か月','年1回'];const cats=S.settings.cats;
  S.equipment=[...Array(500)].map((_,i)=>({id:'eqm'+i,code:'EQ-'+i,name:'試しの設備'+i,kind:'変圧器',locId:'',status:'稼働',importance:'',repairs:[]}));
  S.items=[...Array(NI)].map((_,i)=>({id:'itm'+i,name:'試しの点検'+i+' 高圧受電盤 外観・発熱・異音の確認',cat:cats[i%cats.length],cycle:CY[i%4],base:addD(TODAY,-400+(i%300)),who:i%3?'自社':'委託',track:true,legal:'',equipId:'eqm'+(i%500)}));
  S.tasks=[...Array(NT)].map((_,i)=>({id:'tsm'+i,date:addD(TODAY,-(i%700)+30),time:'',kind:'定期',cat:cats[i%cats.length],title:'試しの点検'+(i%NI)+' 高圧受電盤 外観・発熱・異音の確認',place:'',staff:'',attend:'',status:addD(TODAY,-(i%700)+30)<TODAY&&i%5?'完了':'予定',result:'',note:'',photos:[]}));
  const fy0=fyOf(now.getFullYear(),now.getMonth()+1);S.marks={};for(const fy of [fy0-2,fy0-1,fy0]){S.marks[fy]={};S.items.forEach((it,i)=>{S.marks[fy][it.id]=[...Array(12)].map((_,k)=>(k+i)%3===0?(fy<fy0?'済':'○'):'')})}
  save()},[fs,NI,NT]);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const t0=await p.evaluate(()=>{applyFScale();V.fy=fyOf(now.getFullYear(),now.getMonth()+1);V.yrCat='';V.yrNow=false;const t=performance.now();go('year');return performance.now()-t});await p.waitForTimeout(200);
 if(t0>LIM)bad.push(tag+'年間表が出るまで '+Math.round(t0)+'ms');
 const rows=await p.evaluate(()=>document.querySelectorAll('table.yr td.nm').length);if(rows!==NI)bad.push(tag+'項目が全部並ばない '+rows+'/'+NI);
 // 押すたび（空→◯→●→空）
 const taps=[];for(let k=0;k<3;k++){const ms=await p.evaluate(()=>{const s=performance.now();cycleMark('itm7',5,false);return performance.now()-s});taps.push(Math.round(ms));await p.waitForTimeout(50)}
 if(Math.max(...taps)>LIM)bad.push(tag+'マスを押すたび '+taps.join('/')+'ms');
 const seq=await p.evaluate(()=>{const fy=V.fy;return (S.marks[fy]['itm7']||[])[5]});
 const kept=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return (o.marks[V.fy]['itm7']||[])[5]});if(kept!==seq)bad.push(tag+'押した印が保存されない '+kept+'/'+seq);
 // 期限管理：前回日が完了の予定のいちばん新しい日
 const dl=await p.evaluate(()=>{const it=S.items.find(x=>x.id==='itm11');const w=S.tasks.filter(t=>t.status==='完了'&&t.title===it.name).map(t=>t.date).sort().pop()||'';const d=deadlines().find(x=>x.it.id==='itm11');return {w,got:d?d.ld:null}});
 if(dl.got!==dl.w)bad.push(tag+'期限管理の前回日が違う '+dl.got+'/'+dl.w);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+'はみ出す '+sw);
 // 印刷（A4 横）：表の幅が紙に収まる
 if(fs==='m'){await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>{const t=document.querySelector('table.yr');const r=t.getBoundingClientRect();const cells=[...t.querySelectorAll('tr:nth-child(-n+5) td.mk')].map(x=>x.getBoundingClientRect().height);return {w:r.width,maxH:Math.max(...cells)}});await p.emulateMedia({media:'screen'});
  const buf=await p.pdf({format:'A4',landscape:true}).catch(e=>{bad.push(tag+'印刷（PDF）が作れない '+e.message);return null});if(buf&&buf.length<1000)bad.push(tag+'印刷が空');
  if(pr.maxH>60)bad.push(tag+'印刷でマスの高さが崩れる '+pr.maxH)}
 // 周期から予定を自動作成：数千件でも待たせず、同じ月に同じ点検を2つ作らない
 const gp=await p.evaluate(()=>{const n0=S.tasks.length,s=performance.now();genPlan(V.fy);const ms=performance.now()-s;closeModal(true);const seen=new Set();let dup=0;S.tasks.forEach(t=>{const k=norm(t.title)+'|'+t.date.slice(0,7)+'|'+t.status;if(t.note==='周期から自動作成'){if(seen.has(k))dup++;seen.add(k)}});
  const made=S.tasks.slice(n0);const clash=made.filter(m=>S.tasks.slice(0,n0).some(t=>norm(t.title)===norm(m.title)&&t.date.slice(0,7)===m.date.slice(0,7))).length;return {ms,made:made.length,dup,clash}});
 if(gp.ms>3000)bad.push(tag+'周期から予定を作るのに '+Math.round(gp.ms)+'ms');if(!gp.made)bad.push(tag+'予定が1件も作られない');if(gp.dup||gp.clash)bad.push(tag+'同じ月に同じ点検が重なる '+gp.dup+'/'+gp.clash);
 console.log(tag+'周期から予定 '+gp.made+'件 '+Math.round(gp.ms)+'ms');
 console.log(tag+'年間表 '+Math.round(t0)+'ms、押すたび '+taps.join('/')+'ms');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
