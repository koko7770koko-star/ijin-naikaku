// 設定：書き出し・復元のボタンの下に、何が入るか・復元すると今の記録がどうなるかの説明が出る。
// 390px で横にはみ出さない・ボタンの下にある・記録（S）を変えない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{const before=JSON.stringify(S);go('set');const e=document.getElementById('bkHelp');if(!e)return {none:1};
  const btn=[...document.querySelectorAll('button,label')].find(x=>/ファイルに保存/.test(x.textContent));const rb=e.getBoundingClientRect(),bb=btn.getBoundingClientRect();
  return {text:e.textContent,below:rb.top>=bb.bottom-1,right:rb.right,sw:document.documentElement.scrollWidth,iw:innerWidth,same:before===JSON.stringify(S)}});
 ok(!r.none,'説明が出ない');
 if(!r.none){ok(/書き出/.test(r.text)&&/置き換え/.test(r.text)&&/履歴/.test(r.text),'文言 '+r.text);ok(r.below,'ボタンの下にない');ok(r.right<=r.iw&&r.sw<=r.iw,'横にはみ出す');ok(r.same,'記録が変わった')}
 await p.screenshot({path:process.env.SHOT||'/tmp/backuphelp.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
