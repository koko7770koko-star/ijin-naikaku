// 保存の上限に近いとき（hz-v-near-full）：①戻した後の記録が端末の保存の上限（約 500 万文字）を超えるファイルを戻そうとすると、
// 確かめの窓に ⛔ の知らせ（#rsCap）が出て、押しても今の記録は消えず「復元できませんでした」と出る ②小さいファイルでは知らせが出ない
// ③記録が上限の 80% を超えている端末では、ホームに「保存領域が ○% 使われています」が出る。usage: node hozen/tools/nearfullcheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
async function open(b){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);return {ctx,p,errs}}
// 項目を省いた記録（戻すと初期値が足されて大きくなる）＝戻した後に上限を超える
const fill=(p,k)=>p.evaluate(k=>{const cats=S.settings.cats,n=x=>Math.round(x*k);
 S.tasks=[...Array(n(6000))].map((_,i)=>({id:'tk'+i,date:addD(TODAY,-(i%700)),time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+i,place:'',staff:'',attend:'',status:'完了',result:'',note:'',photos:[]}));
 S.issues=[...Array(n(3000))].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:addD(TODAY,-(i%900)),title:'異常'+i,detail:'詳細',place:'',status:'完了',urgency:'中',equipId:'',action:'',cause:'',closed:TODAY,photos:[],log:[]}));
 S.meas=[...Array(n(11000))].map((_,i)=>({id:'ms'+i,at:'',date:addD(TODAY,-(i%1095)),type:'絶縁抵抗',tplId:'',name:'測定'+i,equipId:'',by:'',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:100}]}));
 save();return {fail:SAVE_FAIL.app,len:localStorage.getItem('hospElecSched_v1').length}},k);
async function backupOf(p){return p.evaluate(async()=>{const r=await buildBackup();return await r.blob.text()})}
(async()=>{const b=await chromium.launch();const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nf-'));
 // ① 大きいファイル
 const A=await open(b);const fa=await fill(A.p,1);ok(!fa.fail,'書き出す側で保存できない（確かめの作り方が合っていない）');
 const big=path.join(tmp,'big.json');fs.writeFileSync(big,await backupOf(A.p));
 const B=await open(b);await B.p.evaluate(()=>{S.notes=S.notes||{};S.notes.__keep='残る印';save();go('set')});await B.p.waitForTimeout(300);
 await B.p.setInputFiles('input[onchange^="restore("]',big);await B.p.waitForFunction(()=>/復元の確認|復元できません/.test(document.body.innerText),null,{timeout:30000});
 const cap=await B.p.evaluate(()=>{const e=document.querySelector('#rsCap');return e?{cls:e.className,t:e.textContent,w:e.getBoundingClientRect().right}:null});
 ok(cap&&/ng/.test(cap.cls)&&/超えそう/.test(cap.t),'大きいファイルで容量の知らせ（⛔）が出ない '+JSON.stringify(cap));if(cap)ok(cap.w<=391,'容量の知らせがはみ出す');
 await B.p.evaluate(()=>applyRestore());await B.p.waitForFunction(()=>/復元できませんでした/.test(document.body.innerText),null,{timeout:30000}).catch(()=>bad.push('押した後に「復元できませんでした」が出ない'));
 const kept=await B.p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('hospElecSched_v1')).notes.__keep}catch(e){return null}});ok(kept==='残る印','押した後に今の記録が消えた');
 // ② 小さいファイル
 const C=await open(b);await fill(C.p,0.05);const small=path.join(tmp,'small.json');fs.writeFileSync(small,await backupOf(C.p));
 const D=await open(b);await D.p.evaluate(()=>go('set'));await D.p.waitForTimeout(300);await D.p.setInputFiles('input[onchange^="restore("]',small);await D.p.waitForFunction(()=>/復元の確認/.test(document.body.innerText),null,{timeout:30000});
 ok(!(await D.p.evaluate(()=>!!document.querySelector('#rsCap'))),'小さいファイルなのに容量の知らせが出る');
 // ③ 80% を超えた端末のホーム
 const E=await open(b);const fe=await fill(E.p,1.15);
 await E.p.reload();await E.p.waitForFunction(READY,null,{timeout:30000});await E.p.waitForTimeout(800);await E.p.evaluate(()=>go('home'));await E.p.waitForTimeout(300);
 const home=await E.p.evaluate(()=>document.querySelector('#app').innerText);ok(fe.fail||/保存領域が \d+% 使われています/.test(home),'80% を超えてもホームに知らせが出ない（'+fe.len+'文字）');
 const errs=[...A.errs,...B.errs,...C.errs,...D.errs,...E.errs];
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length+bad.length?1:0)})();
