// 夜勤シフト表の印刷（提出用の用紙 cal・p11）：メンバーの名前に絵文字・異体字（𠮷・髙・葉＋異体字の印）・丸数字・空白の無い長い英数字があるとき、
// A4 の PDF で字が □／� にならず残り、1 頁に収まり、用紙のマスから字が横にはみ出さないか（hz-v-shift-print-emoji）。名前は「A1」の形だけ（人の名前は入れない）。
// kinmuhyo_v1 の形は変えない。外への通信は止める。usage: node hozen/tools/shiftprintemojicheck.js（pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const hasFont=ch=>{try{return execSync(`fc-list ':charset=${ch.codePointAt(0).toString(16)}' family`).toString().trim().length>0}catch(e){return true}};
const CH=['🔥','⚡','𠮷','髙','①','⑳','葉'];const NAMES=['A1🔥','B2𠮷','C3髙①','D4⑳⚡','E5葉\u{E0100}','F6'+'X0Y9'.repeat(10),'G7','H8'];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(150);
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 const k0=await p.evaluate(N=>{const g=SHIFT.get(),k=Object.keys(g).sort().join(',');g.members=N.map((n,i)=>({...(g.members[i]||{type:'夜勤'}),name:n}));SHIFT.set(g);return k},NAMES);
 await p.click('#nav button[data-v="home"]');await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(500);
 await p.click('#tabs button[data-p="sub"]');await p.waitForTimeout(800);
 for(const type of ['cal','p11']){
  await p.selectOption('#subType',type).catch(()=>bad.push(type+'：用紙の種類を選べない'));await p.waitForTimeout(300);
  await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
  const st=await p.evaluate(()=>{const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
   const over=[...document.querySelectorAll('td,th')].filter(e=>vis(e)&&e.scrollWidth>e.clientWidth+1).slice(0,3).map(e=>e.textContent.slice(0,16)+':'+(e.scrollWidth-e.clientWidth));
   return{over,sw:document.documentElement.scrollWidth,W:innerWidth}});
  const f=path.join(os.tmpdir(),'hz-she-'+Date.now()+'.pdf');await p.pdf({path:f,preferCSSPageSize:true,printBackground:true});
  const t=execSync(`pdftotext -enc UTF-8 "${f}" -`).toString('utf8');fs.unlinkSync(f);const pages=t.split('\f').filter((x,i,a)=>i<a.length-1||x.trim()).length;
  const miss=CH.filter(ch=>hasFont(ch)&&!t.includes(ch)),tofu=(t.match(/[□�]/g)||[]).length,longOk=t.replace(/\s/g,'').includes('X0Y9X0Y9');
  console.log(type,JSON.stringify({pages,miss,tofu,longOk,...st}));
  if(pages!==1)bad.push(type+'：印刷が '+pages+' 頁');if(miss.length)bad.push(type+'：PDF に出ない字 '+miss.join(' '));if(tofu)bad.push(type+'：PDF に □／� が '+tofu+' 字');
  if(st.over.length)bad.push(type+'：マスから横にはみ出す '+st.over.join(' | '));if(st.sw>st.W+1)bad.push(type+'：紙の幅を横にはみ出す '+st.sw);
  await p.emulateMedia({media:'screen'});await p.setViewportSize({width:390,height:844})}
 const after=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1'))).sort().join(','));if(after!==k0)bad.push('kinmuhyo_v1 の形が変わった');
 const skip=CH.filter(ch=>!hasFont(ch));if(skip.length)console.log('この端末に字の形が無いので数えない字：'+skip.join(' '));
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
