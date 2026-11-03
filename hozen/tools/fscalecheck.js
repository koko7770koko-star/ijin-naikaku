// 文字の大きさ（標準・大・特大）：古い記録（fscale なし）がそのまま読め標準になる／設定で切り替わり保存され再読み込みでも残る／
// 特大でも全画面が横にはみ出さない／印刷には効かない／保存キーと SCHEMA は変えない。
// usage: node hozen/tools/fscalecheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const src=fs.readFileSync(FILE,'utf8');if(!/@media print\{#sysbar[^]*?html\{zoom:1!important\}/.test(src))bad.push('印刷で zoom を戻す指定が無い');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 // 古い記録：fscale が無い
 await p.addInitScript(()=>{if(!localStorage.getItem('hospElecSched_v1'))localStorage.setItem('hospElecSched_v1',JSON.stringify({settings:{name:'旧'},items:[],marks:{},tasks:[],daily:{},notes:{},issues:[],inbox:[]}))});
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 let r=await p.evaluate(()=>({f:S.settings.fscale,z:document.documentElement.style.zoom,n:S.settings.name}));if(r.f!==''||r.z!==''||r.n!=='旧')bad.push('古い記録の読み込み '+JSON.stringify(r));
 await p.evaluate(()=>{go('set',{setTab:'basic'})});await p.waitForTimeout(300);
 if(!await p.evaluate(()=>[...document.querySelectorAll('#app button')].some(x=>x.textContent.trim()==='特大')))bad.push('特大のボタンが無い（設定の基本）');
 await p.click('#app button:has-text("特大")');await p.waitForTimeout(300);
 r=await p.evaluate(()=>({f:S.settings.fscale,z:document.documentElement.style.zoom,ls:JSON.parse(localStorage.getItem('hospElecSched_v1')).settings.fscale}));
 if(r.f!=='xl'||r.z!=='1.25')bad.push('特大にならない '+JSON.stringify(r));
 await p.waitForTimeout(600);r=await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).settings.fscale);if(r!=='xl')bad.push('保存されない '+r);
 await p.reload();await p.waitForTimeout(1500);r=await p.evaluate(()=>document.documentElement.style.zoom);if(r!=='1.25')bad.push('読み直しで戻る '+r);
 // 特大で全画面にはみ出しが無い
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 for(const v of views){await p.evaluate(x=>{try{go(x)}catch(e){}},v);await p.waitForTimeout(120);const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));if(o.sw>o.iw+2){const w=await p.evaluate(()=>{const r=[];document.querySelectorAll('#app *,nav *,header *').forEach(e=>{const b=e.getBoundingClientRect();if(b.right>innerWidth+1&&b.width>0)r.push((e.className||e.tagName)+' '+Math.round(b.right)+' '+(e.textContent||'').trim().slice(0,16))});return r.slice(0,4).join(',')});bad.push(v+' が特大ではみ出す '+o.sw+'/'+o.iw+' '+w)}}
 await p.evaluate(()=>go('home'));await p.waitForTimeout(200);if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>setFScale(''));r=await p.evaluate(()=>document.documentElement.style.zoom);if(r!=='')bad.push('標準に戻らない '+r);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
