// 設定：最後にファイルへ書き出した日と何日前かが、書き出しボタンのすぐ上に出る。
// 未保存=赤・7日以上=橙・30日以上=赤・当日=緑。横にはみ出さない。記録（lastBackup）は読むだけで変えない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const cases=[['',null,'ng',/まだ一度も/],['today',0,'ok',/今日/],['3',3,'ok',/3日前/],['10',10,'warn',/10日前/],['29',29,'warn',/29日前/],['30',30,'ng',/30日前/],['90',90,'ng',/90日前/]];
 for(const [k,d,lv,re] of cases){
  const r=await p.evaluate(d=>{if(d===null)S.settings.lastBackup='';else{const t=new Date(TODAY+'T00:00:00');t.setDate(t.getDate()-d);S.settings.lastBackup=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')}
   const before=S.settings.lastBackup;go('set');const e=document.getElementById('bkAge');
   if(!e)return {none:1};const btn=[...document.querySelectorAll('button')].find(x=>/Googleドライブに保存/.test(x.textContent));
   const rb=e.getBoundingClientRect(),bb=btn.getBoundingClientRect();
   return {lv:e.dataset.lv,text:e.textContent,before,after:S.settings.lastBackup,above:rb.bottom<=bb.top+1,right:rb.right,sw:document.documentElement.scrollWidth,iw:innerWidth}},d);
  await p.waitForTimeout(150);
  ok(!r.none,k+': 表示が出ない');if(r.none)continue;
  ok(r.lv===lv,`${k}: 色の段階 ${r.lv}≠${lv}`);ok(re.test(r.text),`${k}: 文言 ${r.text}`);ok(r.above,k+': ボタンの上にない');
  ok(r.before===r.after,k+': 記録が変わった');ok(r.right<=r.iw&&r.sw<=r.iw,k+': 横にはみ出す')}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
