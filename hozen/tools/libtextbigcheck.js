// 技術資料（lib）：本文が上限の 3 万字の資料を 50 件（計 150 万字）入れても、一覧と探す欄が 1 秒以内、資料の窓が開けて本文が全部入り、
// さらに足して保存の上限（約 520 万字）を超えたら、上の帯で「保存できない」と分かる（黙って消えない）・減らせば保存が戻るか。390px（hz-v-lib-text-big）。
// 保存の形（S.library）は変えない。usage: node hozen/tools/libtextbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 const mk=(n,from)=>p.evaluate(([n,from])=>{const body=k=>('資料'+k+'の本文。受変電設備の点検手順と注意事項。'.repeat(2000)).slice(0,29960)+(k===17?'絶縁抵抗の判定は500Vで1MΩ以上':'').padEnd(40,'。');
  for(let i=from;i<from+n;i++)S.library.push({id:'L'+i,title:'大きい資料'+(i+1),tags:'手順',text:body(i).slice(0,30000),file:'',type:'',equipIds:[]});save()},[n,from]);
 await p.evaluate(()=>{S.library=[]});await mk(50,0);await p.waitForTimeout(400);
 const st=()=>p.evaluate(()=>({fail:SAVE_FAIL.app,bar:(document.getElementById('sysbar')||{innerText:''}).innerText,ls:(localStorage.getItem('hospElecSched_v1')||'').length}));
 let r=await st();if(r.fail)bad.push('150 万字で保存できない');const n1=await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).library.length);if(n1!==50)bad.push('保存された資料 '+n1);
 let s=Date.now();await p.evaluate(()=>{V.libQ='';go('lib')});await raf();tm.list=Date.now()-s;
 const items=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(items<50)bad.push('一覧の件数 '+items);
 s=Date.now();await p.evaluate(()=>{V.libQ='判定は500V';render()});await raf();tm.search=Date.now()-s;
 const hit=await p.evaluate(()=>({mark:[...document.querySelectorAll('#app mark')].map(m=>m.textContent).join('|'),t:document.querySelector('#app').innerText}));if(!/大きい資料18/.test(hit.t)||!hit.mark)bad.push('探すと当たらない '+hit.mark);
 s=Date.now();await p.evaluate(()=>editLib('L17'));await p.waitForSelector('#lb_text');tm.modal=Date.now()-s;
 const len=await p.evaluate(()=>[document.getElementById('lb_text').value.length,S.library.find(x=>x.id==='L17').text.length]);if(len[0]!==len[1]||len[1]!==30000)bad.push('窓の本文 '+len.join('/')+' 字');
 await p.evaluate(()=>closeModal(true));
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 // 上限を超えるまで足す（さらに 200 件・600 万字 → 超える）
 await mk(200,50);await p.waitForTimeout(400);r=await st();
 if(!r.fail)bad.push('上限を超えても保存できない印が出ない（'+r.ls+' 字）');const barOver=r.bar;if(r.fail&&!/保存/.test(r.bar))bad.push('上の帯に保存できないと出ない '+r.bar.slice(0,60));
 // 減らすと保存が戻る
 await p.evaluate(()=>{S.library=S.library.slice(0,50);save()});await p.waitForTimeout(400);r=await st();
 if(r.fail)bad.push('減らしても保存が戻らない');const n2=await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).library.length);if(n2!==50)bad.push('戻した後の保存 '+n2);
 for(const k in tm)if(tm[k]>1000)bad.push(k+' '+tm[k]+'ms');
 console.log(JSON.stringify(tm)+'・上限の帯 '+JSON.stringify(barOver.slice(0,40)));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
