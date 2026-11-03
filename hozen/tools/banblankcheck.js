// 盤の点検：現場で手書きする空の点検表（A4縦）の確認。A〜F棟×3階×4盤で棟ごとに1ページ（計6ページ）になり、
// 画面（390px）には出ず横にはみ出さず、盤が多い棟（40面）でも行が割れず見出しが2ページ目にも出ることを確かめる。保存は変えない。
// usage: node hozen/tools/banblankcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const before=await p.evaluate(()=>{const L=[];['A','B','C','D','E','F'].forEach((x,i)=>{L.push({id:'b'+i,name:x+'棟',type:'建屋',parent:''});for(let f=1;f<=3;f++){L.push({id:'f'+i+f,name:f+'F',type:'階',parent:'b'+i});for(let k=1;k<=4;k++)L.push({id:'k'+i+f+k,name:'盤'+k,type:'盤',parent:'f'+i+f})}});S.locs=L;
  go('ban');return JSON.stringify(S.banChk||{})});await p.waitForTimeout(400);
 const sc=await p.evaluate(()=>({n:document.querySelectorAll('.banprint').length,d:[...document.querySelectorAll('.banprint')].map(e=>getComputedStyle(e).display).join(),w:document.documentElement.scrollWidth}));
 if(sc.n!==6)bad.push('棟ごとの表が '+sc.n+' 枚（6枚のはず）');if(/block/.test(sc.d))bad.push('画面で印刷用の表が出ている');if(sc.w>392)bad.push('横にはみ出す');
 const pages=async()=>{await p.evaluate(()=>document.body.classList.add('bbp'));await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.evaluate(()=>document.body.classList.remove('bbp'));await p.emulateMedia({media:'screen'});return [buf,(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length]};
 let [buf,n]=await pages();if(n!==6)bad.push('A4で '+n+' ページ（棟ごと6ページのはず）');
 if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.evaluate(()=>{for(let f=1;f<=3;f++)for(let k=5;k<=14;k++)S.locs.push({id:'x'+f+k,name:'盤'+k,type:'盤',parent:'f0'+f});go('ban')});await p.waitForTimeout(300);
 [buf,n]=await pages();if(n!==7)bad.push('盤が多い棟で '+n+' ページ（7ページのはず）');
 const after=await p.evaluate(()=>JSON.stringify(S.banChk||{}));if(after!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
