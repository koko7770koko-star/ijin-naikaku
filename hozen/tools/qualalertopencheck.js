// ホームのお知らせ「資格の期限 n人」：1人だけならその人の資格の窓が開き、2人以上なら職員の画面へ（hz-v-alert-open-qual）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof go==='function');
 const tap=async()=>{await p.evaluate(()=>{V.moreAl=true;go('home')});await p.waitForTimeout(300);
  return p.evaluate(()=>{const e=[...document.querySelectorAll('#app [onclick]')].reverse().find(x=>/資格の期限/.test(x.textContent));if(!e)return null;e.click();return true})};
 await p.evaluate(()=>{S.quals=S.quals||{};S.qualExp=S.qualExp||{};S.quals['職員"1']=['第三種電気主任技術者'];S.qualExp['職員"1']={'第三種電気主任技術者':addD(TODAY,10)};save()});
 if(!await tap())bad.push('1人：お知らせが無い');else{await p.waitForTimeout(300);const h=await p.evaluate(()=>{const m=document.querySelector('#modal h3');return [V.view,m&&m.offsetParent!==null?m.textContent:'']});
  if(h[0]!=='staff')bad.push('1人：職員の画面へ行かない '+h[0]);if(h[1]!=='資格：職員"1')bad.push('1人：その人の資格の窓が開かない（'+(h[1]||'窓なし')+'）');await p.evaluate(()=>{try{closeModal(true)}catch(e){}})}
 await p.evaluate(()=>{S.quals['職員2']=['第一種電気工事士'];S.qualExp['職員2']={'第一種電気工事士':addD(TODAY,-3)};save()});
 if(!await tap())bad.push('2人：お知らせが無い');else{await p.waitForTimeout(300);const h=await p.evaluate(()=>{const m=document.querySelector('#modal h3');return [V.view,m&&m.offsetParent!==null?m.textContent:'']});
  if(h[0]!=='staff')bad.push('2人：職員の画面へ行かない '+h[0]);if(h[1])bad.push('2人：窓が開いてしまう '+h[1])}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
