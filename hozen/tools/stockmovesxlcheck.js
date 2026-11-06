// 在庫の入出庫履歴（直近20件）と工具・測定器の一覧（校正期限の札）：文字「大」「特大」・360px で、横にはみ出さない・日付と数が割れない・札が行からはみ出さない・行が44px以上（hz-l-stock-moves）
// usage: node hozen/tools/stockmovesxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{if(f){S.settings.fscale=f;applyFScale()}
  S.parts=[...Array(3)].map((_,i)=>({id:'pm'+i,code:'P-'+(1000+i),name:'高圧ケーブル終端接続部（長い品名のテスト）'+i,spec:'',maker:'',place:'',unit:['個','本','m'][i],qty:50,min:2,price:1200,equipIds:[],note:''}));
  S.moves=[...Array(20)].map((_,i)=>({id:'m'+i,partId:'pm'+(i%3),date:addD(TODAY,-i),type:['入庫','出庫','棚卸'][i%3],qty:12345,after:99999,ref:i%2?'issue:x':'work:y',by:'職員'+(i%5+1)+'（長い名前のテスト）',note:'備考の文のテスト'}));
  S.tools=[...Array(6)].map((_,i)=>({id:'t'+i,code:'T-00'+i,name:'絶縁抵抗計（長い名称のテスト・高圧用）'+i,kind:'測定器',maker:'',model:'',serial:'',place:'',calDue:addD(TODAY,[-5,10,100,-40,20,300][i]),calCycleM:12,note:'',calHist:[],loans:i%2?[{id:'l'+i,to:'職員'+i+'（長い貸出先のテスト）',out:addD(TODAY,-3),due:addD(TODAY,-1),back:'',note:''}]:[]}));
  save();go('stock',{stTab:'parts'})},fs);await p.waitForTimeout(400);
 const run=async nm=>{const r=await p.evaluate(()=>{const W=document.documentElement.clientWidth,o=[];if(document.documentElement.scrollWidth>W+1)o.push('ページ横スクロール '+document.documentElement.scrollWidth+'>'+W);
   for(const it of document.querySelectorAll('#app .item')){const q=it.getBoundingClientRect();if(q.right>W+1)o.push('行がはみ出す '+it.textContent.trim().slice(0,10));if(q.height<44)o.push('行<44 '+Math.round(q.height));
        for(const e of it.querySelectorAll('.pill')){const x=e.getBoundingClientRect();if(x.right>q.right+1||x.left<q.left-1)o.push('札がはみ出す '+e.textContent.trim().slice(0,10))}}
   return o});for(const x of new Set(r))errs.push(tag+'・'+nm+'：'+x)};
 await run('予備品・履歴');
 const dts=await p.evaluate(()=>[...document.querySelectorAll('#app .item .dt')].filter(e=>/^\d{1,2}\/\d{1,2}$/.test(e.textContent.trim())).map(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length>1?e.textContent:''}).filter(Boolean));
 if(dts.length)errs.push(tag+'：日付が2行に割れる '+dts[0]);
 const nd=await p.evaluate(()=>[...document.querySelectorAll('#app .item .dt')].filter(e=>/^\d{1,2}\/\d{1,2}$/.test(e.textContent.trim())).length);if(nd!==20)errs.push(tag+'：履歴の行が20件出ない '+nd);
 await p.evaluate(()=>{go('stock',{stTab:'tools'})});await p.waitForTimeout(300);await run('工具');
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
