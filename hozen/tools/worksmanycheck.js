// 作業管理（works）の確認：作業指示30件・長い件名・長い協力会社名・担当者多数・停電・要確認の印が付く状態で
// 390px で開き、行の文字・状態の印・上の操作（絞り込み・＋作業指示）・件数タイルが切れたり重ならず、
// 横にはみ出さず、タップした行から編集の画面が開く（状態の変更が1〜2タップ）ことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const ST=['承認待ち','承認済み','実施中','保留','予定'];
  S.works=[...Array(30)].map((_,i)=>({id:'wm'+i,no:'W-'+String(100+i),title:'高圧受電設備 年次点検に伴う停電作業（A棟 受変電室〜屋上キュービクル）第'+(i+1)+'回',kind:'点検',status:ST[i%5],date:addD(TODAY,i%7),endDate:i%3?addD(TODAY,(i%7)+2):'',start:'09:00',end:'17:00',equipIds:[],staff:['職員甲','職員乙','職員丙','職員丁'],vendor:'○○電気工事株式会社 第二営業所 東日本支店',vendorStaff:'',needN:6,needQuals:[],outage:{on:i%2===0,range:''},cost:'',approvals:[],pre:[],post:[],checks:{pre:[],post:[]}}));
  save()});await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>go('works'));await p.waitForTimeout(500); // 足りない項目はアプリが初期値で補う（古い形の記録でも開ける）
 const r=await p.evaluate(()=>{const sw=document.documentElement.scrollWidth;
  const rows=[...document.querySelectorAll('#app .item')];
  const cut=rows.filter(x=>{const q=x.getBoundingClientRect();return q.right>391||x.scrollWidth>x.clientWidth+1}).length;
  const pills=[...document.querySelectorAll('#app .item .pill')];const pc=pills.filter(x=>x.getBoundingClientRect().right>390||x.scrollWidth>x.clientWidth+1).length;
  // 同じ行の中で印が互いに重ならない
  let ov=0;rows.forEach(x=>{const ps=[...x.querySelectorAll('.pill')].map(e=>e.getBoundingClientRect());for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],c=ps[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)ov++}});
  const tiles=[...document.querySelectorAll('.wkt .tile')].map(x=>x.getBoundingClientRect());
  const tcut=tiles.some(q=>q.right>391||q.height<40);
  const top=[...document.querySelectorAll('#app > .row button, #app > .row select')].map(x=>x.getBoundingClientRect());
  return {sw,n:rows.length,cut,pc,ov,tcut,topMin:Math.min(...top.map(q=>q.height)),topCut:top.some(q=>q.right>391)}});
 if(r.n<30)bad.push('行が30件出ない '+r.n);if(r.sw>392)bad.push('横にはみ出す '+r.sw);if(r.cut)bad.push('行がはみ出す '+r.cut);if(r.pc)bad.push('状態の印が切れる '+r.pc);if(r.ov)bad.push('印が重なる '+r.ov);
 if(r.tcut)bad.push('件数タイルが切れる/小さい');if(r.topMin<44)bad.push('上のボタンが小さい '+r.topMin);if(r.topCut)bad.push('上の操作がはみ出す');
 // 承認待ちのタイルを押すと絞り込まれる（1タップ）、行を押すと編集が開く（状態の変更は編集の中）
 await p.click('.wkt .tile:has-text("承認待ち")');await p.waitForTimeout(300);
 const f=await p.evaluate(()=>[...document.querySelectorAll('#app .item .pill')].filter(x=>x.textContent==='承認待ち').length+'/'+document.querySelectorAll('#app .item').length);
 const [a,n]=f.split('/').map(Number);if(!n||a!==n)bad.push('承認待ちの絞り込みが合わない '+f);
 await p.click('#app .item');await p.waitForTimeout(400);
 const m=await p.evaluate(()=>{const md=document.querySelector('#modal');return {open:!!(md&&md.offsetParent),sw:document.documentElement.scrollWidth,st:!!document.querySelector('#modal select, #modal .seg')}});
 if(!m.open)bad.push('行を押しても編集が開かない');if(m.sw>392)bad.push('編集画面で横にはみ出す '+m.sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
