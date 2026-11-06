// 月次報告書・年次報告書の印刷（A4）：節の見出し（1.〜7.）や表の列の見出し行だけが頁の最後に取り残されない（hz-v-rep-pagebreak・hz-v-annual-print-a4）。
// 作業 15・31 件／異常 8 件／日常点検 30 日の月を PDF にし、pdftotext で頁ごとの最後の行を見る（pdftotext が無ければ SKIP）。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
let has=true;try{execFileSync('pdftotext',['-v'],{stdio:'ignore'})}catch(e){has=false}
(async()=>{if(!has){console.log('SKIP（pdftotext なし）\nNO ERRORS');return}
 const b=await chromium.launch();const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rpb-'));
 for(const [MODE,N] of [['m',15],['m',31],['y',200]]){const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.evaluate(([MODE,N])=>{const y=2025,m=6,pf=`${y}-06-`,MS=['04','05','06','07','08','09','10','11','12'];
   for(let i=0;i<N;i++)S.tasks.push({id:'pb'+i,date:(MODE==='y'?'2025-'+MS[i%9]+'-':pf)+String(1+i%28).padStart(2,'0'),time:'10:00',kind:'月次',cat:'',title:'試しの点検'+i+'（受変電設備 高圧開閉器 の外観と動作）',place:'',staff:'',attend:'',status:i%4?'完了':'予定',result:i%5?'良':'否',note:i%5?'':'端子の緩み',photos:[]});
   for(let i=0;i<8;i++)S.issues.push({id:'pbi'+i,date:pf+String(2+i).padStart(2,'0'),title:'試しの異常'+i+' 変圧器の異音と温度上昇',status:'対応中',action:'様子を見る',place:''});
   for(let d=1;d<=30;d++)S.daily[pf+String(d).padStart(2,'0')]={by:'点検者',done:Date.now(),note:''};
   V.ry=y;V.rm=m;V.rfy=2025;V.rmode=MODE;go('report')},[MODE,N]);
  await p.waitForTimeout(500);await p.emulateMedia({media:'print'});const pdf=path.join(tmp,'r'+MODE+N+'.pdf');await p.pdf({path:pdf,format:'A4'});
  const pages=execFileSync('pdftotext',['-layout',pdf,'-']).toString().split('\f').slice(0,-1);
  if(pages.length<2)bad.push(MODE+N+'件：2頁にならない（試しが効いていない）');
  pages.slice(0,-1).forEach((pg,i)=>{const L=pg.split('\n').map(s=>s.trim()).filter(s=>s&&!/^月報・年報/.test(s));const last=L[L.length-1]||'';
   if(/^\d\.\s/.test(last))bad.push(`${MODE==='y'?'年報':'月報'}${N}件：${i+1}頁目の最後に節の見出しだけが残る「${last}」`);
   if(/^No\s/.test(last))bad.push(`${MODE==='y'?'年報':'月報'}${N}件：${i+1}頁目の最後に列の見出し行だけが残る`)});
  bad.push(...errs);await c.close()}
 fs.rmSync(tmp,{recursive:true,force:true});console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
