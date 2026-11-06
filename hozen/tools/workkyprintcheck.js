// 作業報告書の印刷（A4）：KY（危険予知）15 件・作業前後の確認 20 件ずつ・長い作業内容でも、全部が紙に出る（KY は 1 件 1 行で頁の境の行の間で割れる）。
// 署名欄（作成・確認・承認）が最後の頁に一人で残らない。KY が無い作業には KY の行を出さない（hz-v-worksheet-ky-many）
// usage: node hozen/tools/workkyprintcheck.js   （pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[],errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const mk=await p.evaluate(()=>{const ky=Array.from({length:15},(_,i)=>({risk:'危険'+(i+1)+'：高圧受電盤の充電部に近づき感電する、遮断器の誤操作で停電範囲が広がる恐れ',measure:'対策'+(i+1)+'：検電・接地、絶縁用保護具、操作の読み上げ確認おわりK'+(i+1),p:2,s:3}));
  const ck=(n,w)=>Array.from({length:n},(_,i)=>({text:w+'の確認'+(i+1)+'：手順書と現場の表示を指差し呼称で確かめたC'+(i+1),req:true,done:i%2===0,by:'職員1',at:''}));
  const base={no:'W-1',title:'試しの作業 受変電設備の年次点検',kind:'停電作業',status:'完了',date:TODAY,endDate:'',start:'09:00',end:'17:00',equipIds:[],locId:'',place:'',staff:['職員1','職員2'],vendor:'',vendorStaff:'',needQuals:[],needN:0,
   content:Array.from({length:30},(_,i)=>'手順'+(i+1)+' 盤内を点検し、端子の緩みと発熱を確かめた').join('\n'),outage:{on:true,range:'',from:'',to:'',affect:'',contact:''},ky,kyBy:'職員2',pre:ck(20,'作業前'),post:ck(20,'作業後'),
   stdId:'',stdVer:'',stdName:'',result:'異常なし',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''};
  S.works=[Object.assign({id:'wky1'},base),Object.assign({id:'wky0'},base,{ky:[],kyBy:'',no:'W-2'})];save();return 1});
 // KY の無い作業：行を出さない
 await p.evaluate(()=>go('printDoc',{doc:{t:'work',id:'wky0'}}));await p.waitForTimeout(200);
 if(await p.evaluate(()=>document.querySelector('#app').textContent.includes('KY（危険予知）')))bad.push('KY の無い作業に KY の行が出る');
 await p.evaluate(()=>go('printDoc',{doc:{t:'work',id:'wky1'}}));await p.waitForTimeout(300);
 await p.emulateMedia({media:'print'});
 const f=path.join(os.tmpdir(),'workky-'+process.pid+'.pdf');await p.pdf({path:f,format:'A4'});
 try{const np=+(/Pages:\s+(\d+)/.exec(execSync('pdfinfo '+f,{encoding:'utf8'}))||[])[1];const pages=[];
  for(let i=1;i<=np;i++)pages.push(execSync('pdftotext -f '+i+' -l '+i+' -raw '+f+' -',{encoding:'utf8'}).replace(/\s+/g,''));
  const all=pages.join('');
  for(let i=1;i<=15;i++){if(!all.includes('危険'+i+'：'))bad.push('KY '+i+' の危険が紙に無い');
   const pg=pages.findIndex(t=>t.includes('おわりK'+i+'（評価6）'));if(pg<0)bad.push('KY '+i+' の対策・評価が最後まで紙に無い');
   else if(!pages[pg].includes('対策'+i+'：'))bad.push('KY '+i+' の 1 行が頁の境で割れた')}
  if(!all.includes('KY実施：職員2'))bad.push('KY を行った人が紙に無い');
  for(const w of ['作業前','作業後'])for(let i=1;i<=20;i++)if(!all.includes('たC'+i+'（職員1）')||!all.includes(w+'の確認'+i+'：'))bad.push(w+'の確認 '+i+' が紙に無い');
  if(!all.includes('手順30'))bad.push('作業内容の最後の行が紙に無い');
  const last=pages[np-1].replace(/作成確認承認/,'').replace(/\d+\/\d+/g,'');if(last.length<20)bad.push('署名欄が最後の頁に一人で残る（'+np+' 枚）');
  console.log('頁数 '+np);
 }catch(e){bad.push('pdftotext '+e.message)}finally{try{fs.unlinkSync(f)}catch(_){}}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
