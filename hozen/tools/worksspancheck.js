// 月をまたぐ・年をまたぐ工事（例 11/28〜12/3、12/30〜1/2）が、期間中の毎日に抜けなく出るか（hz-v-works-span-month）
// ①worksOn：期間の全部の日に出て、前日・翌日には出ない ②カレンダー（月）の画面：両方の月のマスに 🔧 ③月の予定表の印刷（monthPrintHTML）にも両方の月で毎日出る
// ④ホームの「今日」：期間中なら出る ⑤作業表（workSheet）に出る ⑥中止は出さない ⑦保存の形は変わらない
// usage: node hozen/tools/worksspancheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const r=await p.evaluate(()=>{const o=[];const y=+TODAY.slice(0,4);
  const mk=(id,title,date,endDate,status)=>({...{id,no:id,title,kind:'工事',status,date,endDate,start:'09:00',end:'17:00',equipIds:[],locId:'',place:'',staff:[],vendor:'',vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''}});
  const A=[mk('w1','受変電設備 更新工事',y+'-11-28',y+'-12-03','承認済み'),mk('w2','年末年始 停電点検',y+'-12-30',(y+1)+'-01-02','起案'),mk('w3','中止した工事',y+'-11-29',y+'-12-02','中止')];
  S.works=A;save();const before=localStorage.getItem('hospElecSched_v1');
  const days=(f,t)=>{const r=[];for(let d=f;d<=t;d=addD(d,1))r.push(d);return r};
  for(const w of A.slice(0,2)){const all=days(w.date,w.endDate);
   all.forEach(d=>{if(!worksOn(d).some(x=>x.id===w.id))o.push('worksOn：'+d+' に「'+w.title+'」が出ない')});
   [addD(w.date,-1),addD(w.endDate,1)].forEach(d=>{if(worksOn(d).some(x=>x.id===w.id))o.push('worksOn：期間外 '+d+' に出る')});
   // 月の印刷
   const ms=[...new Set(all.map(d=>d.slice(0,7)))];
   ms.forEach(ym=>{const div=document.createElement('div');div.innerHTML=monthPrintHTML(+ym.slice(0,4),+ym.slice(5,7));
    const cells=[...div.querySelectorAll('table.mpt td:not(.o)')];const n=all.filter(d=>d.startsWith(ym)).length;
    const hit=cells.filter(td=>[...td.querySelectorAll('.t.wk')].some(e=>e.textContent.includes(w.title))).length;
    if(hit!==n)o.push('月の印刷 '+ym+'：「'+w.title+'」が '+hit+' 日（期間は '+n+' 日）');
    if(!/🔧＝工事/.test(div.textContent))o.push('月の印刷 '+ym+'：🔧 の説明が無い');
    if(div.textContent.includes('中止した工事'))o.push('月の印刷 '+ym+'：中止の工事が出る')});
  }
  if(worksOn(y+'-11-30').some(x=>x.id==='w3'))o.push('worksOn：中止が出る');
  // 作業表（14 日）
  V.wsFrom=y+'-11-25';go('workSheet');const ws=document.querySelector('#app').textContent;['受変電設備 更新工事'].forEach(t=>{if(!ws.includes(t))o.push('作業表に「'+t+'」が無い')});
  V.wsFrom=y+'-12-29';go('workSheet');if(!document.querySelector('#app').textContent.includes('年末年始 停電点検'))o.push('作業表（年またぎ）に出ない');
  if(localStorage.getItem('hospElecSched_v1')!==before)o.push('表示しただけで保存の中身が変わった');
  return o});
 r.forEach(x=>bad.push(x));
 // ホームの今日：TODAY を期間に含む工事
 const h=await p.evaluate(()=>{const w=S.works[0];w.date=addD(TODAY,-3);w.endDate=addD(TODAY,2);save();go('home');return document.querySelector('#app').textContent.includes(w.title)});
 if(!h)bad.push('ホームの今日に期間中の工事が出ない');
 // 画面のカレンダー：両方の月の期間の日のマスに 🔧
 const cal=await p.evaluate(async()=>{const o=[];const y=+TODAY.slice(0,4);S.works[0].date=y+'-11-28';S.works[0].endDate=y+'-12-03';save();
  for(const [ym,ds] of [[y+'-11',[28,29,30]],[y+'-12',[1,2,3]]]){V.y=+ym.slice(0,4);V.m=+ym.slice(5,7);V.sel=ym+'-'+String(ds[0]).padStart(2,'0');go('month');
   if(!document.querySelector('#app').textContent.includes(V.y+'年 '+V.m+'月'))o.push('カレンダー '+ym+'：その月に移れない');const html=document.querySelector('#app').innerHTML;if(!html.includes('🔧'))o.push('カレンダー '+ym+'：🔧 が無い');
   if(!document.querySelector('#app').textContent.includes('受変電設備 更新工事'))o.push('カレンダー '+ym+'：選んだ日の工事の一覧に出ない')}
  return o});
 cal.forEach(x=>bad.push(x));
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))bad.push('390px で横にはみ出す');
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
