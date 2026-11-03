// カレンダー：1日に予定が8件ある日のマスが 390px・320px で崩れないこと（行のマスの高さが揃う・「他n件」が欠けず見える・横にはみ出さない・押すとその日）。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const W of [390,320]){
 const c=await b.newContext({viewport:{width:W,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const d=new Date(TODAY);const o=new Date(d.getFullYear(),d.getMonth(),15);const s=ymd(o);
  S.tasks=[];for(let i=0;i<8;i++)S.tasks.push({id:'mm'+i,title:'とても長い名前の高圧受電設備の年次点検'+i,date:s,time:'',place:'',staff:'',status:i<3?'完了':'予定',result:i<3?'良':'',photos:[]});
  S.settings.showCrew=true;V.sel=TODAY;V.ym=undefined;go('month');window.__s=s});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const s=window.__s;const cell=[...document.querySelectorAll('.cal .d')].find(x=>(x.getAttribute('onclick')||'').includes(s));if(!cell)return null;
  const cr=cell.getBoundingClientRect();const row=[...document.querySelectorAll('.cal .d')].filter(x=>Math.abs(x.getBoundingClientRect().top-cr.top)<2).map(x=>Math.round(x.getBoundingClientRect().height));
  const mo=cell.querySelector('.more');const mr=mo&&mo.getBoundingClientRect();
  return{h:row,moreText:mo&&mo.textContent,moreIn:!!mo&&mr.bottom<=cr.bottom+1&&mr.right<=cr.right+1,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,s}});
 if(!r){bad.push(W+': マスが見つからない');continue}
 if(new Set(r.h).size>1)bad.push(W+': 同じ行のマスの高さが揃わない '+r.h);
 if(!r.moreText)bad.push(W+': 「他n件」が無い');else if(!r.moreIn)bad.push(W+': 「他n件」がマスからはみ出して見えない');
 if(r.sw>r.cw+2)bad.push(W+': 横にはみ出す '+r.sw);
 await p.evaluate(s=>{const cell=[...document.querySelectorAll('.cal .d')].find(x=>(x.getAttribute('onclick')||'').includes(s));cell.click()},r.s);await p.waitForTimeout(300);
 const sel=await p.evaluate(()=>V.sel);if(sel!==r.s)bad.push(W+': 押してもその日にならない '+sel);
 if(process.env.SHOT&&W===390)await p.screenshot({path:process.env.SHOT});
 await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
