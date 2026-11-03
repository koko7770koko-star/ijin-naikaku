// 在庫画面（予備品・工具・予算）の量が多いときの確認：予備品30品目（名前40字・最低在庫を下回る物を含む）・工具10点・予算12行で
// 390px の3つのタブを開き、行・−/＋ボタン・印・表が切れたり重なったり横にはみ出したりしない、エラーが無いことを確かめる。
// usage: node hozen/tools/stockmanycheck.js [画像の出力先フォルダ]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{const nm=i=>'高圧ケーブルヘッド用ストレスコーン 3心 150sq 屋内'+(i+1)+'番'.padEnd(2,'　');
  S.parts=[...Array(30)].map((_,i)=>({id:'pm'+i,code:'P-'+(1000+i),name:nm(i).slice(0,40),spec:'型式 ABCDEFGHIJ-1234567890 定格 6.6kV',maker:'○○電機',place:'○○棟 地下1階 予備品庫 第3棚',unit:'個',qty:i%3?5:1,min:i%3?2:3,price:1200,equipIds:[],note:''}));
  S.tools=[...Array(10)].map((_,i)=>({id:'tm'+i,code:'T-'+i,name:'絶縁抵抗計 高電圧用 長い名前の測定器の例 '+(i+1),kind:i%2?'測定器':'工具',maker:'○○計器株式会社',model:'ABCDE-12345',serial:'',place:'○○棟 電気室',calDue:i%2?addD(TODAY,i*20-40):'',calCycleM:'12',calHist:[],loans:i%3===0?[{id:'l'+i,out:TODAY,to:'○○電気工事株式会社 第二営業所',due:addD(TODAY,3),back:'',note:''}]:[],note:''}));
  S.budget=[...Array(12)].map((_,i)=>({id:'bm'+i,fy:fyNow(),cat:BUDGET_CATS[i%BUDGET_CATS.length],name:'年間保守契約 受変電設備 定期点検委託 長い内訳の例 '+(i+1),amount:1234567*(i+1)}));
  save();go('stock',{stTab:'parts'})});await p.waitForTimeout(500);
 for(const [tab,sel] of [['parts','#app .item'],['tools','#app .item'],['budget','#app .item']]){
  await p.evaluate(t=>{V.stTab=t;render()},tab);await p.waitForTimeout(400);
  const r=await p.evaluate(sel=>{const rows=[...document.querySelectorAll(sel)];const sw=document.documentElement.scrollWidth;
   const cut=rows.filter(x=>{const q=x.getBoundingClientRect();return q.right>391||x.scrollWidth>x.clientWidth+1}).length;
   const pills=[...document.querySelectorAll('#app .item .pill')].filter(x=>x.getBoundingClientRect().right>390||x.scrollWidth>x.clientWidth+1).length;
   let ov=0;rows.forEach(x=>{const ps=[...x.querySelectorAll('.pill,.pqb button')].map(e=>e.getBoundingClientRect());for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],c=ps[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)ov++}});
   const bs=[...document.querySelectorAll('.pqb button')];const bsm=bs.length?Math.min(...bs.map(x=>Math.min(x.getBoundingClientRect().height,x.getBoundingClientRect().width))):99;
   const bcut=bs.filter(x=>x.getBoundingClientRect().right>390).length;
   const tw=document.querySelector('.tblwrap'),tcut=tw?tw.getBoundingClientRect().right>391:false;
   const al=document.querySelector('#app .al'),alc=al?al.scrollWidth>al.clientWidth+1||al.getBoundingClientRect().right>391:false;
   return {n:rows.length,sw,cut,pills,ov,bsm,bcut,tcut,alc}},sel);
  const want={parts:30,tools:10,budget:12}[tab];
  if(r.n<want)bad.push(tab+'：行が足りない '+r.n+'/'+want);if(r.sw>392)bad.push(tab+'：横にはみ出す '+r.sw);if(r.cut)bad.push(tab+'：行がはみ出す '+r.cut);if(r.pills)bad.push(tab+'：印が切れる '+r.pills);
  if(r.ov)bad.push(tab+'：印やボタンが重なる '+r.ov);if(r.bsm<44)bad.push(tab+'：−/＋が小さい '+r.bsm);if(r.bcut)bad.push(tab+'：−/＋が画面の外');if(r.tcut)bad.push(tab+'：表がはみ出す');if(r.alc)bad.push(tab+'：在庫不足の知らせが切れる');
  if(tab==='parts'){const ah=await p.evaluate(()=>{const e=document.querySelector('#app .al');return e?e.getBoundingClientRect().height:0});if(!ah)bad.push('在庫不足の知らせが出ない');if(ah>130)bad.push('在庫不足の知らせが長すぎて一覧が下に押される '+Math.round(ah))}
  if(process.argv[2])await p.screenshot({path:path.join(process.argv[2],'stock_'+tab+'.png')});}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
