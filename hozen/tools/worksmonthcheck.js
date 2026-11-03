// カレンダー（month）に工事・作業指示が出る確認：日のマスに 🔧件数、複数日の工事は期間中の毎日、中止は出さない、日を押すとその日の工事が並び押すと開く。保存データは変わらず、390pxではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const ym=await p.evaluate(()=>{const y=+TODAY.slice(0,4),m=+TODAY.slice(5,7);const D=d=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const base={kind:'工事',start:'',end:'',locId:'',place:'',vendor:'',vendorStaff:'',content:'',result:'',equipIds:[],staff:[],approvals:[],hist:[],needQuals:[],needN:0,outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',cost:'',photos:[],docs:[],issueId:''};
  S.works=[{...base,id:'wk1',no:'W-001',title:'受変電設備 改修工事',date:D(10),endDate:D(12),status:'承認済み',start:'09:00'},{...base,id:'wk2',no:'W-002',title:'照明器具 交換',date:D(10),endDate:'',status:'起案'},{...base,id:'wk3',no:'W-003',title:'中止した工事',date:D(11),endDate:'',status:'中止'}];
  window.__before=JSON.stringify(S.works);V.y=y;V.m=m;V.sel=D(1);go('month');return {D10:D(10),D11:D(11),D12:D(12),D13:D(13)}});
 await p.waitForTimeout(300);
 const cell=d=>p.evaluate(d=>{const e=[...document.querySelectorAll('.cal .d')].find(x=>(x.getAttribute('onclick')||'').includes(d));const w=e&&e.querySelector('.wkm');return w?w.textContent:''},d);
 if(await cell(ym.D10)!=='🔧2')bad.push('10日の印が違う：'+await cell(ym.D10));
 if(await cell(ym.D11)!=='🔧1')bad.push('11日（複数日の工事・中止は除く）の印が違う：'+await cell(ym.D11));
 if(await cell(ym.D12)!=='🔧1')bad.push('12日（終了日）の印が違う：'+await cell(ym.D12));
 if(await cell(ym.D13)!=='')bad.push('13日に印が出る');
 await p.evaluate(d=>pickDay(d),ym.D10);await p.waitForTimeout(300);
 const rows=await p.evaluate(()=>[...document.querySelectorAll('#dayWorks .item .ti')].map(e=>e.textContent));
 if(rows.join('|')!=='受変電設備 改修工事|照明器具 交換'&&rows.join('|')!=='照明器具 交換|受変電設備 改修工事')bad.push('日の工事の一覧が違う：'+rows.join('|'));
 await p.evaluate(d=>pickDay(d),ym.D11);await p.waitForTimeout(300);
 const r11=await p.evaluate(()=>[...document.querySelectorAll('#dayWorks .item .ti')].map(e=>e.textContent).join('|'));if(r11!=='受変電設備 改修工事')bad.push('11日の一覧が違う：'+r11);
 if(await p.evaluate(()=>document.querySelector('#dayCard .empty')))bad.push('工事がある日に「予定はありません」が出る');
 if(await p.evaluate(()=>JSON.stringify(S.works)!==window.__before))bad.push('保存データが変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('はみ出す');
 if(process.argv[2]){await p.evaluate(()=>{const e=document.getElementById('dayCard');e&&e.scrollIntoView({block:'end'})});await p.screenshot({path:process.argv[2],fullPage:true})}
 await p.click('#dayWorks .item');await p.waitForTimeout(300);
 if(!await p.evaluate(()=>!!document.querySelector('#wk_vendor')))bad.push('押しても工事が開かない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
