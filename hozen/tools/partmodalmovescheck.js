// 予備品の窓：入出庫が 5000 件ある品で、窓が 1 秒以内に開き、履歴は最近 50 件＋「ほか4950件を表示」で全件まで出て、
// 押しても入力中の値（備考）が消えず、保存のボタンが画面の中にあり、＋入庫・−出庫・棚卸が押せる。少ない品ではボタンが出ない。
// 390px。保存の形は変えない（hz-v-partmodal-moves-many）。usage: node hozen/tools/partmodalmovescheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY;S.parts=[{id:'p0',name:'部品A',code:'',spec:'',maker:'',place:'',qty:10,min:'',unit:'個',price:'',equipIds:[],note:''},{id:'p1',name:'部品B',code:'',spec:'',maker:'',place:'',qty:3,min:'',unit:'個',price:'',equipIds:[],note:''}];
  S.moves=[...Array(5000)].map((_,i)=>({id:'m'+i,date:addD(T,-i),partId:'p0',type:i%2?'出庫':'入庫',qty:1,after:10,by:'',ref:'',note:'メモ'+i})).concat([{id:'x',date:TODAY,partId:'p1',type:'入庫',qty:3,after:3,by:'',ref:'',note:''}]);save();go('stock',{stTab:'parts'})});
 await p.waitForTimeout(300);const keys0=await p.evaluate(()=>localStorage.getItem('hospElecSched_v1').length);
 let s=Date.now();await p.evaluate(()=>editPart('p0'));await p.waitForSelector('#pt_name');const tOpen=Date.now()-s;if(tOpen>1000)bad.push('窓が開くのに '+tOpen+'ms');
 const rows=()=>p.evaluate(()=>[...document.querySelectorAll('.grp .meta')].filter(x=>/（残 /.test(x.textContent)).length);
 let n=await rows();if(n!==50)bad.push('最初の履歴 '+n);
 const btn=await p.evaluate(()=>(document.getElementById('ptMvMore')||{textContent:''}).textContent);if(!/ほか4950件/.test(btn))bad.push('ボタン '+btn);
 const h=await p.evaluate(()=>{const e=document.getElementById('ptMvMore');return e?e.getBoundingClientRect().height:0});if(h&&h<44)bad.push('ボタンが 44px 未満 '+h);
 const first=await p.evaluate(()=>document.querySelector('.grp .meta').textContent);if(!/メモ0$/.test(first))bad.push('新しい順でない '+first);
 await p.fill('#pt_note','入力中');
 s=Date.now();await p.click('#ptMvMore');await p.waitForTimeout(20);const tMore=Date.now()-s-20;if(tMore>1000)bad.push('全件を出すのに '+tMore+'ms');
 n=await rows();if(n!==5000)bad.push('全件 '+n);if(await p.$('#ptMvMore'))bad.push('全件の後もボタン');
 const last=await p.evaluate(()=>{const a=[...document.querySelectorAll('.grp .meta')];return a[a.length-1].textContent});if(!/メモ4999$/.test(last))bad.push('最古が出ない '+last);
 if(await p.inputValue('#pt_note')!=='入力中')bad.push('入力中の値が消えた');
 const sv=await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='保存'&&x.offsetParent);if(!b)return null;const r=b.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0});if(!sv)bad.push('保存のボタンが画面の中に無い');
 for(const t of ['＋ 入庫','− 出庫','棚卸']){const ok=await p.evaluate(t=>!![...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t),t);if(!ok)bad.push('ボタンが無い '+t)}
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 await p.evaluate(()=>closeModal(true));await p.waitForTimeout(100);
 await p.evaluate(()=>editPart('p1'));await p.waitForSelector('#pt_name');if(await p.$('#ptMvMore'))bad.push('少ない品でボタン');n=await rows();if(n!==1)bad.push('少ない品の履歴 '+n);
 await p.evaluate(()=>closeModal(true));await p.waitForTimeout(400);
 if(await p.evaluate(()=>localStorage.getItem('hospElecSched_v1').length)!==keys0)bad.push('開いただけで記録が変わった');
 console.log('開く '+tOpen+'ms・全件 '+tMore+'ms');console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
