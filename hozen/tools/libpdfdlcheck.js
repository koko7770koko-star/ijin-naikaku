// 資料（lib・作業・異常に添付した PDF/画像）を開く：①アーティファクトの中（claude.use('downloads') がある）では別窓を開かず、名前＋拡張子（.pdf）で save に渡る
// ②やめた（declined）ときは普通のダウンロードも出ない ③file:// では今までどおり別窓（window.open）で開く。保存の形・キーは変えない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const raw0=await p.evaluate(async()=>{const pdf='data:application/pdf;base64,'+btoa('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');const id=await putPhoto(pdf);
  S.library=[{id:'lb1',title:'試験資料',docs:[{id,name:'停電時の手順'}]}];save();window.__id=id;
  return {n:docFileName('a.PDF','application/pdf'),m:docFileName('図/面:1','image/png'),j:docFileName('x.jpeg','image/jpeg'),e:docFileName('','')}});
 ok(raw0.n==='a.PDF','拡張子が重ねて付く '+raw0.n);ok(raw0.m==='図_面_1.png','使えない文字・拡張子 '+raw0.m);ok(raw0.j==='x.jpeg','jpeg が重なる '+raw0.j);ok(raw0.e==='資料','空の名前 '+raw0.e);
 // ① アーティファクトの中
 await p.evaluate(()=>{window.__opened=0;window.open=()=>{window.__opened++;return null};window.claude={use:async n=>n==='downloads'?{save:async({filename,data})=>{window.__saved={filename,size:data.size,type:data.type};return true}}:null}});
 let dl=0;p.on('download',()=>dl++);
 await p.evaluate(()=>openDoc(window.__id,'停電時の手順'));await p.waitForTimeout(800);
 const s1=await p.evaluate(()=>({sv:window.__saved||null,op:window.__opened}));
 ok(s1.sv&&s1.sv.filename==='停電時の手順.pdf','save に名前＋.pdf で渡らない '+JSON.stringify(s1.sv));ok(s1.sv&&s1.sv.size>10&&/pdf/.test(s1.sv.type),'中身が渡らない');ok(s1.op===0,'アーティファクトの中で別窓を開こうとした');ok(dl===0,'普通のダウンロードも出た');
 // ② やめた
 await p.evaluate(()=>{window.__saved=null;window.claude={use:async()=>({save:async()=>{const e=new Error('declined');e.code='declined';throw e}})}});
 dl=0;await p.evaluate(()=>openDoc(window.__id,'停電時の手順'));await p.waitForTimeout(800);ok(dl===0,'やめたのに普通のダウンロードが出た');
 // ③ file://（claude が無い）
 await p.evaluate(()=>{delete window.claude;window.__opened=0;window.open=()=>{window.__opened++;return {}}});
 await p.evaluate(()=>openDoc(window.__id,'停電時の手順'));await p.waitForTimeout(500);
 ok(await p.evaluate(()=>window.__opened)===1,'file:// で別窓で開かない');
 // 別窓が開かないとき（ポップアップ禁止）は名前付きで保存
 await p.evaluate(()=>{window.open=()=>null;window.__a=0;const o=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window.__a=this.download;return o.apply(this,arguments)}});
 const [d]=await Promise.all([p.waitForEvent('download',{timeout:4000}).catch(()=>null),p.evaluate(()=>openDoc(window.__id,'停電時の手順'))]);
 ok(!!d,'別窓が開けないとき保存されない');ok(await p.evaluate(()=>window.__a)==='停電時の手順.pdf','別窓が開けないとき名前付き（.pdf）で渡らない '+await p.evaluate(()=>window.__a));
 // 添付ボタンから名前が渡る
 const hasN=await p.evaluate(()=>/data-n="停電時の手順"/.test(docsList([{id:'x',name:'停電時の手順'}],'')));ok(hasN,'資料の一覧のボタンに名前が付かない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
