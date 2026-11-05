// 技術資料（lib）の「名前順」で、題の中の数が数として並ぶ（資料2 が 資料10 より前）ことを確かめる（hz-l-lib）。
// あわせて文字「大」「特大」・360px で一覧のページが横にはみ出さないこと。名前は「技術資料1」の形だけ。
// usage: node hozen/tools/libnamesortcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['',390],['xl',360],['l',360]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{S.library=[12,2,10,1,11,3].map(i=>({id:'lib'+i,title:'技術資料'+i+'：保守要領書',tags:'保守',note:'',equipIds:[]}));S.settings.fscale=fs;save();applyFScale();
   V.libSort='name';go('lib');const t=[...document.querySelectorAll('#app .item .ti')].map(e=>e.innerText.match(/技術資料(\d+)/)).filter(Boolean).map(m=>+m[1]);
   return {t,sw:document.documentElement.scrollWidth}},fs);
  const want=[1,2,3,10,11,12];
  if(r.t.join()!==want.join())errs.push((fs||'標準')+W+' 名前順が数の順でない：'+r.t.join(','));
  if(r.sw>W+1)errs.push((fs||'標準')+W+' ページが横にはみ出す '+r.sw);
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
