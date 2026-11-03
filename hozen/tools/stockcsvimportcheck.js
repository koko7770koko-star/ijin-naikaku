// 予備品CSVの読み戻しの確認：書き出したCSV（予備品の表＋入出庫の表）をそのまま読み戻して品目数・在庫・入出庫が変わらない・
// 上書きは在庫の数を変えない・新規は初期在庫の入庫を1件作る・壊れた行は理由つきで飛ばす・元に戻せる・390pxではみ出さない。保存の形は変えない。
// usage: node hozen/tools/stockcsvimportcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.equipment=[{id:'e1',code:'E-1',name:'分電盤',photos:[],docs:[],repairs:[],health:[]}];
  S.parts=[{id:'p1',code:'F-10',name:'ヒューズ 10A',spec:'ガラス管',maker:'甲',place:'棚1',unit:'本',qty:12,min:5,price:80,equipIds:['e1'],note:'メモ,"引用"'},{id:'p2',code:'',name:'端子台',spec:'',maker:'',place:'',unit:'個',qty:0,min:'',price:'',equipIds:[],note:''}];
  S.moves=[{id:'m1',partId:'p1',date:TODAY,type:'入庫',qty:12,after:12,ref:'init',by:'',note:'初期'}];save();go('stock')});await p.waitForTimeout(300);
 const ui=await p.evaluate(()=>{const x=[...document.querySelectorAll('#app label.btn')].find(l=>l.textContent.includes('CSVを読み込む'));if(!x)return null;const r=x.getBoundingClientRect();return {h:r.height,r:r.right,sw:document.documentElement.scrollWidth}});
 if(!ui)bad.push('読み込みボタンが無い');else if(ui.h<40||ui.r>390||ui.sw>392)bad.push('ボタン '+JSON.stringify(ui));
 const csv=await p.evaluate(()=>{let t='';window.download=async(n,b)=>{t=await b.text();return true};try{download=window.download}catch(e){}exportStockCsv();return new Promise(r=>setTimeout(()=>r(t),300))});
 const r1=await p.evaluate(t=>{const P=planStockCsv(t);return {n:P.items.length,s:P.skip.length,up:P.items.filter(x=>x.ex).length}},csv);
 if(r1.n!==2||r1.s!==0||r1.up!==2)bad.push('計画 '+JSON.stringify(r1));
 await p.evaluate(t=>{PENDING_STOCKCSV=planStockCsv(t);return applyStockCsv()},csv);await p.waitForTimeout(500);
 const a=await p.evaluate(()=>({n:S.parts.length,q:S.parts[0].qty,mv:S.moves.length,eq:S.parts[0].equipIds.join(),note:S.parts[0].note}));
 if(a.n!==2||a.q!==12||a.mv!==1||a.eq!=='e1'||a.note!=='メモ,"引用"')bad.push('読み戻し後 '+JSON.stringify(a));
 // 上書き（在庫は変えない）・新規・壊れた行
 const t2='品番,品名,仕様,メーカー,保管場所,在庫,単位,最低在庫,単価,使用設備\r\nF-10,ヒューズ 10A,,,棚9,99,,8,,\r\nB-1,ブレーカ,30A,乙,棚2,4,個,2,1500,\r\n,,,,,\r\nX-1,在庫が変,,,,abc,,,,\r\nZ,短い\r\n\r\n日付,区分,品名,数,残,担当,関連,メモ\r\n2026-01-01,入庫,ヒューズ 10A,1,13,,,\r\n';
 const r3=await p.evaluate(t=>{const P=planStockCsv(t);return {n:P.items.length,s:P.skip.length}},t2);if(r3.n!==2||r3.s!==2)bad.push('壊れた行 '+JSON.stringify(r3));
 await p.evaluate(t=>{PENDING_STOCKCSV=planStockCsv(t);return applyStockCsv()},t2);await p.waitForTimeout(500);
 const d=await p.evaluate(()=>({n:S.parts.length,f:S.parts[0],nw:S.parts.find(x=>x.code==='B-1'),mv:S.moves.filter(m=>m.partId===(S.parts.find(x=>x.code==='B-1')||{}).id).length,all:S.moves.length}));
 if(d.n!==3||d.f.qty!==12||d.f.place!=='棚9'||d.f.min!==8||d.f.maker!=='甲')bad.push('上書き '+JSON.stringify(d.f));
 if(!d.nw||d.nw.qty!==4||d.mv!==1||d.all!==2)bad.push('新規 '+JSON.stringify([d.nw&&d.nw.qty,d.mv,d.all]));
 await p.evaluate(()=>document.querySelector('#undobar button').click());await p.waitForTimeout(200);
 const u=await p.evaluate(()=>[S.parts.length,S.moves.length,S.parts[0].place].join());if(u!=='2,1,棚1')bad.push('元に戻した後 '+u);
 // 画面から
 await p.setInputFiles('#app input[type=file][accept*=csv]',{name:'s.csv',mimeType:'text/csv',buffer:Buffer.from(t2,'utf-8')});await p.waitForTimeout(500);
 const m=await p.evaluate(()=>({t:$('#modal').textContent,sw:document.documentElement.scrollWidth,mw:$('#modal').getBoundingClientRect().width}));
 if(!m.t.includes('新規 1品目')||!m.t.includes('読み飛ばす行：2件'))bad.push('確認の窓 '+m.t.slice(0,120));if(m.sw>392||m.mw>390)bad.push('窓がはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>closeModal(true));
 await p.setInputFiles('#app input[type=file][accept*=csv]',{name:'x.csv',mimeType:'text/csv',buffer:Buffer.from('a,b\r\n1,2\r\n')});await p.waitForTimeout(400);
 if(!(await p.evaluate(()=>$('#modal').textContent)).includes('予備品のCSVではありません'))bad.push('別のCSVの案内');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
