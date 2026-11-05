// 文字「大」「特大」・360px：QR の画面（qr）と AI の画面（ai・キー未設定・通信なし）で、ボタンが44px以上で中身がはみ出さず、
// 入力欄・札がページの横にはみ出さず、短い言葉が途中で割れないことを、設備12台で確かめる。通信は止める。hz-l-qr-ai
// usage: node hozen/tools/qraixlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
 const c=await b.newContext({viewport:{width:360,height:800}});const p=await c.newPage();const tag='360px・'+({xl:'特大',l:'大'})[fs];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{sessionStorage.removeItem(KEYSTORE);localStorage.removeItem(KEYSTORE);S.settings.fscale=f;applyFScale();
  S.equip=[...Array(12)].map((_,i)=>({id:'eq'+i,name:'設備'+(i+1),cat:'受変電',loc:'',maker:'',model:'',serial:'',note:''}))},fs);
 for(const name of ['qr','ai']){
  await p.evaluate(v=>go(v),name);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const o={page:document.documentElement.scrollWidth,btn:[],over:[],inp:[],split:[]};
   for(const e of document.querySelectorAll('#app button,#app .btn')){const q=e.getBoundingClientRect();if(!q.width||getComputedStyle(e).display==='none')continue;
    const t=(e.textContent||'').trim().slice(0,10);if(q.height<43.5)o.btn.push(t+':'+Math.round(q.height));
    if(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)o.over.push(t)}
   for(const e of document.querySelectorAll('#app input:not([type=checkbox]):not([type=radio]),#app select,#app textarea')){const q=e.getBoundingClientRect();if(q.width&&(q.right>innerWidth+1||q.left<-1))o.inp.push((e.name||e.id||e.tagName)+':'+Math.round(q.right))}
   for(const e of document.querySelectorAll('#app .aibadge,#app .badge,#app .pill,#app .tag')){const q=e.getBoundingClientRect();if(!q.width)continue;const fsz=parseFloat(getComputedStyle(e).fontSize);
    if(e.children.length===0&&(e.textContent||'').trim().length<=14&&q.height>fsz*2.2)o.split.push((e.textContent||'').trim()+':'+Math.round(q.height))}
   return o});
  if(r.page>362)errs.push(tag+'・'+name+'：横にはみ出す '+r.page);
  if(r.btn.length)errs.push(tag+'・'+name+'：44px未満のボタン '+r.btn.join(' '));
  if(r.over.length)errs.push(tag+'・'+name+'：ボタンの中身がはみ出す '+r.over.join(' '));
  if(r.inp.length)errs.push(tag+'・'+name+'：入力欄がはみ出す '+r.inp.join(' '));
  if(r.split.length)errs.push(tag+'・'+name+'：短い言葉が割れる '+r.split.join(' '));
  if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+'/qa-'+fs+'-'+name+'.png',fullPage:true})}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
