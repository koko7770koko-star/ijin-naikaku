// 夜勤シフト表の印刷：文字「特大」（と「大」）にしていても、提出用の cal・p11 が A4 で 1 か月 1 ページに収まり、表が枠からはみ出さず、
// 見出しの名前が切れず、31 日の月も 1 日〜31 日が全部紙に出る（画面の文字の大きさが紙に漏れない）。hz-v-shift-print-xl
// 名前は「職員1」の形だけ。保存の形（kinmuhyo_v1）は変えず、読み直した形だけ使う。通信は止める。usage: node hozen/tools/shiftprintxlcheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();
 for(const fsc of ['xl','l']){const tag=({xl:'特大',l:'大'})[fsc];
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fsc);
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);
 const o=await p.evaluate(()=>localStorage.getItem('kinmuhyo_v1'));
 if(!o){console.log('シフトの保存が見つからない');process.exit(1)}
 await p.evaluate(o=>{const x=JSON.parse(o);x.members=[...Array(10)].map((_,i)=>({name:'職員'+(i+1),type:i<8?'夜勤':'日勤'}));x.sub={type:'cal',month:'2026-12'};x.view='2026-12';localStorage.setItem('kinmuhyo_v1',JSON.stringify(x))},o);
 await p.reload();await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>document.documentElement.dataset.fs)===fsc,tag+'：文字の大きさが読み直しで残らない（確かめの作りの誤り）');
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);await p.click('#tabs button[data-p="sub"]');await p.waitForTimeout(800);
 for(const t of ['cal','p11']){
  await p.selectOption('#subType',t);await p.waitForTimeout(300);
  /* cal はその月、p11 は前の月の 11 日〜その月の 10 日なので、31 日を含む月を選ぶ */
  const ms=await p.evaluate(()=>[...document.querySelectorAll('#subMonth option')].map(o=>o.value));
  const m31=ms.find(m=>(t==='cal'?/-(01|03|05|07|08|10|12)$/:/-(01|02|04|06|08|09|11)$/).test(m))||ms[0];
  await p.selectOption('#subMonth',m31);await p.waitForTimeout(200);
  await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.waitForTimeout(150);
  const r=await p.evaluate(()=>{const sh=document.querySelector('#subSheets .sheet');if(!sh)return null;
   const ths=[...sh.querySelectorAll('thead th')];const cut=ths.filter(h=>h.scrollHeight>h.clientHeight+1||h.scrollWidth>h.clientWidth+1).length;
   const sb=sh.getBoundingClientRect(),tb=sh.querySelector('table').getBoundingClientRect();
   return {cut,inside:tb.right<=sb.right+1,zoom:getComputedStyle(document.documentElement).zoom}});
  ok(!!r,`${tag}・${t}：用紙が出ない`);
  if(r){ok(r.cut===0,`${tag}・${t}：切れている見出しが ${r.cut} 個`);ok(r.inside,`${tag}・${t}：表が枠からはみ出す`);ok(String(r.zoom)==='1',`${tag}・${t}：紙で文字の拡大が残る（zoom ${r.zoom}）`)}
  const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});
  const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;ok(pages===1,`${tag}・${t}：${m31} の印刷が ${pages} ページになる`);
  try{const f=path.join(os.tmpdir(),'spx'+process.pid+fsc+t+'.pdf');fs.writeFileSync(f,buf);const raw=execSync('pdftotext -raw '+f+' -',{encoding:'utf8'});fs.unlinkSync(f);
   if(process.env.DUMP)console.log(raw.slice(0,1500));
   const nums=new Set((raw.match(/\d+/g)||[]).map(Number));const miss=[...Array(31)].map((_,i)=>i+1).filter(d=>!nums.has(d));ok(!miss.length,`${tag}・${t}：紙に出ない日 ${miss.join(',')}`);
   for(const n of ['職員1','職員8'])ok(raw.includes(n),`${tag}・${t}：紙に「${n}」が出ない`)}catch(e){if(!/not found|ENOENT/.test(String(e.message)))bad.push('pdftotext '+e.message)}
  await p.emulateMedia({media:'screen'});
 }
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
