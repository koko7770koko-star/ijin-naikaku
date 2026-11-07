// 点検履歴：去年・一昨年の記録が一覧で年付き（今年は年なし）で新しい順に出て、期間を年をまたいで（12/1〜1/31）選ぶとその間だけ出て、
// 画面の「該当 n日」・一覧の行数・CSV の行数・印刷の表の行数が同じか。押すとその日の日常点検へ行く。記録は変えない（hz-v-hist-oldyear）。
// usage: node hozen/tools/histoldyearcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const Y=await p.evaluate(()=>{const y=+TODAY.slice(0,4),n=numDefs()[0];S.daily={};
  [(y-2)+'-12-20',(y-1)+'-11-30',(y-1)+'-12-01',(y-1)+'-12-31',y+'-01-01',y+'-01-31',y+'-02-01'].forEach((d,i)=>{S.daily[d]={[n.id]:10+i,c:{},by:'確認'+i}});save();return y});
 const before=await p.evaluate(()=>JSON.stringify(S.daily));
 const look=()=>p.evaluate(()=>{const it=[...document.querySelectorAll('#app .card.noprint .item')].filter(x=>/確認\d/.test(x.textContent));
  return {cnt:+((document.getElementById('hCount')||{textContent:''}).textContent.match(/(\d+)日/)||[])[1],n:it.length,dt:it.map(x=>x.querySelector('.dt').textContent.replace(/（.）/,'')),
   pr:document.querySelectorAll('.hprint table.hpt tbody tr').length,sw:document.documentElement.scrollWidth}});
 const csv=async()=>p.evaluate(async()=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text()};return true};exportDailyCsv();for(let k=0;k<40&&!window.__out;k++)await new Promise(r=>setTimeout(r,50));return window.__out?window.__out.t.replace(/^﻿/,'').split('\r\n').filter(Boolean).length-1:-1});
 await p.evaluate(()=>{V.hItem='';V.hNg=false;V.hKw='';V.hRange='all';go('hist')});await p.waitForTimeout(250);
 let r=await look();
 if(r.n!==7||r.cnt!==7)bad.push('全期間の件数 '+r.n+'/'+r.cnt);
 const want=[Y+'-02-01',Y+'-01-31',Y+'-01-01',(Y-1)+'-12-31',(Y-1)+'-12-01',(Y-1)+'-11-30',(Y-2)+'-12-20'].map(d=>(+d.slice(0,4)===Y?'':d.slice(0,4)+'/')+(+d.slice(5,7))+'/'+(+d.slice(8,10)));
 if(r.dt.join(',')!==want.join(','))bad.push('日付の出方 '+r.dt.join(',')+' / '+want.join(','));
 await p.evaluate(y=>{V.hRange='custom';V.hFrom=(y-1)+'-12-01';V.hTo=y+'-01-31';render()},Y);await p.waitForTimeout(250);
 r=await look();const n=await csv();
 if(r.n!==4)bad.push('12/1〜1/31 の一覧 '+r.n+'（4 のはず）');if(r.cnt!==4)bad.push('該当 '+r.cnt);if(n!==4)bad.push('CSV の行数 '+n);if(r.pr!==4)bad.push('印刷の表の行数 '+r.pr);
 if(r.sw>392)bad.push('はみ出す '+r.sw);
 await p.evaluate(()=>[...document.querySelectorAll('#app .card.noprint .item')].find(x=>/確認3/.test(x.textContent)).click());await p.waitForTimeout(250);
 const g=await p.evaluate(()=>({v:V.view,d:V.day}));if(g.v!=='day'||g.d!==(Y-1)+'-12-31')bad.push('押しても去年の 12/31 へ行かない '+JSON.stringify(g));
 const after=await p.evaluate(()=>JSON.stringify(S.daily));if(after!==before)bad.push('見ただけで記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
