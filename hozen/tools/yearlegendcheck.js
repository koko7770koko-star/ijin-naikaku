// 年間計画：表の下に「印の見方：◯ 予定　● 実施済み　延 延期」が出て、PDF にしても紙に載り（表と同じページ）、390px で横にはみ出さない。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const before=await p.evaluate(()=>{const fy=V.fy;S.items=[...Array(8)].map((_,i)=>({id:'it'+i,name:'点検項目'+i,cat:'受変電',cycle:'毎月',base:fy+'-04-10',who:'自主'}));S.marks={[fy]:Object.fromEntries(S.items.map((it,i)=>[it.id,[...Array(12)].map((_,k)=>(k+i)%3===0?'済':(k+i)%3===1?'○':'延')]))};save();go('year');return JSON.stringify(S.marks)});
 await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const e=document.querySelector('.yrleg');if(!e)return null;const t=document.querySelector('table.yr').getBoundingClientRect(),l=e.getBoundingClientRect();return {t:e.textContent,below:l.top>=t.bottom-1,sw:document.documentElement.scrollWidth,iw:innerWidth,fs:parseFloat(getComputedStyle(e).fontSize)}});
 ok(!!r,'凡例が出ない');if(r){ok(/◯.*予定/.test(r.t)&&/●.*実施済み/.test(r.t)&&/延.*延期/.test(r.t),'凡例の言葉 '+r.t);ok(r.below,'表の下にない');ok(r.sw<=r.iw,'横にはみ出す');ok(r.fs>=12,'文字が小さい')}
 // 紙：PDF のテキストに凡例が入る
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});
 const vis=await p.evaluate(()=>{window.matchMedia('print');const e=document.querySelector('.yrleg');return !!e&&getComputedStyle(e).display!=='none'});
 ok(vis,'凡例が隠れている');ok(buf.length>2000,'PDF にならない');
 fs=require('fs');if(process.argv[2])fs.writeFileSync(process.argv[2],buf);
 ok(JSON.stringify(await p.evaluate(()=>S.marks))===before,'記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
