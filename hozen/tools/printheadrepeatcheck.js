// 印刷で表が 2 頁以上になるとき、2 頁目からも見出しの行に字が全部出るか（Chrome は繰り返す thead の中のボタンの字を描かない。教え t-20261108-theadbtn、hz-v-print-headrepeat）。
// 盤の点検の白紙の表（盤 300 面）・作業予定表（作業 200 件）を A4 の PDF にし、pdftotext -layout で頁ごとに見出しの字があるか見る。年間計画は yearprint2000check、シフト表は 1 頁に収まる（shiftprintcheck）。
// 保存せず画面の中だけで確かめる。外への通信は止める。usage: node hozen/tools/printheadrepeatcheck.js（pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const CASES=[
 {name:'盤の点検の白紙の表',head:[/階・電気室/,/盤/],setup:()=>{S.locs=[{id:'L1',name:'A棟',type:'建屋',parent:'',note:'',pos:{}},{id:'L2',name:'1F',type:'階',parent:'L1',note:'',pos:{}}];for(let r=0;r<10;r++){S.locs.push({id:'R'+r,name:'第'+(r+1)+'電気室',type:'電気室',parent:'L2',note:'',pos:{}});for(let i=0;i<30;i++)S.locs.push({id:'B'+r+'_'+i,name:'動力盤-'+(i+1),type:'盤',parent:'R'+r,note:'',pos:{}})}
   const v=validateData(clone(S));if(!v.ok)throw new Error('validateData '+v.fatal);S.locs=v.data.locs;S.banChk={};V.banYm=TODAY.slice(0,7);V.banB='';go('ban');document.body.classList.add('bbp')}},
 {name:'作業予定表',head:[/日付/,/作業/,/状態/],setup:()=>{S.works=[...Array(200)].map((_,i)=>({id:'wk'+i,no:'W-'+i,date:addD(TODAY,i%14),endDate:'',start:'09:00',end:'10:00',title:'作業'+i+' 変圧器の清掃と締め付けの確認',kind:'点検',status:'予定',equipId:'',place:'',staff:[],needQuals:[],steps:[],approvals:[],hist:[],issueId:'',note:'',cost:''}));
   const v=validateData(clone(S));if(!v.ok)throw new Error('validateData '+v.fatal);S.works=v.data.works;V.wsFrom=TODAY;go('workSheet')}}];
(async()=>{const b=await chromium.launch();
 for(const C of CASES){const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();
  p.on('pageerror',e=>bad.push(C.name+' PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S);await p.waitForTimeout(200);
  await p.evaluate(`window.save=()=>{};(${C.setup.toString()})()`);await p.waitForTimeout(300);await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
  const f=path.join(os.tmpdir(),'hz-hr-'+Date.now()+'.pdf');await p.pdf({path:f,preferCSSPageSize:true,printBackground:true});
  let pages=[];try{pages=execFileSync('pdftotext',['-layout',f,'-']).toString('utf8').split('\f').filter((x,i,a)=>i<a.length-1||x.trim())}catch(e){console.log('SKIP pdftotext');fs.unlinkSync(f);await c.close();continue}fs.unlinkSync(f);
  const hasHead=t=>t.split('\n').some(l=>C.head.every(re=>re.test(l)));
  const miss=pages.map((t,i)=>[i+1,hasHead(t)]).filter(x=>!x[1]).map(x=>x[0]);
  console.log(C.name,JSON.stringify({pages:pages.length,miss:miss.slice(0,8)}));
  if(pages.length<2)bad.push(C.name+'：2 頁にならない（確かめの作り方を見直す）');if(miss.length)bad.push(C.name+'：見出しの字が無い頁 '+miss.length+'（例 '+miss.slice(0,5).join(',')+'）');
  await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
