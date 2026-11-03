// 設備カルテの確認：390px で開いた最初の画面に「次の点検・最後の点検・未完了の異常」と、測定・異常のボタン（44px以上）が出る。横にはみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 for(const kind of ['変圧器','発電機']){
  await p.evaluate(k=>{const e=eqById((S.equipment[0]||{}).id)||null;S.equipment=[{id:'eqT',code:'',name:'試験設備',kind:k,place:'',maker:'',model:'',serial:'',installed:'',cycle:'',photos:[],docs:[],repairs:[],run:{meters:[]},spec:{}}];S.issues=[{id:'isT',equipId:'eqT',title:'試験の異常',status:'未対応',date:'2026-01-01'}];go('equipDetail',{eq:'eqT'})},kind);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const H=window.innerHeight,t=document.querySelector('#app').innerText,btn=[...document.querySelectorAll('#app .card:first-of-type .btn')].map(x=>{const q=x.getBoundingClientRect();return{h:q.height,b:q.bottom}}).filter(x=>x.h>0);const th=[...document.querySelectorAll('#app th')].map(x=>x.textContent);return{H,th,btn,sw:document.documentElement.scrollWidth,t:t.slice(0,300)}});
  for(const w of ['次の点検','最後の点検','未完了の異常'])if(!r.th.includes(w))bad.push(kind+'：「'+w+'」が先頭に無い');
  if(!r.btn.length||r.btn.some(x=>x.h<44))bad.push(kind+'：ボタンが小さい '+JSON.stringify(r.btn));
  if(r.btn.some(x=>x.b>r.H))bad.push(kind+'：ボタンが最初の画面に入らない');
  if(r.sw>392)bad.push(kind+'：横にはみ出す');
  if(!/試験の異常/.test(r.t)&&!/1件/.test(r.t))bad.push(kind+'：未完了の異常が出ない');
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
