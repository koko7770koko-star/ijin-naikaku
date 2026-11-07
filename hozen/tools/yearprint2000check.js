// 年間計画（go('year')）：点検項目 2000・予定 6000 のとき、年度の切り替え（‹ ›）が 1 秒以内（この入れ物で 0.45〜0.6 秒。残りは 2000 行の表の並べ（layout）で、マスの押し方を表に1つにして HTML は 5.4MB→1.4MB に減らした）、
// 印刷（A4 横の PDF）で表の列の見出しが各頁に繰り返され（thead が table-header-group）、行が頁の境で割れず、紙の幅を横にはみ出さず、
// 文字「標準」「特大」の両方で崩れないか（hz-v-year-print-2000）。保存せず画面の中だけで確かめる。usage: node hozen/tools/yearprint2000check.js（pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fsc of ['m','xl']){const tag=(fsc==='xl'?'特大':'標準')+'・';const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S);await p.waitForTimeout(200);
 await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;const CY=['毎月','3か月','6か月','年1回'],cats=S.settings.cats;
  S.equipment=[...Array(500)].map((_,i)=>({id:'eqm'+i,code:'EQ-'+i,name:'試しの設備'+i,kind:'変圧器',locId:'',status:'稼働',importance:'',repairs:[]}));
  S.items=[...Array(2000)].map((_,i)=>({id:'itm'+i,name:'試しの点検'+i+' 高圧受電盤 外観・発熱・異音の確認',cat:cats[i%cats.length],cycle:CY[i%4],base:addD(TODAY,-400+(i%300)),who:i%3?'自社':'委託',track:true,legal:'',equipId:'eqm'+(i%500)}));
  S.tasks=[...Array(6000)].map((_,i)=>({id:'tsm'+i,date:addD(TODAY,-(i%700)+30),time:'',kind:'定期',cat:cats[i%cats.length],title:'試しの点検'+(i%2000)+' 高圧受電盤 外観・発熱・異音の確認',place:'',staff:'',attend:'',status:i%5?'完了':'予定',result:'',note:'',photos:[]}));
  const fy0=fyOf(now.getFullYear(),now.getMonth()+1);S.marks={};for(const fy of [fy0-2,fy0-1,fy0]){S.marks[fy]={};S.items.forEach((it,i)=>{S.marks[fy][it.id]=[...Array(12)].map((_,k)=>(k+i)%3===0?(fy<fy0?'済':'○'):'')})}
  const v=validateData(clone(S));if(!v.ok)throw new Error('validateData '+v.fatal);const mg=migrate(v.data,true);for(const x of ['items','tasks','equipment','marks'])S[x]=mg[x];DL_CACHE=null;
  applyFScale();V.fy=fy0;V.yrCat='';V.yrNow=false;go('year')},fsc);
 await p.waitForTimeout(200);
 const turns=[];for(const d of [-1,-1,1,1])turns.push(await p.evaluate(d=>{const s=performance.now();V.fy+=d;render();return performance.now()-s},d));
 const turn=Math.max(...turns);if(turn>1000)bad.push(tag+'年度の切り替えに '+Math.round(turn)+'ms');
 await p.setViewportSize({width:1047,height:740});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const st=await p.evaluate(()=>{const T=[...document.querySelectorAll('#app table')].filter(t=>t.offsetParent!==null&&t.rows.length>25);
  return{big:T.length,rows:T.reduce((a,t)=>a+t.rows.length,0),noHead:T.filter(t=>!t.tHead||getComputedStyle(t.tHead).display!=='table-header-group').length,
   splitRow:T.filter(t=>{const r=t.tBodies[0]&&t.tBodies[0].rows[0];return r&&!/avoid/.test(getComputedStyle(r).breakInside)}).length,
   wide:T.filter(t=>t.scrollWidth>t.parentElement.clientWidth+2||t.getBoundingClientRect().right>document.documentElement.clientWidth+2).length,sw:document.documentElement.scrollWidth}});
 const f=path.join(os.tmpdir(),'hz-y2k-'+Date.now()+'.pdf');const s=Date.now();await p.pdf({path:f,preferCSSPageSize:true,printBackground:true});const pdfMs=Date.now()-s;
 let pages=[];try{pages=execFileSync('pdftotext',['-layout',f,'-']).toString('utf8').split('\f').filter((x,i,a)=>i<a.length-1||x.trim())}catch(e){console.log('SKIP pdftotext')}fs.unlinkSync(f);
 const thin=pages.map((t,i)=>[i+1,t.replace(/\s/g,'').length]).filter(x=>x[1]<40);
 // 見出しの行（「4月」と「3月」が同じ行にある）が各頁にあるか：2 頁目以降で無い頁を数える
 const noHeadPage=pages.slice(1).map((t,i)=>[i+2,t.split('\n').some(l=>/4月/.test(l)&&/3月/.test(l))]).filter(x=>!x[1]).map(x=>x[0]);
 console.log(tag+JSON.stringify({turn:Math.round(turn),pdfMs,pages:pages.length,thin:thin.length,noHeadPage:noHeadPage.slice(0,5),...st}));
 if(!st.big)bad.push(tag+'年間表が見つからない');if(st.noHead)bad.push(tag+'列の見出しが各頁に出ない表 '+st.noHead);if(st.splitRow)bad.push(tag+'行が頁の境で割れる表 '+st.splitRow);
 if(st.wide||st.sw>1050)bad.push(tag+'紙の幅を横にはみ出す '+st.wide+'/'+st.sw);if(thin.length)bad.push(tag+'空に近い頁 '+JSON.stringify(thin.slice(0,5)));
 if(pages.length>1&&noHeadPage.length)bad.push(tag+'見出しの行が無い頁 '+noHeadPage.length+'（例 '+noHeadPage.slice(0,5).join(',')+'）');if(pdfMs>60000)bad.push(tag+'PDF に '+pdfMs+'ms');
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
