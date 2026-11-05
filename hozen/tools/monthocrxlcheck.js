// カレンダー（month）の「点検の案内・計画表を撮ると日付ごとに自動登録」の説明が、文字「大」「特大」・360px で
// 写真のボタンの横の細い列に押されて縦に割れない（説明の幅が画面の半分以上・3行以内）。標準・390px ははみ出さないことだけ見る（hz-xl-review-11）
// usage: node hozen/tools/monthocrxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 const r=await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('month');
  const e=[...document.querySelectorAll('#app .muted')].find(x=>x.textContent.includes('計画表を撮ると日付ごとに自動登録'));if(!e)return {miss:1};
  const bx=e.getBoundingClientRect(),lh=parseFloat(getComputedStyle(e).lineHeight)||parseFloat(getComputedStyle(e).fontSize)*1.5;
  return {w:bx.width,lines:Math.round(bx.height/lh),sw:document.documentElement.scrollWidth,iw:innerWidth}},fs);
 if(r.miss){errs.push(tag+'説明が見つからない');await c.close();continue}
 if(r.sw>r.iw+1)errs.push(tag+'はみ出す '+r.sw);
 if(fs&&(r.w<r.iw/2||r.lines>3))errs.push(tag+'説明が細い列で割れる（幅 '+Math.round(r.w)+'px・'+r.lines+'行）');
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
