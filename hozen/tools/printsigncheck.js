// 印刷：カレンダーの予定表と盤の空の点検表の右上に「担当・確認・承認」の印の欄があり、画面には出ない・A4に収まる・保存の形は変わらない
// usage: node hozen/tools/printsigncheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0);
 const keys0=await p.evaluate(()=>Object.keys(S).sort().join());
 await p.evaluate(()=>{V.view='month';V.y=2027;V.m=1;render()});await p.waitForTimeout(300);
 const scr=await p.evaluate(()=>[...document.querySelectorAll('.pstamp')].map(e=>getComputedStyle(e).display));
 if(!scr.length)bad.push('カレンダーに印の欄が無い');if(scr.some(d=>d!=='none'))bad.push('画面に印の欄が出ている');
 const pdf=await p.pdf({preferCSSPageSize:true,printBackground:true});
 if((pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length!==1)bad.push('カレンダーの印刷が1ページでない');
 await p.emulateMedia({media:'print'});
 const r=await p.evaluate(()=>{const e=document.querySelector('.mprint .pstamp');if(!e)return null;const rc=e.getBoundingClientRect();return {d:getComputedStyle(e).display,h:rc.height,r:innerWidth-rc.right,txt:e.innerText.replace(/\s+/g,'')}});
 if(!r||r.d==='none')bad.push('印刷で印の欄が出ない');else{if(r.txt!=='担当確認承認')bad.push('印の言葉 '+r.txt);if(r.h<30)bad.push('印の欄が小さい '+r.h)}
 await p.emulateMedia({media:'screen'});
 // 盤の空の点検表
 await p.evaluate(()=>{S.locs=[{id:'lb',type:'建屋',parent:'',name:'A棟',note:'',pos:{floor:'',x:'',y:'',z:''}},{id:'lf',type:'階',parent:'lb',name:'1F',note:'',pos:{floor:'',x:'',y:'',z:''}},{id:'lx',type:'盤',parent:'lf',name:'盤1',note:'',pos:{floor:'',x:'',y:'',z:''}}];save();go('ban')});await p.waitForTimeout(400);
 const bn=await p.evaluate(()=>document.querySelectorAll('.banprint .pstamp').length);if(bn<1)bad.push('盤の空の点検表に印の欄が無い');
 await p.evaluate(()=>document.body.classList.add('bbp'));await p.emulateMedia({media:'print'});
 const bp=await p.evaluate(()=>{const e=document.querySelector('.banprint .pstamp');return e?getComputedStyle(e).display:'none-missing'});if(bp==='none'||bp==='none-missing')bad.push('盤の印刷で印の欄が出ない '+bp);
 await p.emulateMedia({media:'screen'});await p.evaluate(()=>document.body.classList.remove('bbp'));
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))bad.push('横にはみ出す');
 const keys1=await p.evaluate(()=>Object.keys(S).sort().join());if(keys0!==keys1)bad.push('保存の項目が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
