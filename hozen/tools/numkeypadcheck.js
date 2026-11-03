// 数字の欄の確認：type=number の欄がすべて inputmode（小数が要る欄は decimal、整数だけの欄は numeric）を持つこと。
// 保存する値・項目の名前は変えない（入力の属性だけ）。画面を開いて実際の欄も調べる（390px）。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const src=fs.readFileSync(FILE,'utf8');
const tags=src.match(/<input\b[^>]*type=["']?number["']?[^>]*>/g)||[];
for(const t of tags){const m=t.match(/inputmode="(\w+)"/);
 if(!m){bad.push('inputmode が無い: '+t.slice(0,90));continue}
 const dec=/step="(any|0\.\d+)"/.test(t);
 if(dec&&m[1]!=='decimal')bad.push('小数の欄が decimal でない: '+t.slice(0,90));
 if(!dec&&!/^(decimal|numeric)$/.test(m[1]))bad.push('inputmode が不正: '+t.slice(0,90))}
if(tags.length<40)bad.push('type=number の欄が少なすぎる（読み取り失敗？） '+tags.length);
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 let seen=0;
 for(const s of ['home','month','day','equip','set','stock','works','gen','plan','budget','meter']){
  try{await p.evaluate(x=>{if(typeof go==='function')go(x)},s);await p.waitForTimeout(250)}catch(e){continue}
  const r=await p.evaluate(()=>[...document.querySelectorAll('input[type=number]')].filter(i=>!i.getAttribute('inputmode')).map(i=>i.id||i.outerHTML.slice(0,60)));
  seen+=1;if(r.length)bad.push(s+' に inputmode の無い数字欄: '+r.join(','))}
 console.log([...errs,...bad].join('\n')||'NO ERRORS ('+tags.length+'欄)');await b.close();process.exit(errs.length||bad.length?1:0)})();
