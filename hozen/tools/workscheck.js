// 作業予定表（workSheet）の印刷の確認：A4縦（794px幅）で印刷表示にして、表が紙の幅に収まる・列が1字ずつ折れない・エラーなし。
// usage: node hozen/tools/workscheck.js [画像の出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const mk=(i,t,st,v)=>({id:'w'+i,no:'W-00'+i,title:t,kind:'点検',status:st,date:TODAY,endDate:i%2?addD(TODAY,2):'',start:'09:00',end:'17:00',equipIds:[],staff:['職員甲','職員乙','職員丙'],vendor:v,outage:{on:i%2===0},cost:'',approvals:[],checks:{pre:[],post:[]}});
  S.works=[mk(1,'高圧受電設備 年次点検に伴う停電作業（A棟 受変電室 〜 屋上キュービクル）','予定','○○電気工事株式会社 第二営業所'),mk(2,'非常用発電機 無負荷運転','予定',''),mk(3,'分電盤 清掃','実施中','')];go('workSheet',{wsFrom:TODAY})});await p.waitForTimeout(400);
 await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const t=document.querySelector('.rep table');const tr=t.getBoundingClientRect();const cells=[...t.querySelectorAll('th,td')];
  const narrow=cells.filter(x=>{const s=x.textContent.trim();return s.length>=4&&x.getBoundingClientRect().width<44&&x.getBoundingClientRect().height>26*Math.ceil(s.length/3)}).map(x=>x.textContent.trim().slice(0,12));
  return{tw:tr.width,right:tr.right,sw:document.documentElement.scrollWidth,narrow}});
 if(r.right>794||r.sw>796)bad.push('印刷で紙の幅をはみ出す '+JSON.stringify(r));if(r.narrow.length)bad.push('狭い列が1字ずつ折れる：'+r.narrow.join('、'));
 // 状態の文字が途中で折れない（1行）・氏名が途中で折れない（氏名ごとの枠が1行）
 const lines=await p.evaluate(()=>[...document.querySelectorAll('.rep table tr')].slice(1).filter(r=>r.cells.length===6).map(r=>{const rg=document.createRange();rg.selectNodeContents(r.cells[5]);const st=new Set([...rg.getClientRects()].map(x=>Math.round(x.top))).size;
   const nm=[...r.cells[3].querySelectorAll('span')].some(sp=>sp.getClientRects().length>1);return{st,nm}}));
 if(!lines.length)bad.push('行が無い');if(lines.some(l=>l.st>1))bad.push('状態の文字が折れる');if(lines.some(l=>l.nm))bad.push('氏名が途中で折れる');
 if(process.argv[2])await p.screenshot({path:process.argv[2],fullPage:true});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
