// バックアップの書き出し→空の端末に復元で、絵文字・異体字（𠮷・葉＋異体字の印）・改行・タブ・' " < > & \ ・全角半角を含む名前と内容が、
// 元の字のまま戻るか（設備・異常・予定・日常点検のメモ・申し送り・日報の特記事項・シフトの職員の名前。hz-v-backup-emoji）。保存の形は変えない。外への通信は止める。
// usage: node hozen/tools/backupemojicheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
async function open(b){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);return p}
const X="🔥𠮷葉\u{E0100}\tタブ\n改行' \" <b>&amp; \\ ＡＢｃ ｶﾅ ①";
const snap=p=>p.evaluate(()=>{const T=TODAY;return {eq:(S.equipment||[]).filter(e=>e.id==='eqE').map(e=>[e.name,e.note]),is:S.issues.filter(i=>i.id==='isE').map(i=>[i.title,i.detail]),tk:S.tasks.filter(t=>t.id==='tkE').map(t=>[t.title,t.note]),
 dn:(S.daily[T]||{}).note,ho:((S.handover||{})[T]||{}).text,dt:(S.dnotes||{})[T],sh:hasShift()?SHIFT.members().filter(n=>/🔥/.test(n)):null}});
(async()=>{const b=await chromium.launch();
 const A=await open(b);
 await A.click('#nav button[data-v="shift"]');await A.waitForTimeout(600);await A.click('#nav button[data-v="home"]');
 await A.evaluate(X=>{const T=TODAY;S.equipment=S.equipment||[];S.equipment.push({id:'eqE',code:'E-1',name:X,note:X,place:'',maker:'',model:'',serial:'',installed:'',cycle:'',photos:[],docs:[],repairs:[]});
  S.issues.push({id:'isE',date:T,title:X,place:'',detail:X,status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]});
  S.tasks.push({id:'tkE',date:T,time:'',kind:'月次',cat:'',title:X,place:'',staff:'',attend:'',status:'予定',result:'',note:X,photos:[]});
  S.daily[T]=Object.assign({},S.daily[T]||{},{note:X});S.handover=S.handover||{};S.handover[T]={text:X,by:'',at:''};S.dnotes=S.dnotes||{};S.dnotes[T]=X;
  if(hasShift()){const g=SHIFT.get();g.members[0]={...g.members[0],name:X.replace(/[\t\n]/g,'')};SHIFT.set(g)}save()},X);
 await A.waitForTimeout(500);const before=await snap(A);
 const text=await A.evaluate(async()=>{const r=await buildBackup();return await r.blob.text()});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bke-'));const f=path.join(tmp,'e.json');fs.writeFileSync(f,text);
 const B=await open(b);await B.evaluate(()=>go('set'));await B.waitForTimeout(400);await B.setInputFiles('input[onchange^="restore("]',f,{timeout:5000});await B.waitForTimeout(800);
 await B.evaluate(()=>applyRestore());await B.waitForTimeout(1500);await B.reload();await B.waitForFunction(READY,null,{timeout:15000});await B.waitForTimeout(500);
 const after=await snap(B);
 if(!before.eq.length||before.eq[0][0]!==X)bad.push('元の端末で設備の名前が入らない（確かめの作りの誤り）'+JSON.stringify(before.eq));
 for(const k of Object.keys(before)){if(JSON.stringify(before[k])!==JSON.stringify(after[k]))bad.push('復元で '+k+' の字が変わる：'+JSON.stringify(before[k])+' → '+JSON.stringify(after[k]))}
 if(before.sh===null)console.log('（シフト表が無いので職員の名前は見ない）');
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
