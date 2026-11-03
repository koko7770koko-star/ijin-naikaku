// 人員・資格の確認：30人・資格5つ（名前の長いもの）の人がいても、390px で行が切れず・重ならず・横にはみ出さず、資格の窓のボタンが44px以上であることを確かめる。
// usage: node hozen/tools/staffmanycheck.js [スクリーンショットの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>{const L=['第三種電気主任技術者','第二種電気工事士','消防設備士（甲種第4類）','高圧ケーブル絶縁診断技術者','低圧電気取扱特別教育修了'];S.qualList=[...new Set([...S.qualList,...L])];
  S.settings.staff=[...Array(30)].map((_,i)=>'職員'+(i+1));S.quals={};S.settings.staff.forEach((n,i)=>{if(i%3!==2)S.quals[n]=L.slice(0,i%3===0?5:2)});go('staff');return JSON.stringify(S.quals)});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')];const w=document.documentElement.clientWidth;
  return {n:it.length,sw:document.documentElement.scrollWidth,cut:it.filter(e=>e.scrollWidth>e.clientWidth+1||e.getBoundingClientRect().right>w+1).length,small:it.filter(e=>e.getBoundingClientRect().height<44).length,ov:it.some((e,i)=>i&&e.getBoundingClientRect().top<it[i-1].getBoundingClientRect().bottom-1)}});
 if(r.n<30)bad.push('一覧が '+r.n+' 人しか出ない');if(r.sw>392)bad.push('横にはみ出す '+r.sw);if(r.cut)bad.push('行が切れる '+r.cut);if(r.small)bad.push('44px未満の行 '+r.small);if(r.ov)bad.push('行が重なる');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>editQual('職員1'));await p.waitForTimeout(300);
 const m=await p.evaluate(()=>{const f=[...document.querySelectorAll('#modal button')].map(x=>x.getBoundingClientRect());return {minH:Math.min(...f.map(x=>x.height)),over:f.some(x=>x.right>innerWidth+1||x.left<-1),sw:document.documentElement.scrollWidth}});
 if(m.minH<44)bad.push('資格の窓のボタンが44px未満 '+m.minH);if(m.over||m.sw>392)bad.push('資格の窓がはみ出す');
 const after=await p.evaluate(()=>JSON.stringify(S.quals));if(after!==before)bad.push('開いただけで資格が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
