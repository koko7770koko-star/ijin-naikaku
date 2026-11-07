// 工事・作業管理（go('works')）：作業 3000 件（承認待ち・予定・完了が混ざる）で、一覧の表示と絞り込みがそれぞれ 0.5 秒以内、
// 文字「特大」でも横にはみ出さず、全件表示の印刷が A4 縦の幅に収まり、操作の部品が出ず、記録は変わらない（hz-v-works-print-many）。
// usage: node hozen/tools/worksprintmanycheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=500;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const st=['承認待ち','承認済み','実施中','完了','保留','中止'];S.works=[];
  for(let i=0;i<3000;i++)S.works.push({id:'wpm'+i,no:'W-'+(1000+i),title:i%4===0?'A棟 3階 第2電気室 高圧受電盤 VCB 交換および保護継電器試験・停電作業（長い件名の例）'+i:'作業'+i,kind:'工事',status:st[i%6],date:addD(TODAY,(i%60)-30),endDate:'',start:'09:00',end:'17:00',place:i%4===0?'A棟 › 3階 › 第2電気室 › 高圧受電盤 No.2（長い場所の例）':'',vendor:i%2?'○○電気工事':'',vendorStaff:'',content:'',staff:i%3?['担当A','担当B']:[],equipIds:[],locId:'',needQuals:[],needN:0,ky:[],pre:[],post:[],approvals:[],hist:[],issueId:'',outage:{on:i%5===0,range:'',from:'',to:'',affect:'',contact:''},photos:[],docs:[]});
  S.settings.fscale='xl';save();applyFScale();V.wkF='all';V.wkQ='';V.wkMore=0;return S.works.length+''});
 let t0=Date.now();await p.evaluate(()=>go('works'));await p.waitForSelector('#app .item');let ms=Date.now()-t0;
 if(ms>LIM)bad.push(`一覧が ${LIM}ms 以内に出ない ${ms}ms`);
 const ov=async tag=>{const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,over:[...document.querySelectorAll('#app *')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+1&&!e.closest('.tblwrap')).slice(0,3).map(e=>e.tagName+'.'+e.className)}));if(r.sw>392||r.over.length)bad.push(tag+'：横にはみ出す '+r.sw+' '+r.over.join(','))};
 await ov('特大・全件');
 t0=Date.now();await p.evaluate(()=>{V.wkF='承認待ち';render()});await p.waitForTimeout(0);ms=Date.now()-t0;const ms2=ms;
 if(ms2>LIM)bad.push(`絞り込みが ${LIM}ms 以内に終わらない ${ms2}ms`);
 await ov('特大・承認待ち');
 t0=Date.now();await p.evaluate(()=>{V.wkQ='高圧受電盤';render()});const ms3=Date.now()-t0;
 if(ms3>LIM)bad.push(`検索が ${LIM}ms 以内に終わらない ${ms3}ms`);
 await ov('特大・検索');
 await p.evaluate(()=>{V.wkF='all';V.wkQ='';V.wkMore=100000;render()});await p.waitForTimeout(400);
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
  const ctl=[...document.querySelectorAll('#app button,#app select,#app input,#app .tile')].filter(vis).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'')).trim().slice(0,16));
  const rows=[...document.querySelectorAll('#app .item')].filter(vis);const bi=rows[0]?getComputedStyle(rows[0]).breakInside:'none';
  return {sw:document.documentElement.scrollWidth,W,over,ctl,bi,n:rows.length}});
 if(r.sw>r.W+1||r.over.length)bad.push('A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
 if(r.ctl.length)bad.push('印刷に操作の部品が残る '+r.ctl.join('|'));
 if(r.n<3000)bad.push('3000件が出ない '+r.n);
 if(r.n&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push('行がページの境で割れる（break-inside '+r.bi+'）');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 console.log('絞り込み',ms2,'ms 検索',ms3,'ms 行',r.n,'PDF',buf.length);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>S.works.length+'')!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
