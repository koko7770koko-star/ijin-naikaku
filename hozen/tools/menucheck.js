// メニュー：検索欄の例が切れない・各タイルの説明が2行以内・文字12px以上・旧い説明の語でも検索で見つかる・はみ出さない・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);await p.evaluate(()=>go('menu'));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const s=document.querySelector('.msearch');const cv=document.createElement('canvas').getContext('2d');cv.font=getComputedStyle(s).font;
  const tw=cv.measureText(s.placeholder).width,iw=s.clientWidth-parseFloat(getComputedStyle(s).paddingLeft)-parseFloat(getComputedStyle(s).paddingRight);
  const md=[...document.querySelectorAll('.mtile .md')].map(e=>{const cs=getComputedStyle(e);return {t:e.textContent,lines:Math.round(e.getBoundingClientRect().height/parseFloat(cs.lineHeight)),fs:parseFloat(cs.fontSize)}});
  return {tw,iw,n:document.querySelectorAll('.mtile').length,md,sw:document.documentElement.scrollWidth}});
 if(r.tw>r.iw)bad.push('検索欄の例が切れる '+Math.round(r.tw)+'>'+Math.round(r.iw));
 r.md.forEach(x=>{if(x.lines>2)bad.push('説明が3行以上：'+x.t);if(x.fs<12)bad.push('説明の文字が小さい：'+x.t)});
 if(r.sw>392)bad.push('横にはみ出す');
 const find=async q=>{await p.fill('.msearch',q);return p.evaluate(()=>[...document.querySelectorAll('.mtile')].filter(t=>t.style.display!=='none').length)};
 for(const q of ['校正','QR','バックアップ','MTBF','単線結線図','APIキー','停電計画'])if(!(await find(q)))bad.push('検索で見つからない：'+q);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');if(process.argv[2]){await p.fill('.msearch','');await p.evaluate(()=>menuFilter(''));await p.screenshot({path:process.argv[2],fullPage:false})}await b.close();process.exit(errs.length||bad.length?1:0)})();
