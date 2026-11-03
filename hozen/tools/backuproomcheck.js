// 場所の4段（と古い3つの形）・盤の ◯/●・設備の結びつき（locId）・盤の異常（place）が、バックアップ→空の端末に復元で元どおり戻るか。
// usage: node hozen/tools/backuproomcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
async function open(b){const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);return {ctx,p,errs}}
const snap=p=>p.evaluate(()=>({locs:JSON.stringify((S.locs||[]).map(l=>[l.id,l.type,l.parent,l.name,l.ord==null?null:l.ord])),ban:JSON.stringify(S.banChk||{}),eq:JSON.stringify((S.equipment||[]).map(e=>[e.id,e.locId||''])),iss:JSON.stringify((S.issues||[]).map(i=>[i.id,i.place,i.status])),n:(S.locs||[]).length}));
(async()=>{const b=await chromium.launch();
 const A=await open(b);
 await A.p.evaluate(()=>{const mk=(id,name,type,parent,ord)=>({id,name,type,parent,note:'',pos:{},...(ord==null?{}:{ord})});
  S.locs=[mk('b1','A棟','建屋',''),mk('f1','1階','階','b1',0),mk('f2','2階','階','b1',1),mk('r1','第1電気室','電気室','f1',0),mk('p1','動力盤-1','盤','r1',0),mk('p2','動力盤-2','盤','r1',1),
   mk('b2','B棟','建屋',''),mk('f3','1階','階','b2'),mk('p3','盤3-1','盤','f3'),            /* 棟→階→盤（電気室なし） */
   mk('b3','C棟','建屋',''),mk('r2','電気室X','電気室','b3'),mk('p4','盤X-1','盤','r2'),        /* 棟→電気室→盤（階なし） */
   mk('s0','施設','施設',''),mk('b4','D棟','建屋','s0'),mk('r3','電気室Y','電気室','b4'),mk('p5','盤Y-1','盤','r3')]; /* v16.4 の形 */
  const ym=TODAY.slice(0,7);S.banChk={};S.banChk[ym]={p1:['済','済','○'],p2:['','延',''],p3:['済','',''],p4:['○','○','○'],p5:['済','済','済']};
  S.equipment=S.equipment||[];S.equipment.push({id:'eqG',code:'',name:'試験発電機',kind:'発電機',place:'',locId:'p1',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[]});
  S.issues.push({id:'isB',date:TODAY,title:'盤の異常：動力盤-1（端子および碍子）',place:'A棟 › 1階 › 第1電気室 › 動力盤-1',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'eqG',log:[]});save()});
 await A.p.waitForTimeout(500);
 const before=await snap(A.p);
 const built=await A.p.evaluate(async()=>{const r=await buildBackup();return {text:await r.blob.text(),info:r.info}}).catch(e=>{bad.push('buildBackup 失敗 '+e.message);return null});
 if(!built){console.log(bad.join('\n'));process.exit(1)}
 ok(built.info.complete,'バックアップが不完全と判定された');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bkr-'));const good=path.join(tmp,'good.json');fs.writeFileSync(good,built.text);
 const B=await open(b);
 await B.p.evaluate(()=>go('set'));await B.p.waitForTimeout(500);await B.p.setInputFiles('input[onchange^="restore("]',good,{timeout:5000});await B.p.waitForTimeout(800);
 await B.p.evaluate(()=>applyRestore());await B.p.waitForTimeout(1500);
 let after=await snap(B.p);for(const k of Object.keys(before))ok(JSON.stringify(before[k])===JSON.stringify(after[k]),'復元後に '+k+' が元と違う：'+before[k]+' → '+after[k]);
 await B.p.reload();await B.p.waitForTimeout(1500);after=await snap(B.p);for(const k of Object.keys(before))ok(JSON.stringify(before[k])===JSON.stringify(after[k]),'再読み込み後に '+k+' が元と違う');
 // 復元した記録で、盤の点検・設備カルテ・場所の登録が開く（4段と古い3つの形）
 for(const v of ['ban','locs','report'])await B.p.evaluate(x=>go(x),v).then(()=>B.p.waitForTimeout(300));
 for(const bid of ['b1','b2','b3','b4']){await B.p.evaluate(x=>{V.banB=x;go('ban')},bid);await B.p.waitForTimeout(250)}
 await B.p.evaluate(()=>go('equipDetail',{eq:'eqG'}));await B.p.waitForTimeout(300);
 const t=await B.p.evaluate(()=>document.querySelector('#app').innerText);ok(/試験発電機/.test(t),'復元後に設備カルテが開かない');
 await B.p.evaluate(()=>{V.banB='b1';V.banYm=TODAY.slice(0,7);go('ban')});await B.p.waitForTimeout(300);
 ok(/2\/6/.test((await B.p.evaluate(()=>document.querySelector('#app').innerText)).replace(/\s/g,'')),'復元後の盤の済み件数が出ない');
 const errs=[...A.errs,...B.errs];console.log([...errs,...bad].slice(0,15).join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
