// 予備品の「発注のメモをコピー」：最低在庫以下の品だけ・品名/今/最低/足りない数・不足が無ければボタン無し・保存の形は変えない・390px で横にはみ出さない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{const mk=(id,name,qty,min)=>({id,code:'',name,spec:'',maker:'',place:'',unit:'個',qty,min,price:'',equipIds:[],note:''});
  S.parts=[mk('p1','ヒューズ 10A',8,2),mk('p2','電球 LED',1,5),mk('p3','端子',5,'')];save();go('stock',{stTab:'parts'})});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>({btn:[...document.querySelectorAll('#app button')].filter(x=>/発注のメモ/.test(x.textContent)).map(x=>({t:x.textContent,h:x.getBoundingClientRect().height})),sw:document.documentElement.scrollWidth,txt:orderMemoText()}));
 if(r.btn.length!==1||!/1品目/.test(r.btn[0].t))bad.push('ボタンが出ない '+JSON.stringify(r.btn));else if(r.btn[0].h<44)bad.push('ボタンが小さい');
 if(!/電球 LED　今 1個／最低 5個／足りない 4個/.test(r.txt)||/ヒューズ|端子/.test(r.txt))bad.push('メモの中身が違う '+r.txt);
 if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 const before=await p.evaluate(()=>JSON.stringify(S.parts));await p.evaluate(()=>copyOrderMemo());await p.waitForTimeout(300);
 if(before!==await p.evaluate(()=>JSON.stringify(S.parts)))bad.push('コピーで記録が変わった');
 await p.evaluate(()=>{S.parts[1].qty=9;save();go('stock',{stTab:'parts'})});await p.waitForTimeout(300);
 if(await p.evaluate(()=>[...document.querySelectorAll('#app button')].some(x=>/発注のメモ/.test(x.textContent))))bad.push('不足が無いのにボタンが出る');
 if(errs.length)bad.push(errs.join(';'));
 console.log(bad.length?'FAIL\n'+bad.join('\n'):'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
