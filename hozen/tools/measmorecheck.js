// 測定記録の一覧（保全・診断 → 測定記録）：500 件のとき 1 秒以内に出て、「さらに100件表示」でいちばん古い記録まで辿れ、絞り込み（種類・設備）が効くか。390px・文字「標準」「特大」ではみ出さない。保存の形は変えない（hz-v-meas-list-more）。
// usage: node hozen/tools/measmorecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;const T=TODAY;
  S.equipment=(S.equipment||[]).concat([{id:'eqA',name:'試しの変圧器A'},{id:'eqB',name:'試しの変圧器B'}].filter(e=>!eqById(e.id)).map(e=>({...e,kind:'変圧器',status:'稼働',importance:'',repairs:[]})));
  S.meas=[...Array(500)].map((_,i)=>({id:'ms'+i,date:addD(T,-i*2),type:i%2?'絶縁抵抗':'接地抵抗',name:'試しの測定'+i,equipId:i%5?'eqA':'eqB',by:'',rows:[{name:'R相',unit:'MΩ',min:'',max:'',ck:false,v:String(100+i)}],at:''}));
  save();applyFScale();V.msType='';V.measEq='';V.msMore=0},fs);
 const ms=await p.evaluate(()=>{const t=performance.now();go('diag',{dgTab:'meas'});return performance.now()-t});await p.waitForTimeout(300);
 if(ms>1000)bad.push(tag+'出るまで '+Math.round(ms)+'ms');
 const st=()=>p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')].filter(x=>/試しの測定\d+/.test(x.textContent));
  return {n:it.length,last:it.length?it[it.length-1].textContent:'',ids:it.map(x=>+(x.textContent.match(/試しの測定(\d+)/)||[])[1]),
   more:[...document.querySelectorAll('#app button')].filter(x=>/さらに100件表示/.test(x.textContent)).map(x=>x.textContent.trim())[0]||'',sw:document.documentElement.scrollWidth}});
 const more=async()=>{await p.evaluate(()=>{[...document.querySelectorAll('#app button')].find(x=>/さらに100件表示/.test(x.textContent)).click()});await p.waitForTimeout(200)};
 let r=await st();if(r.n!==100)bad.push(tag+'先頭の件数 '+r.n);if(!/残り 400件/.test(r.more))bad.push(tag+'ボタン '+r.more);
 if(r.ids.some((v,i)=>i&&v<r.ids[i-1]))bad.push(tag+'新しい順でない');
 for(let k=0;k<4;k++)await more();r=await st();if(r.n!==500)bad.push(tag+'全件出ない '+r.n);if(r.more)bad.push(tag+'全部出たのにボタン');
 if(!/試しの測定499/.test(r.last))bad.push(tag+'最後が最古でない '+r.last.slice(0,40));if(r.sw>392)bad.push(tag+'はみ出す '+r.sw);
 await p.evaluate(()=>{V.msType='絶縁抵抗';render()});await p.waitForTimeout(200);r=await st();
 if(r.ids.some(v=>v%2!==1))bad.push(tag+'種類の絞り込みが効かない');if(r.n!==250)bad.push(tag+'種類で250件にならない '+r.n);
 await p.evaluate(()=>{V.msType='';V.measEq='eqB';V.msMore=0;render()});await p.waitForTimeout(200);r=await st();
 if(r.ids.some(v=>v%5!==0))bad.push(tag+'設備の絞り込みが効かない');if(r.n!==100||r.more)bad.push(tag+'設備で100件ちょうど '+r.n+' '+r.more);
 if(r.sw>392)bad.push(tag+'絞り込みではみ出す '+r.sw);
 const keep=await p.evaluate(()=>S.meas.length===500);if(!keep)bad.push(tag+'記録の数が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
