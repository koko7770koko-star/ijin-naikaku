// 月報（go('report')）：1 か月に予定 900・異常 200・作業 100 のとき、画面が 1 秒以内に出て、A4 の印刷（PDF）で
// ・長い表に列の見出し（thead）があり、印刷で各頁に繰り返される（display:table-header-group）
// ・表の行が頁の境で上下に割れない（tr の break-inside）
// ・空に近い頁（字が 40 字未満）が出ない
// か（hz-v-monthrep-print-many2、教え t-20261105-print・t-20261107-longrow）。保存せず画面の中だけで確かめる。usage: node hozen/tools/monthprintmany2check.js（pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S);await p.waitForTimeout(200);
 await p.evaluate(()=>{window.save=()=>{};const cats=S.settings.cats,U=['緊急','高','中','低'],y=now.getFullYear(),m=now.getMonth()+1,D=k=>`${y}-${pad(m)}-${pad(1+k%lastDayOf(y,m))}`;
  S.equipment=[...Array(50)].map((_,i)=>({id:'eq'+i,code:'EQ-'+i,name:'設備'+i+'（高圧受変電 第'+i+'系統）',kind:'変圧器',locId:'',status:'稼働',importance:'',repairs:[],photos:[],docs:[]}));
  S.tasks=[...Array(900)].map((_,i)=>({id:'tk'+i,date:D(i),time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+i+' 高圧受電盤の外観と端子の締め付け',place:'',staff:'',attend:'',status:i%3?'完了':'予定',result:i%3?(i%17?'異常なし':'要観察'):'',note:i%9?'':'所見のメモ'+i,photos:[],equipId:'eq'+(i%50)}));
  S.issues=[...Array(200)].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:D(i),title:'異常'+i+' 真空遮断器の異音',detail:'詳細'+i,place:'',status:i%3?'完了':'対応中',urgency:U[i%4],failure:i%7===0,equipId:'eq'+(i%50),action:'交換と再試験',cause:'',closed:i%3?D(i+1):'',photos:[],log:[],cost:''}));
  S.works=[...Array(100)].map((_,i)=>({id:'wk'+i,no:'W-'+i,date:D(i),endDate:'',title:'作業'+i+' 変圧器の清掃',kind:'点検',status:i%2?'完了':'予定',equipId:'',place:'',staff:[],needQuals:[],steps:[],approvals:[],hist:[],issueId:'',note:'',cost:''}));
  for(let k=0;k<lastDayOf(y,m);k++)S.daily[D(k)]={note:'日常メモ'+k};
  const v=validateData(clone(S));if(v.ok){const mg=migrate(v.data,true);for(const x of ['tasks','issues','equipment','works','daily'])S[x]=mg[x]}else throw new Error('validateData '+v.fatal);DL_CACHE=null});
 const ms=await p.evaluate(()=>{V.rmode='m';V.ry=now.getFullYear();V.rm=now.getMonth()+1;const s=performance.now();go('report');return performance.now()-s});
 if(ms>1000)bad.push('月報が出るまで '+Math.round(ms)+'ms');
 await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const st=await p.evaluate(()=>{const T=[...document.querySelectorAll('#app table')].filter(t=>t.offsetParent!==null&&t.rows.length>25);
  return{big:T.length,noHead:T.filter(t=>!t.tHead||getComputedStyle(t.tHead).display!=='table-header-group').map(t=>(t.rows[0]&&t.rows[0].innerText||'').slice(0,20)),
   splitRow:T.filter(t=>{const r=t.tBodies[0]&&t.tBodies[0].rows[0];return r&&!/avoid/.test(getComputedStyle(r).breakInside)}).length,sw:document.documentElement.scrollWidth}});
 const f=path.join(os.tmpdir(),'hz-mr2-'+Date.now()+'.pdf');const s=Date.now();await p.pdf({path:f,format:'A4',printBackground:true});const pdfMs=Date.now()-s;
 let pages=[];try{pages=execFileSync('pdftotext',['-layout',f,'-']).toString('utf8').split('\f').filter((x,i,a)=>i<a.length-1||x.trim())}catch(e){console.log('SKIP pdftotext')}fs.unlinkSync(f);
 const thin=pages.map((t,i)=>[i+1,t.replace(/\s/g,'').length]).filter(x=>x[1]<40);
 console.log(JSON.stringify({ms:Math.round(ms),pdfMs,pages:pages.length,thin,...st}));
 if(!st.big)bad.push('長い表が見つからない（作り方の確かめが要る）');if(st.noHead.length)bad.push('列の見出しが各頁に出ない表 '+JSON.stringify(st.noHead));if(st.splitRow)bad.push('行が頁の境で割れる表 '+st.splitRow);
 if(st.sw>800)bad.push('紙の幅を横にはみ出す '+st.sw);if(thin.length)bad.push('空に近い頁 '+JSON.stringify(thin));if(pdfMs>20000)bad.push('PDF に '+pdfMs+'ms');
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
