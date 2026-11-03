// 予備品の CSV 書き出し：①アーティファクトの中（claude.use('downloads')）では save に「予備品_日付.csv」で渡り、中身の先頭が UTF-8 の BOM（Excel で日本語が化けない）・
// 日本語・カンマや改行や引用符を含む値も崩れない ②やめた（declined）ときは普通のダウンロードが出ない ③file:// では今までどおり a download。
// 予備品の記録は変えない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const before=await p.evaluate(()=>{S.parts=[{id:'p1',code:'F-1',name:'ヒューズ,10A',spec:'"長い"\n仕様',maker:'',place:'棚1',unit:'本',qty:3,min:1,price:'',equipIds:[],note:''},{id:'p2',code:'L-2',name:'表示灯',spec:'',maker:'',place:'棚2',unit:'個',qty:0,min:2,price:'',equipIds:[],note:''}];S.moves=[];save();go('stock',{stTab:'parts'});
  window.claude={use:async n=>n==='downloads'?{save:async({filename,data})=>{const u=new Uint8Array(await data.arrayBuffer());window.__saved={filename,head:[...u.slice(0,3)],text:new TextDecoder().decode(u)};return true}}:null};return JSON.stringify(S.parts)});
 await p.waitForTimeout(300);let dl=0;p.on('download',()=>dl++);
 await p.evaluate(()=>exportStockCsv());await p.waitForTimeout(700);
 const s=await p.evaluate(()=>window.__saved||null);
 ok(s&&/^予備品_\d{4}-\d{2}-\d{2}\.csv$/.test(s.filename),'save に予備品_日付.csv で渡らない '+JSON.stringify(s&&s.filename));
 ok(s&&s.head.join()==='239,187,191','先頭が UTF-8 の BOM でない '+(s&&s.head));
 ok(s&&s.text.includes('"品番","品名"')&&s.text.includes('"ヒューズ,10A"')&&s.text.includes('"""長い""\n仕様"'),'カンマ・引用符の値が崩れる '+(s&&s.text.slice(0,200)));
 ok(dl===0,'downloads があるのに普通のダウンロードも出た');
 await p.evaluate(()=>{window.__saved=null;window.claude={use:async()=>({save:async()=>{const e=new Error('declined');e.code='declined';throw e}})}});dl=0;
 await p.evaluate(()=>exportStockCsv());await p.waitForTimeout(700);ok(dl===0,'やめたのに普通のダウンロードが出た');
 await p.evaluate(()=>{delete window.claude;window.__a=0;const o=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window.__a=this.download;return o.apply(this,arguments)}});
 const [d]=await Promise.all([p.waitForEvent('download',{timeout:4000}).catch(()=>null),p.evaluate(()=>exportStockCsv())]);await p.waitForTimeout(300);
 ok(/\.csv$/.test(await p.evaluate(()=>window.__a)||''),'file:// で普通のダウンロード（a download）が使われない');ok(!!d,'file:// でダウンロードが出ない');
 ok(await p.evaluate(()=>JSON.stringify(S.parts))===before,'予備品の記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
