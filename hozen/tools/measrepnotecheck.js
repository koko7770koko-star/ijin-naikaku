// 点検報告書（測定、printDoc t:'meas'）の所見：改行が紙でもそのまま残る（1 行にくっつかない）。40 行でも頁の境で割れて前の頁が空にならない（hz-v-print-longrow-2）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const note=Array.from({length:40},(_,i)=>'所見'+(i+1)+' 盤内の端子の緩みと発熱を確かめた').join('\n');
  S.meas=[{id:'mrn1',date:TODAY,by:'職員1',equipId:'',name:'絶縁抵抗測定',type:'',cond:{tplCond:'',temp:'',hum:'',weather:'',toolName:'',method:''},rows:Array.from({length:8},(_,i)=>({name:'回路'+i,v:'100',unit:'MΩ'})),note,photos:[]}];
  go('printDoc',{doc:{t:'meas',id:'mrn1'}})});await p.waitForTimeout(300);
 await p.emulateMedia({media:'print'});
 const r=await p.evaluate(()=>{const e=[...document.querySelectorAll('#app .rep p')].find(x=>/所見：/.test(x.textContent));if(!e)return {none:1};const lh=parseFloat(getComputedStyle(e).lineHeight)||16;return {lines:Math.round(e.getBoundingClientRect().height/lh),ws:getComputedStyle(e).whiteSpace}});
 if(r.none)bad.push('所見の段が無い');else{if(!/pre/.test(r.ws))bad.push('所見の改行が残らない（white-space '+r.ws+'）');if(r.lines<38)bad.push('所見が 40 行にならない（'+r.lines+' 行）')}
 const buf=await p.pdf({format:'A4'});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 if(n>2)bad.push('A4 '+n+' 枚になる');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
