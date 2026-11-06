// メニューの機能の絞り込み（menuFilter）：全角・半角・ひらがな・カタカナ・大小の違いでも見つかる。保存する値は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>go('menu'));await p.waitForTimeout(400);
 const before=await p.evaluate(()=>JSON.stringify(S));
 const vis=()=>p.evaluate(()=>[...document.querySelectorAll('.mtile')].filter(t=>t.style.display!=='none').length);
 const total=await p.evaluate(()=>document.querySelectorAll('.mtile').length);
 const first=await p.evaluate(()=>document.querySelector('.mtile .mt').textContent.trim());
 const kata=first.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
 const hira=first.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
 const full=first.replace(/[A-Za-z0-9]/g,c=>String.fromCharCode(c.charCodeAt(0)+0xFEE0));
 for(const q of [first,kata,hira,full,first.toLowerCase()]){await p.evaluate(q=>menuFilter(q),q);const n=await vis();if(n<1)bad.push(`「${q}」で見つからない（元「${first}」）`);if(n===total&&total>3)bad.push(`「${q}」で全部残る`)}
 await p.evaluate(()=>{const t=document.querySelector('.mtile');t.dataset.q='ﾄﾗﾝｽ ＡＢＣ とらんす';menuFilter('トランス');});
 if(!(await p.evaluate(()=>document.querySelector('.mtile').style.display!=='none')))bad.push('半角カナが見つからない');
 await p.evaluate(()=>menuFilter('ａｂｃ'));if(!(await p.evaluate(()=>document.querySelector('.mtile').style.display!=='none')))bad.push('全角英字（小文字）が見つからない');
 await p.evaluate(()=>menuFilter(''));if((await vis())!==total)bad.push('空にしても戻らない');
 if(await p.evaluate(()=>JSON.stringify(S))!==before)bad.push('記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
