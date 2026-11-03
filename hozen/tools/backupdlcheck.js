// バックアップの書き出しを downloads（window.claude.downloads.save）経路で確かめる：
//  ①アーティファクトの中（claude.use('downloads') がある）：書き出しは save に渡り、渡された中身を空の端末で復元すると元どおり（場所の4段・盤の印・設備の結びつき）
//  ②「やめた」（declined）：書き出し済みの印が付かず、普通のダウンロードも出ない
//  ③file:// で開いたとき（claude が無い）：今までどおり普通のダウンロードで同じ名前のファイルが出る
// 通信は止める。保存キー・SCHEMA は変えない。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
async function open(b){const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);return {ctx,p,errs}}
const snap=p=>p.evaluate(()=>({locs:JSON.stringify((S.locs||[]).map(l=>[l.id,l.type,l.parent,l.name])),ban:JSON.stringify(S.banChk||{}),eq:JSON.stringify((S.equipment||[]).map(e=>[e.id,e.locId||'']))}));
(async()=>{const b=await chromium.launch();const A=await open(b);
 await A.p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','A棟','建屋',''),mk('f1','1階','階','b1'),mk('r1','第1電気室','電気室','f1'),mk('p1','動力盤-1','盤','r1')];
  const ym=TODAY.slice(0,7);S.banChk={[ym]:{p1:['済','○','延']}};S.equipment=S.equipment||[];S.equipment.push({id:'eqG',code:'',name:'試験発電機',kind:'発電機',place:'',locId:'p1',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[]});save();
  window.__dl=0;window.claude={use:async n=>n==='downloads'?{save:async({filename,data})=>{window.__saved={filename,text:await data.text()};return true}}:null};});
 await A.p.waitForTimeout(400);const before=await snap(A.p);
 // ① downloads 経路
 let dl=0;A.p.on('download',()=>dl++);
 await A.p.evaluate(()=>backup());await A.p.waitForTimeout(1500);
 const saved=await A.p.evaluate(()=>window.__saved||null);
 ok(saved&&/\.json$/.test(saved.filename),'downloads の save に渡らない');ok(dl===0,'downloads があるのに普通のダウンロードも出た');
 ok(await A.p.evaluate(()=>!!(S.settings.bk&&S.settings.bk.exported)),'書き出し済みの印が付かない');
 if(saved){const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bkd-'));const f=path.join(tmp,'saved.json');fs.writeFileSync(f,saved.text);
  const B=await open(b);await B.p.evaluate(()=>go('set'));await B.p.waitForTimeout(500);await B.p.setInputFiles('input[onchange^="restore("]',f,{timeout:5000});await B.p.waitForTimeout(800);
  await B.p.evaluate(()=>applyRestore());await B.p.waitForTimeout(1500);const after=await snap(B.p);
  for(const k of Object.keys(before))ok(before[k]===after[k],'渡された中身を復元すると '+k+' が元と違う');ok(!B.errs.length,'復元で '+B.errs.join('|'))}
 // ② やめた
 await A.p.evaluate(()=>{S.settings.bk=undefined;delete S.settings.bk;window.__saved=null;window.claude={use:async()=>({save:async()=>{const e=new Error('declined');e.code='declined';throw e}})}});
 dl=0;await A.p.evaluate(()=>backup());await A.p.waitForTimeout(1200);
 ok(dl===0,'やめたのに普通のダウンロードが出た');ok(await A.p.evaluate(()=>!(S.settings.bk&&S.settings.bk.exported)),'やめたのに書き出し済みの印が付いた');
 // ③ file://（claude が無い）
 await A.p.evaluate(()=>{delete window.claude});
 await A.p.evaluate(()=>{window.__a=0;const o=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window.__a=this.download;return o.apply(this,arguments)}});
 const [d]=await Promise.all([A.p.waitForEvent('download',{timeout:5000}).catch(()=>null),A.p.evaluate(()=>backup())]);await A.p.waitForTimeout(500);
 const anchor=await A.p.evaluate(()=>window.__a);
 ok(/\.json$/.test(anchor||''),'file:// で普通のダウンロード（a download）が使われない '+anchor);ok(!!d,'file:// で普通のダウンロードが出ない（a download の名前は上で確かめた）');
 console.log([...A.errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(A.errs.length||bad.length?1:0)})();
