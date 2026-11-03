// 読み上げ（TalkBack）の確認：全画面を開き、見える文字が記号 1〜2 文字だけで aria-label も title も無い button/a を数えて一覧にする。
// 引数なし：数が 0 でなければ失敗。usage: node hozen/tools/a11ycheck.js [--list]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const views=['home','month','day','equip','hist','year','report','set','locs','plan','works','issues','staff','stock','dwgs','lib','ai','dailyRep','menu','mtpl','diag','stds'];
 const found=new Map();
 for(const v of views){try{await p.evaluate(x=>go(x),v);await p.waitForTimeout(250)}catch(e){continue}
  const r=await p.evaluate(()=>[...document.querySelectorAll('button,a,[role=button]')].filter(e=>{const t=(e.textContent||'').trim();return t.length>0&&t.length<=2&&!/[぀-ヿ一-鿿A-Za-z0-9]/.test(t)&&!e.getAttribute('aria-label')&&!e.title&&e.getBoundingClientRect().width>0}).map(e=>(e.textContent||'').trim()+' | '+(e.getAttribute('onclick')||'').slice(0,50)));
  for(const x of r)if(!found.has(x))found.set(x,v)}
 if(process.argv.includes('--list'))for(const [k,v] of found)console.log(v+': '+k);
 console.log([...errs,...(found.size?[found.size+' 件の記号だけのボタンに名前が無い']:[])].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||found.size?1:0)})();
