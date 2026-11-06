// カレンダー（月）の前月末・翌月頭の灰色の日（hz-v-month-edge-week）：灰色の日を押すと、その日の予定が並び、
// 「● 実施済みにする」で正しい日付の予定だけが ● になる。その月に移っても同じ日のマスが ●。
// 年またぎ（12 月の表示で 1/1・1 月の表示で 12/31）・うるう年（2028 年 2 月の表示で 2/29 と 3/1）も。保存の形は変わらない（status だけ）
// usage: node hozen/tools/monthedgecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 // [表示の年, 月, 押す灰色の日, その日の月に移ったときの年, 月]
 const CASES=[[2026,12,'2026-11-30',2026,11],[2026,11,'2026-12-05',2026,12],[2026,12,'2027-01-02',2027,1],[2027,1,'2026-12-31',2026,12],[2028,2,'2028-03-01',2028,3],[2028,3,'2028-02-29',2028,2]];
 for(const [y,m,ds,y2,m2] of CASES){
  const r=await p.evaluate(([y,m,ds])=>{const o=[];
   const mk=(id,date,title)=>({id,date,title,status:'予定',result:'',time:'',place:'',staff:'',attend:'',note:'',photos:[]});
   // 同じ題の予定を前後の日にも置く（違う日が ● にならないか）
   S.tasks=[mk('t1',ds,'受変電 月次点検'),mk('t2',addD(ds,-1),'受変電 月次点検'),mk('t3',addD(ds,1),'受変電 月次点検'),mk('t4',addD(ds,7),'受変電 月次点検')];save();
   V.y=y;V.m=m;V.sel=y+'-'+String(m).padStart(2,'0')+'-15';go('month');
   const cell=[...document.querySelectorAll('.cal .d')].find(e=>(e.getAttribute('onclick')||'').includes("'"+ds+"'"));
   if(!cell)return ['灰色の日のマスが無い '+ds];if(!cell.classList.contains('o'))o.push('マスが灰色でない '+ds);
   cell.click();
   if(V.sel!==ds)o.push('押した日が選ばれない（V.sel='+V.sel+'）');
   const dc=document.getElementById('dayCard');if(!dc)return [...o,'その日の予定の欄が無い'];
   const bt=[...dc.querySelectorAll('button')].filter(e=>/実施済みにする/.test(e.textContent));
   if(bt.length!==1)o.push('その日の「● 実施済みにする」が '+bt.length+' 個（1 個のはず）');
   if(bt[0])bt[0].click();
   const st=Object.fromEntries(S.tasks.map(t=>[t.id,t.status]));
   if(st.t1!=='完了')o.push('押した日の予定が ● にならない');
   ['t2','t3','t4'].forEach(k=>{if(st[k]!=='予定')o.push('ほかの日の予定まで変わった '+k)});
   const saved=JSON.parse(localStorage.getItem('hospElecSched_v1'));const sv=(saved.tasks||[]).find(t=>t.id==='t1');
   if(!sv||sv.status!=='完了'||sv.date!==ds)o.push('保存された記録の日付・状態が違う');
   return o},[y,m,ds]);
  r.forEach(x=>bad.push(y+'/'+m+' の表示・'+ds+'：'+x));
  // その日の月に移って、同じ日のマスが ●、前後は ◯
  const r2=await p.evaluate(([y2,m2,ds])=>{const o=[];V.y=y2;V.m=m2;go('month');
   const cell=d=>[...document.querySelectorAll('.cal .d')].find(e=>(e.getAttribute('onclick')||'').includes("'"+d+"'")&&!e.classList.contains('o'));
   const a=cell(ds);if(!a)return ['移った月にその日のマスが無い'];if(!/●受変電/.test(a.textContent))o.push('移った月のマスが ● でない');
   const pr=cell(addD(ds,7))||cell(addD(ds,-1));if(pr&&!/◯受変電/.test(pr.textContent))o.push('移った月のほかの日が ◯ でない');
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('390px で横にはみ出す');return o},[y2,m2,ds]);
  r2.forEach(x=>bad.push(y2+'/'+m2+' に移って・'+ds+'：'+x))}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
