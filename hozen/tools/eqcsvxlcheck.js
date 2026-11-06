// 設備台帳 CSV 読み込みの確かめの窓：文字「大」「特大」・360px・設備10行（新しい4・上書き4・まちがい2）で、窓が横にはみ出さない・ボタンが44px以上・文が欄から出ない（hz-l-csv-import）
// usage: node hozen/tools/eqcsvxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{if(f){S.settings.fscale=f;applyFScale()}
  S.equipment=[...Array(4)].map((_,i)=>({id:'e'+i,code:'E-00'+i,name:'設備'+i,place:'',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[]}));save();go('equip')},fs);await p.waitForTimeout(300);
 await p.evaluate(()=>{const H='区分,設備ID,設備名称,設置場所,メーカー,型式,製造番号,設置年月,点検周期\r\n';let t=H;
  for(let i=0;i<4;i++)t+='設備,E-00'+i+',設備'+i+',別の場所'+i+',,,,,\r\n';
  for(let i=0;i<4;i++)t+='設備,E-10'+i+',新しい設備'+i+',A棟,,,,2020-05,\r\n';
  t+='設備,E-200,新しい設備のとても長い名前のテスト,A棟,,,,2020-13,\r\n履歴,E-300,設備,,,,,,\r\n';
  const f=new File(['﻿'+t],'eq.csv',{type:'text/csv'});importEquipCsv({files:[f],value:''})});
 await p.waitForFunction(()=>document.querySelector('#mask.on #modal')||document.querySelector('#modal h3'),null,{timeout:5000}).catch(()=>{});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const M=document.querySelector('#modal'),W=document.documentElement.clientWidth,o=[];
  if(!/読み込み/.test(M.textContent))o.push('窓が出ない '+M.textContent.slice(0,30));
  if(M.scrollWidth>M.clientWidth+1)o.push('modal横スクロール '+M.scrollWidth+'>'+M.clientWidth);
  for(const e of M.querySelectorAll('button,.al,b')){const q=e.getBoundingClientRect();if(!q.width)continue;if(q.right>W+1||q.left<-1)o.push('はみ出す '+e.tagName+' '+e.textContent.trim().slice(0,10));
   if(e.tagName==='BUTTON'&&q.height<44)o.push('btn<44 '+e.textContent.trim().slice(0,8)+' '+Math.round(q.height));
   if(e.tagName==='B'&&q.height>e.parentElement.getBoundingClientRect().height)o.push('太字が親より高い '+e.textContent)}
  for(const e of M.querySelectorAll('.al')){if(e.scrollWidth>e.clientWidth+1)o.push('文が欄から出る '+e.textContent.trim().slice(0,12))}
  return o});for(const x of r)errs.push(w+'px・'+fs+'：'+x);
 await c.close()}console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
