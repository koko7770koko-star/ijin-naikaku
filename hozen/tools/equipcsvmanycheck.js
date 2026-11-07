// 設備台帳 CSV の読み戻し：設備 2000 台・修理履歴 6000 件を書き出して読み込むとき、ファイルを選んでから確かめの窓が出るまで 2 秒以内、
// 読み込み（上書き 2000・履歴は重ならない）が 2 秒以内、読み込んだ後の設備台帳が 1 秒以内、同じ設備 ID が 2 行ある CSV は 1 台にまとまる（増えない）か。
// 390px（hz-v-equip-csv-many）。保存の形は変えない。usage: node hozen/tools/equipcsvmanycheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY;S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E-'+String(i).padStart(4,'0'),name:'設備'+i,place:'A棟',maker:'甲',model:'M'+i,serial:'S'+i,installed:'2015-04',cycle:'年1回',note:'',kind:'変圧器',status:'稼働',importance:'B',spec:{},life:20,photos:[],docs:[],
  repairs:[0,1,2].map(k=>({id:'r'+i+'_'+k,date:addD(T,-(i+k*400)),kind:'修理',content:'修理'+k,vendor:'',cost:1000,photos:[]})),health:[]}));save();go('equip')});
 await p.waitForTimeout(400);
 const csv=await p.evaluate(async()=>{let t='';window.hzSave=async(n,bl)=>{t=await bl.text();return true};exportEquipCsv();for(let k=0;k<200&&!t;k++)await new Promise(r=>setTimeout(r,10));return t});
 if(!csv)bad.push('書き出しが空');
 const f=path.join(os.tmpdir(),'eqcsv'+process.pid+'.csv');fs.writeFileSync(f,csv);
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 await p.evaluate(()=>{V.eqFo=true;render()});await raf();
 const inp=await p.$('#app input[type=file][onchange*="importEquipCsv"]');if(!inp)bad.push('読み込みの欄が無い');else{
  let s=Date.now();await inp.setInputFiles(f);await p.waitForSelector('button:has-text("読み込む")',{timeout:10000}).catch(()=>bad.push('確かめの窓が出ない'));tm.confirm=Date.now()-s;
  const msg=await p.evaluate(()=>document.querySelector('#modal')?document.querySelector('#modal').innerText:'');if(!/2000/.test(msg))bad.push('確かめの窓に台数が出ない '+msg.slice(0,80));
  s=Date.now();await p.click('#modal button:has-text("読み込む")');await p.waitForFunction(()=>!document.querySelector('#modal.on')&&document.querySelector('#undobar.on'),null,{timeout:15000}).catch(()=>bad.push('読み込みが終わらない'));tm.apply=Date.now()-s}
 fs.unlinkSync(f);
 const a=await p.evaluate(()=>({n:S.equipment.length,rep:S.equipment.reduce((x,e)=>x+e.repairs.length,0),id0:S.equipment[0].id}));
 if(a.n!==2000||a.rep!==6000||a.id0!=='e0')bad.push('読み戻した後 '+JSON.stringify(a));
 let s=Date.now();await p.evaluate(()=>{V.eqFo=false;go('equip')});await raf();tm.list=Date.now()-s;
 // 同じ設備 ID が 2 行：1 台にまとまる（新しく 2 台できない）
 const dup=await p.evaluate(()=>{const H='区分,設備ID,設備名称,設置場所,メーカー,型式,製造番号,設置年月,点検周期,日付,種類,内容,業者・対応者,費用,備考,階層,種別,重要度,状態,耐用年数,更新予定,更新費用,仕様\r\n';
  const P=planEquipCsv(H+'設備,N-1,新しい盤,B棟,,,,,,,,,,,,,,,,,,,\r\n設備,N-1,新しい盤,C棟,,,,,,,,,,,,,,,,,,,\r\n');return {n:P.eqs.filter(x=>!x.ex).length,skip:P.skip.length}});
 if(dup.n>1)bad.push('同じ設備 ID の 2 行で新しい設備が '+dup.n+' 台できる');
 for(const [k,lim] of [['confirm',2000],['apply',2000],['list',1000]])if(tm[k]>lim)bad.push(k+' '+tm[k]+'ms');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log(JSON.stringify(tm)+'・同じ ID '+JSON.stringify(dup));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
