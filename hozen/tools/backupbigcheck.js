// 予定3000件・設備300台・異常200件の記録で、書き出し→空の端末に復元が失敗せず元どおり（件数・中身が同じ）か、かかる時間。保存の形は変えない。
// usage: node hozen/tools/backupbigcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
async function open(b){const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);return {ctx,p,errs}}
const snap=p=>p.evaluate(()=>({n:[S.tasks.length,(S.equipment||[]).length,S.issues.length,Object.keys(S.daily).length],tasks:JSON.stringify(S.tasks),equip:JSON.stringify(S.equipment),issues:JSON.stringify(S.issues),daily:JSON.stringify(S.daily)}));
(async()=>{const b=await chromium.launch();const A=await open(b);
 await A.p.evaluate(()=>{
  for(let i=0;i<3000;i++)S.tasks.push({id:'tkB'+i,date:'2026-'+String(1+i%12).padStart(2,'0')+'-'+String(1+i%28).padStart(2,'0'),time:'09:00',kind:'月次',cat:'受変電',title:'テスト点検'+i+'○○',place:'○○室',staff:'',attend:'',status:i%3?'予定':'完了',result:'',note:'メモ'+i,photos:[]});
  S.equipment=S.equipment||[];for(let i=0;i<300;i++)S.equipment.push({id:'eqB'+i,code:'T-'+i,name:'設備'+i,place:'',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[]});
  for(let i=0;i<200;i++)S.issues.push({id:'isB'+i,date:'2026-05-02',title:'テスト異常'+i,place:'',detail:'詳細'+i,status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]});
  for(let i=0;i<200;i++)S.daily[new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10)]={note:'日常メモ'+i};
  save()});
 await A.p.waitForTimeout(1500);const before=await snap(A.p);
 const t0=Date.now();
 const built=await A.p.evaluate(async()=>{const r=await buildBackup();return {text:await r.blob.text(),info:r.info}}).catch(e=>{bad.push('buildBackup 失敗 '+e.message);return null});
 if(!built){console.log(bad.join('\n'));process.exit(1)}
 const tBuild=Date.now()-t0;ok(built.info.complete,'バックアップが不完全と判定された');ok(tBuild<15000,'書き出しに '+tBuild+'ms かかった');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bkb-'));const good=path.join(tmp,'good.json');fs.writeFileSync(good,built.text);
 const B=await open(b);await B.p.evaluate(()=>go('set'));await B.p.waitForTimeout(500);
 const t1=Date.now();await B.p.setInputFiles('input[onchange^="restore("]',good,{timeout:5000});
 await B.p.waitForFunction(()=>/復元の確認|復元できません/.test(document.body.innerText),null,{timeout:30000});
 ok(await B.p.evaluate(()=>/復元の確認/.test(document.body.innerText)),'復元の確認が出ない（断られた）');
 await B.p.evaluate(()=>applyRestore());await B.p.waitForTimeout(2500);const tRest=Date.now()-t1;
 const after=await snap(B.p);
 ok(JSON.stringify(before.n)===JSON.stringify(after.n),'復元後の件数が違う '+before.n+' → '+after.n);
 const sub=(a,c)=>a&&typeof a==='object'?(c&&typeof c==='object'&&Object.keys(a).every(k=>sub(a[k],c[k]))):a===c; // 元の項目がすべて同じ値で残る（足りない項目の初期値の補いは許す）
 for(const k of ['tasks','equip','issues','daily']){const a=JSON.parse(before[k]),c=JSON.parse(after[k]);const keys=Array.isArray(a)?a.map((_,i)=>i):Object.keys(a);const miss=keys.filter(x=>!sub(a[x],c[x]));ok(!miss.length&&(Array.isArray(a)?a.length===c.length:Object.keys(a).length===Object.keys(c).length),'復元後に '+k+' の中身が元と違う（'+miss.length+'件）')}
 await B.p.reload();await B.p.waitForTimeout(2000);const re=await snap(B.p);ok(JSON.stringify(re.n)===JSON.stringify(before.n),'再読み込みで件数が変わった '+re.n);
 ok(tRest<20000,'復元に '+tRest+'ms かかった');
 console.log('件数',before.n.join('/'),'書き出し',tBuild+'ms','大きさ',Math.round(built.text.length/1024)+'KB','復元',tRest+'ms');
 console.log([...A.errs,...B.errs,...bad].slice(0,15).join('\n')||'NO ERRORS');await b.close();process.exit(A.errs.length+B.errs.length+bad.length?1:0)})();
