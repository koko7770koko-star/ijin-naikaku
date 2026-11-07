// メニューの「まとめて探す」：場所 3000（棟→階→電気室→盤）・設備 500・不具合 3000・作業 1000・資料 200・図面 100・予備品 300 で、
// 一文字ずつ打つたびに 0.3 秒以内、種類ごとの件数が正しく、押すとその記録へ飛べ、はみ出さないか（標準・特大。hz-v-search-menu-many）。
// usage: node hozen/tools/menusearchmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=300;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;const L=[];
  for(let bI=0;bI<6;bI++){L.push({id:'b'+bI,name:'ABCDEF'[bI]+'棟',type:'建屋',parent:'',note:'',pos:{}});for(let fI=0;fI<5;fI++){L.push({id:'f'+bI+'_'+fI,name:(fI+1)+'階',type:'階',parent:'b'+bI,note:'',pos:{}});for(let r=0;r<4;r++){const rid='r'+bI+'_'+fI+'_'+r;L.push({id:rid,name:'第'+(r+1)+'電気室',type:'電気室',parent:'f'+bI+'_'+fI,note:'',pos:{}});for(let k=0;k<24;k++)L.push({id:'p'+rid+'_'+k,name:'動力盤-'+(k+1),type:'盤',parent:rid,note:'',pos:{}})}}}
  S.locs=L;const pans=L.filter(x=>x.type==='盤');
  S.equipment=[...Array(500)].map((_,i)=>({id:'eq'+i,code:'EQ-'+String(i).padStart(4,'0'),name:(i%10?'変圧器':'トランス')+i+'（高圧受変電設備）',kind:'変圧器',locId:pans[i%pans.length].id,status:'稼働',maker:'○○電機',model:'TR-'+i,serial:'',place:'',repairs:[],photos:[],docs:[]}));
  S.issues=[...Array(3000)].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:addD(TODAY,-(i%900)),title:'異常'+i+' 真空遮断器の異音',detail:'詳細',place:'',status:'完了',urgency:'中',equipId:'eq'+(i%500),action:'',cause:'',closed:TODAY,photos:[],log:[]}));
  S.works=[...Array(1000)].map((_,i)=>({id:'wk'+i,no:'W-'+i,date:TODAY,endDate:'',title:'作業'+i+' 受変電設備の点検',kind:'点検',status:'完了',equipId:'',place:'',vendor:'',content:'',staff:[],needQuals:[],steps:[],approvals:[],hist:[],issueId:'',note:'',outage:{on:false}}));
  S.library=[...Array(200)].map((_,i)=>({id:'lb'+i,title:'資料'+i+' 取扱説明書',tags:'',text:'本文 '.repeat(50),file:'',type:'',equipIds:[]}));
  S.drawings=[...Array(100)].map((_,i)=>({id:'dw'+i,name:'図面'+i+' 単線結線図',kind:'単線結線図',locId:L[i*7].id,vers:[],pins:[]}));
  S.parts=[...Array(300)].map((_,i)=>({id:'pt'+i,code:'P-'+i,name:'部品'+i,spec:'',maker:'',place:'',unit:'個',qty:3,min:1,price:0,equipIds:[],note:''}));
  applyFScale();go('menu')},fs);await p.waitForTimeout(300);
 const typ=[];const word='トランス 1';let cur='';
 for(const ch of word){cur+=ch;typ.push(Math.round(await p.evaluate(q=>{const e=document.querySelector('#mallQ');e.value=q;const s=performance.now();menuAll(q);return performance.now()-s},cur)))}
 if(Math.max(...typ)>LIM)bad.push(tag+'打つたび '+typ.join('/')+'ms');
 const r=await p.evaluate(()=>({grp:[...document.querySelectorAll('#mall .mgrp')].map(e=>e.textContent.replace(/\s+/g,' ')),sw:document.documentElement.scrollWidth,cut:[...document.querySelectorAll('#mall .item')].filter(x=>x.getBoundingClientRect().right>391).length}));
 const want=await p.evaluate(()=>S.equipment.filter(e=>{const h=sFold([e.code,e.name,e.place,e.maker,e.model,e.serial,e.kind,locPath(e.locId)].join(' '));return h.includes(sFold('トランス'))&&h.includes('1')}).length);
 if(!r.grp.some(g=>new RegExp('設備 '+want+'件').test(g)))bad.push(tag+'設備の件数が違う '+JSON.stringify(r.grp)+' / '+want);if(r.sw>392||r.cut)bad.push(tag+'はみ出す');
 const t2=Math.round(await p.evaluate(()=>{const s=performance.now();menuAll('第3電気室');return performance.now()-s}));if(t2>LIM)bad.push(tag+'場所で探す '+t2+'ms');
 const g2=await p.evaluate(()=>[...document.querySelectorAll('#mall .mgrp')].map(e=>e.textContent.replace(/\s+/g,' ')).join('|'));if(!/設備/.test(g2))bad.push(tag+'場所（電気室）の名前で設備が出ない '+g2);
 await p.evaluate(()=>menuAll('異常2999'));await p.click('#mall .item');await p.waitForTimeout(300);if(!await p.evaluate(()=>document.querySelector('#mask').classList.contains('on')&&/異常2999/.test(document.querySelector('#modal').innerHTML)))bad.push(tag+'不具合が開かない');
 console.log(tag+'打つたび '+typ.join('/')+'ms・場所 '+t2+'ms');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
