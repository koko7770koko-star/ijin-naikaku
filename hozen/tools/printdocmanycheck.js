// 帳票の印刷（go('printDoc')）：項目が多いとき（点検報告書の測定 40 行（アプリの上限）・作業報告書の設備 300・確認 150・未完了一覧 300 件）、
// 画面が 1 秒以内に出て、A4 の PDF で表が紙の幅に収まり、長い表の見出しが各頁に繰り返され、行が頁の境で割れず、空に近い頁が出ない
// （hz-v-printdoc-many）。文字「特大」でもはみ出さない。保存せず画面の中だけで確かめる。usage: node hozen/tools/printdocmanycheck.js（pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S);await p.waitForTimeout(200);
 await p.evaluate(()=>{window.save=()=>{};
  S.equipment=[...Array(300)].map((_,i)=>({id:'eq'+i,code:'EQ-'+i,name:'設備'+i+'（高圧受変電 第'+i+'系統）',kind:'変圧器',locId:'',status:'稼働',importance:'',repairs:[],photos:[],docs:[]}));
  S.meas=[{id:'m1',equipId:'eq0',date:TODAY,by:'確認者',name:'月次点検',type:'絶縁抵抗',cond:{tplCond:'',temp:'20',hum:'50',weather:'晴'},rows:[...Array(40)].map((_,i)=>({name:'盤'+i+' 母線の絶縁抵抗',v:100+i,unit:'MΩ',min:50,max:'',ck:false})),note:'',photos:[]}];
  S.issues=[...Array(300)].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:TODAY,title:'異常'+i+' 真空遮断器の異音',detail:'詳細'+i,place:'',status:'対応中',urgency:['緊急','高','中','低'][i%4],equipId:'eq'+(i%300),action:'',cause:'',closed:'',photos:[],log:[],cost:'',approvals:[]}));
  const w=(id,x)=>Object.assign({id,no:'W-'+id,title:'作業',kind:'点検',status:'予定',date:TODAY,endDate:'',start:'',end:'',place:'',equipIds:[],staff:[],vendor:'',vendorStaff:'',content:'',result:'',pre:[],post:[],outage:{on:false},approvals:[],hist:[],photos:[],checks:{},cost:'',resp:'',needQuals:[],needN:0,ky:[]},x);
  S.works=[w('w1',{title:'大量の設備の点検',equipIds:[...Array(300)].map((_,i)=>'eq'+i),staff:[...Array(30)].map((_,i)=>'職員'+i),pre:[...Array(150)].map((_,i)=>({text:'作業前の確認 '+i+' 断路器の開放と施錠',done:i%2===0,by:'甲'})),post:[...Array(150)].map((_,i)=>({text:'作業後の確認 '+i,done:false}))})];
  const v=validateData(clone(S));if(v.ok){const mg=migrate(v.data,true);for(const x of ['equipment','meas','issues','works'])S[x]=mg[x]}else throw new Error('validateData '+v.fatal);DL_CACHE=null});
 for(const big of [false,true])for(const k of ['meas:m1','issueList:','work:w1']){const [t,id]=k.split(':');
  await p.setViewportSize({width:390,height:844});await p.emulateMedia({media:'screen'});
  if(big)await p.evaluate(()=>{try{if(typeof setFontScale==='function')setFontScale('xl');else document.documentElement.dataset.fs='xl'}catch(e){}});
  const ms=await p.evaluate(([t,id])=>{const s=performance.now();go('printDoc',{doc:{t,id}});return performance.now()-s},[t,id]);
  const L=k+(big?'（特大）':'');if(ms>1000)bad.push(L+'：出るまで '+Math.round(ms)+'ms');
  await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
  const st=await p.evaluate(()=>{const T=[...document.querySelectorAll('#app table')].filter(t=>t.offsetParent!==null&&t.rows.length>25);
   return{big:T.length,noHead:T.filter(t=>!t.tHead||getComputedStyle(t.tHead).display!=='table-header-group').map(t=>(t.rows[0]&&t.rows[0].innerText||'').slice(0,20)),
    splitRow:T.filter(t=>[...t.rows].slice(0,5).some(r=>!/avoid/.test(getComputedStyle(r).breakInside)&&!/avoid/.test(getComputedStyle(r).pageBreakInside))).length,sw:document.documentElement.scrollWidth}});
  const f=path.join(os.tmpdir(),'hz-pd-'+Date.now()+'.pdf');await p.pdf({path:f,format:'A4',printBackground:true});
  let pages=[];try{pages=execFileSync('pdftotext',['-layout',f,'-']).toString('utf8').split('\f').filter((x,i,a)=>i<a.length-1||x.trim())}catch(e){console.log('SKIP pdftotext')}fs.unlinkSync(f);
  const thin=pages.map((tx,i)=>[i+1,tx.replace(/\s/g,'').length]).filter(x=>x[1]<40);
  console.log(L,JSON.stringify({ms:Math.round(ms),pages:pages.length,thin,...st}));
  if(!st.big&&t!=='work')bad.push(L+'：長い表が見つからない');if(st.noHead.length)bad.push(L+'：見出しが各頁に出ない表 '+JSON.stringify(st.noHead));if(st.splitRow)bad.push(L+'：行が頁の境で割れる表 '+st.splitRow);
  if(st.sw>800)bad.push(L+'：紙の幅を横にはみ出す '+st.sw);if(thin.length)bad.push(L+'：空に近い頁 '+JSON.stringify(thin));
 }
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
