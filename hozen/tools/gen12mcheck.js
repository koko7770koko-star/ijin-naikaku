// 非常用発電機の過去12か月（hz-gen-12m）：設備カルテに畳んだ「📈 過去12か月の数字」、月報に「6の5」。月は縦（新しい月が上）・12行・
//  各項目に前年同月との差・累計（運転時間計）が前の月より減った月と燃料が大きく増えた月に ▲（色だけにしない）。記録の無い台は出さない。
//  390px で横にはみ出さない・A4 の月報でも表が出る。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(()=>{const g=(id)=>({id,code:id.toUpperCase(),name:'非常用発電機 '+id,kind:'発電機',status:'稼働',locId:'',place:'',importance:'',spec:{}});
  S.equipment=[g('g1'),g('g2')];S.meas=[];const now=TODAY.slice(0,7);let y=+now.slice(0,4),m=+now.slice(5,7);
  // g1：24か月分。運転時間は毎月 +10、ただし 2か月前は 打ち間違いで減る。燃料は 50%、3か月前だけ 95%（給油）。電圧は 200＋（今年は 2 高い）
  const L=[];for(let i=0;i<24;i++){L.push(y+'-'+String(m).padStart(2,'0'));m--;if(m<1){m=12;y--}}
  L.reverse().forEach((ym,k)=>{const i=23-k;S.meas.push({id:'m'+k,equipId:'g1',tplId:'mt_gen',date:ym+'-05',type:'電圧・電流・電力',name:'月次',by:'確認者',cond:{},note:'',photos:[],
    rows:[{name:'電圧',v:i<12?202:200,unit:'V',min:'',max:'',ck:false},{name:'運転時間計',v:i===2?5:1000+(23-i)*10,unit:'h',min:'',max:'',ck:false},{name:'燃料残量',v:i===3?95:50,unit:'%',min:'',max:'',ck:false}]})});
  return JSON.stringify(S.meas)});
 // 設備カルテ
 await p.evaluate(()=>go('equipDetail',{eq:'g1',eqTab:'ov'}));await p.waitForTimeout(200);
 if(!(await p.$('#gen12d')))bad.push('設備カルテに過去12か月が無い');
 await p.click('#gen12d summary');await p.waitForTimeout(100);
 const t=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#gen12d tr[data-ym]')];return {n:rows.length,first:rows[0].dataset.ym,r0:rows[0].innerText.replace(/\s+/g,' '),r2:rows[2].innerText.replace(/\s+/g,' '),r3:rows[3].innerText.replace(/\s+/g,' '),ov:document.querySelector('#gen12d').scrollWidth>document.querySelector('#gen12d').clientWidth+1}});
 if(t.n!==12)bad.push('12行にならない '+t.n);if(t.first!==await p.evaluate(()=>TODAY.slice(0,7)))bad.push('新しい月が上でない');
 if(!/202 前年\+2/.test(t.r0))bad.push('前年同月との差が出ない '+t.r0);
 if(!/▲5/.test(t.r2))bad.push('累計が減った月に ▲ が無い '+t.r2);if(!/▲95/.test(t.r3))bad.push('燃料が大きく増えた月に ▲ が無い '+t.r3);
 if(/▲/.test(t.r0))bad.push('普通の月に ▲ が付く '+t.r0);if(t.ov)bad.push('表が横にはみ出す');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 // 記録の無い台には出さない
 await p.evaluate(()=>go('equipDetail',{eq:'g2',eqTab:'ov'}));await p.waitForTimeout(150);if(await p.$('#gen12d'))bad.push('記録の無い台に出る');
 // 月報 6の5
 const rep=await p.evaluate(()=>{const d=new Date();V.ry=d.getFullYear();V.rm=d.getMonth()+1;go('report');const s=[...document.querySelectorAll('.sec')].find(x=>/6の5/.test(x.textContent));return s?document.querySelectorAll('table.gen12 tr[data-ym]').length:-1});
 if(rep!==12)bad.push('月報の 6の5 が出ない／行数が違う '+rep);
 await p.emulateMedia({media:'print'});const pv=await p.evaluate(()=>{const tb=document.querySelector('table.gen12');return tb?getComputedStyle(tb).display:'none'});await p.emulateMedia({media:'screen'});if(pv==='none')bad.push('印刷で表が出ない');
 if(await p.evaluate(()=>JSON.stringify(S.meas))!==before)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
