// 点検履歴のCSVの確認：表示の絞り込み（項目・基準外だけ・期間）のとおりに書き出す・項目を選んだらその列だけ・該当なしなら書き出さない。
// 書き出しは window.hzSave を差し替えて受け取る（アーティファクトの downloads でも同じ入口）。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const csv=async(prep)=>p.evaluate(async(prep)=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text()};return true};
   eval(prep);exportDailyCsv();await new Promise(r=>setTimeout(r,200));return window.__out},prep);
 await p.evaluate(()=>{const n=numDefs()[0];n.min=0;n.max=100;for(let i=0;i<10;i++){const d=addD(TODAY,-i);S.daily[d]={[n.id]:i%2?150:50,c:{},by:'確認'};}save()}); // 奇数日は上限100を超える（基準外）
 const all=await csv("V.hRange='30';V.hItem='';V.hNg=false;V.hKw=''");
 const nRows=a=>a.t.replace(/^﻿/,'').split('\r\n').length-1;
 if(!all||nRows(all)<10)bad.push('全件が出ない '+(all&&nRows(all)));
 const ng=await csv("V.hNg=true");if(!ng||nRows(ng)>=nRows(all)||nRows(ng)<1)bad.push('基準外だけの絞り込みが反映されない '+(ng&&nRows(ng)));
 const it=await csv("V.hNg=false;V.hItem=numDefs()[0].id");const hd=it&&it.t.split('\r\n')[0].split(',').length;const hdAll=all&&all.t.split('\r\n')[0].split(',').length;
 if(!it||!(hd<hdAll))bad.push('項目を選んでも列が減らない '+hd+'/'+hdAll);if(it&&!/日常点検_/.test(it.n))bad.push('ファイル名が変');
 const none=await csv("V.hItem='';V.hKw='存在しない言葉zzz'");if(none)bad.push('該当なしでも書き出した');
 await p.evaluate(()=>{V.hKw='';go('hist')});await p.waitForTimeout(300);
 if(!/CSVに書き出す（\d+日分）/.test(await p.evaluate(()=>document.querySelector('#app').innerText))||!/該当 \d+日/.test(await p.evaluate(()=>document.querySelector('#app').innerText)))bad.push('ボタンの表示が分かりにくい');
 await p.evaluate(()=>{V.hKw='存在しない言葉zzz';render()});await p.waitForTimeout(200);
 const nb=await p.evaluate(()=>{const b=[...document.querySelectorAll('#app button')].find(x=>/CSVに書き出す/.test(x.textContent));return b&&b.getAttribute('aria-disabled')==='true'&&/期間や絞り込み/.test(document.querySelector('#app').innerText)});if(!nb)bad.push('0件のとき CSV が押せない見た目になっていない・案内が無い');
 await p.evaluate(()=>{V.hKw='';S.daily={};render()});await p.waitForTimeout(200);
 if(!(await p.evaluate(()=>[...document.querySelectorAll('#app button')].some(x=>/日常点検を入力する/.test(x.textContent)&&x.getBoundingClientRect().height>=44))))bad.push('記録が無いとき日常点検への入口が無い');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
