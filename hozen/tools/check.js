// 電気設備 総合保全管理：390px で開き、全画面を順に開いてエラーが無いこと、
// 記録が保存・再読み込みで残ること、データの形（保存キー・SCHEMA）が変わっていないことを確かめる。
// usage: node hozen/tools/check.js   （外部への通信はすべて止めて確かめる）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE=path.resolve(__dirname,'..','index.html');
const src=fs.readFileSync(FILE,'utf8');const bad=[];
// データの形：変えてよいのは窓口かユーザーが決めたときだけ
if(!src.includes("const KEY='hospElecSched_v1'"))bad.push('保存キー hospElecSched_v1 が変わった');
if(!src.includes("const KEY='kinmuhyo_v1'"))bad.push('保存キー kinmuhyo_v1 が変わった');
const sm=src.match(/const SCHEMA=(\d+);/);if(!sm)bad.push('SCHEMA が見つからない');else if(+sm[1]!==3)console.log('注意：SCHEMA が '+sm[1]+'（3 から変わった。古い記録を読み替える処理と、その確認を tests に書くこと）');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('CONSOLE '+m.text());});
 p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>{const u=r.request().url();return /^(file|data|blob):/.test(u)?r.continue():r.abort();});
 await p.goto('file://'+FILE);await p.waitForTimeout(2500);
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 for(const v of views){if(v==='equipDetail')continue;await p.evaluate(v=>{try{go(v)}catch(e){console.error('go '+v+' '+e.message)}},v);await p.waitForTimeout(300);
  const n=await p.evaluate(()=>document.body.innerText.length);if(n<20)bad.push('画面 '+v+' が空');}
 for(const v of ['home','month','day','shift','menu']){await p.click(`#nav button[data-v="${v}"]`).catch(e=>bad.push('下のボタン '+v+' が押せない'));await p.waitForTimeout(300);}
 // 保存して読み直すと残るか
 const mark='CHECK_'+Date.now();
 await p.evaluate(m=>{S.notes=S.notes||{};S.notes['__check']=m;save();},mark).catch(e=>bad.push('save() が呼べない '+e.message));
 await p.waitForTimeout(500);await p.reload();await p.waitForTimeout(2000);
 const kept=await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('hospElecSched_v1')).notes.__check}catch(e){return null}});
 if(kept!==mark)bad.push('保存した記録が読み直しで消えた');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す（幅 '+w+'px）');
 console.log('VIEWS',views.join(','));console.log([...errs,...bad].slice(0,15).join('\n')||'NO ERRORS');
 await b.close();process.exit(errs.length||bad.length?1:0);})();
