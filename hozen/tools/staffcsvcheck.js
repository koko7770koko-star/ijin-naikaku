// 人員・資格の CSV 書き出し：人員の画面に CSV ボタンがあり（44px 以上・はみ出さない）、押すと「人員資格_日付.csv」が BOM 付きで渡り、
// 資格 1 件 1 行・資格の無い人は資格名が空の 1 行・カンマや改行や引用符を含む名前が崩れない。人員が 0 人なら作らない。記録は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>{S.quals={'甲,1':['電験三種','第二種電気工事士'],'乙"2"\n丙':['電験三種'],'丁':[]};save();go('staff');
  window.claude={use:async n=>n==='downloads'?{save:async({filename,data})=>{const u=new Uint8Array(await data.arrayBuffer());window.__saved={filename,head:[...u.slice(0,3)],text:new TextDecoder().decode(u)};return true}}:null};return JSON.stringify(S.quals)});
 await p.waitForTimeout(300);
 const btn=await p.evaluate(()=>{const e=[...document.querySelectorAll('#app button')].find(x=>x.textContent.trim()==='CSV');if(!e)return null;const r=e.getBoundingClientRect();return {h:r.height,w:r.width,right:r.right,sw:document.documentElement.scrollWidth}});
 ok(btn,'人員の画面に CSV ボタンが無い');if(btn){ok(btn.h>=44,'CSV ボタンが 44px 未満 '+btn.h);ok(btn.right<=390&&btn.sw<=390,'横にはみ出す')}
 await p.evaluate(()=>{[...document.querySelectorAll('#app button')].find(x=>x.textContent.trim()==='CSV').click()});await p.waitForTimeout(600);
 const s=await p.evaluate(()=>window.__saved||null);
 ok(s&&/^人員資格_\d{4}-\d{2}-\d{2}\.csv$/.test(s.filename),'ファイル名が違う '+(s&&s.filename));
 ok(s&&s.head.join()==='239,187,191','先頭が BOM でない');
 if(s){const t=s.text.replace(/^\uFEFF/,'');
  ok(t.includes('"名前","資格名"'),'見出しが無い '+t.slice(0,60));
  ok(t.includes('"甲,1","電験三種"')&&t.includes('"甲,1","第二種電気工事士"'),'資格 1 件 1 行になっていない');
  ok(t.includes('"乙""2""\n丙","電験三種"'),'引用符・改行を含む名前が崩れる');
  ok(/"丁",""/.test(t),'資格の無い人の行が無い');}
 ok(await p.evaluate(()=>JSON.stringify(S.quals))===before,'記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
