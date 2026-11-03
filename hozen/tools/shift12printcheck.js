// 夜勤シフト表の印刷：12人・名前8文字でも、提出用（A4縦）の cal・p11 が1ページに収まり、名前の見出しが切れず、土日祝の日付の列が紙でも分かる（赤字・太字）。
// 名前は「作業員Ａあいうえ」の形だけ。保存の形（kinmuhyo_v1）は変えず、読み直した形だけ使う。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);
 const o=await p.evaluate(()=>localStorage.getItem('kinmuhyo_v1'));
 if(!o){console.log('シフトの保存が見つからない');process.exit(1)}
 await p.evaluate(o=>{const x=JSON.parse(o);x.members=[...Array(12)].map((_,i)=>({name:'作業員'+'ＡＢＣＤＥＦＧＨＩＪＫＬ'[i]+'あいうえ',type:i<9?'夜勤':'日勤'}));x.sub={type:'cal',month:'2026-11'};x.view='2026-11';localStorage.setItem('kinmuhyo_v1',JSON.stringify(x))},o);
 await p.reload();await p.waitForTimeout(1500);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);await p.click('#tabs button[data-p="sub"]');await p.waitForTimeout(800);
 for(const t of ['cal','p11']){
  await p.selectOption('#subType',t);await p.waitForTimeout(300);
  const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});
  const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;ok(pages===1,`${t}：12人で ${pages} ページになる`);
  const r=await p.evaluate(()=>{const sh=document.querySelector('#subSheets .sheet');if(!sh)return null;
   const ths=[...sh.querySelectorAll('thead th')];const cut=ths.filter(h=>h.scrollHeight>h.clientHeight+1||h.scrollWidth>h.clientWidth+1).length;
   const rows=[...sh.querySelectorAll('tbody tr')];const wk=rows.filter(tr=>{const td=tr.cells[1];return td&&/[土日]/.test(td.textContent)});
   const strong=wk.filter(tr=>{const cs=getComputedStyle(tr.cells[0]);return +cs.fontWeight>=600&&cs.color!==getComputedStyle(rows[0].cells[0]).color||+cs.fontWeight>=600});
   const sb=sh.getBoundingClientRect(),tb=sh.querySelector('table').getBoundingClientRect();
   return {names:ths.length,cut,wk:wk.length,strong:strong.length,inside:tb.right<=sb.right+1}});
  ok(!!r,t+'：用紙が出ない');if(!r)continue;
  ok(r.names>=14,`${t}：見出しが足りない（${r.names}）`);ok(r.cut===0,`${t}：切れている見出しが ${r.cut} 個`);ok(r.wk>=8,`${t}：土日の行が ${r.wk}`);ok(r.strong===r.wk,`${t}：土日の日付が太字でない行がある`);ok(r.inside,t+'：表が枠からはみ出す')}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
