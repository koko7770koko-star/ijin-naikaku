// 記録が多いとき（予定2000件・日常点検3年分・設備1000台・異常500件）に、開く・画面を切り替える・保存が遅くないかを測る。
// usage: node hozen/tools/bigcheck.js [上限ms=500]   人の名前は「職員1」の形だけ。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const LIM=+process.argv[2]||500;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[],slow=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const gen=await p.evaluate(()=>{const pad=n=>String(n).padStart(2,'0'),ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const base=new Date();const days=[...Array(1095)].map((_,i)=>{const d=new Date(base);d.setDate(d.getDate()-i);return ds(d)});
  const nd=numDefs(),cd=chkDefs();
  S.daily={};days.forEach((k,i)=>{const r={c:{}};nd.forEach(n=>{r[n.id]=String(100+(i%7))});cd.forEach(x=>{r.c[x.id]='○'});r.note='職員'+(i%9+1);S.daily[k]=r});
  S.tasks=[...Array(2000)].map((_,i)=>({id:'tk'+i,date:days[i%1095],time:'',title:'点検作業'+i,kind:'点検',cat:'',place:'A棟',staff:'職員'+(i%9+1),attend:'',status:i%3?'完了':'予定',result:'',note:'',photos:[],equipId:''}));
  S.equipment=[...Array(1000)].map((_,i)=>({id:'eq'+i,code:'E-'+String(i+1).padStart(4,'0'),name:'設備'+(i+1),place:'A棟',locId:'',status:'稼働',run:{meters:[]},repairs:i%10?[]:[{id:'rp'+i,date:days[i%300],kind:'修理',content:'確認',vendor:''}],photos:[],docs:[]}));
  S.issues=[...Array(500)].map((_,i)=>({id:'is'+i,date:days[i%800],title:'異常'+i,place:'A棟',detail:'確認',action:'',status:i%4?'完了':'発見',equipId:'eq'+(i%1000),photos:[],log:[]}));
  const t0=performance.now();save();return {saveMs:Math.round(performance.now()-t0),bytes:localStorage.getItem(KEY).length}});
 console.log('保存 '+gen.saveMs+'ms・記録 '+(gen.bytes/1e6).toFixed(2)+'M文字（約5Mが上限）');if(gen.saveMs>LIM)slow.push('save() '+gen.saveMs+'ms');
 const t0=Date.now();await p.reload();await p.waitForFunction(()=>typeof S!=='undefined'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length,null,{timeout:30000});const loadMs=Date.now()-t0;console.log('読み込み '+loadMs+'ms');if(loadMs>2000+LIM)slow.push('読み込み '+loadMs+'ms');
 const ct=await p.evaluate(()=>({d:Object.keys(S.daily).length,t:S.tasks.length,e:(S.equipment||[]).length,i:S.issues.length}));console.log('読み直し後の件数',JSON.stringify(ct));
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 for(const v of views){const ms=await p.evaluate(v=>{try{const t=performance.now();go(v,v==='dailyRep'?{day:TODAY}:v==='equipDetail'?{eq:'eq5'}:undefined);return Math.round(performance.now()-t)}catch(e){return 'ERR '+e.message}},v);
  console.log(String(v).padEnd(11),ms);if(typeof ms==='string')errs.push(v+' '+ms);else if(ms>LIM)slow.push(v+' '+ms+'ms')}
 const sv=await p.evaluate(()=>{const t=performance.now();save();return Math.round(performance.now()-t)});console.log('保存（読み直し後）',sv+'ms');if(sv>LIM)slow.push('save() '+sv+'ms');
 const w=await p.evaluate(async()=>{try{localStorage.setItem('__fill','x'.repeat(4100000))}catch(e){return 'ERR '+e.message}await checkStorage();const m=STORAGE_WARN;localStorage.removeItem('__fill');await checkStorage();return m});
 console.log('容量の注意（約82%のとき）：',w||'出ない');if(!/保存領域/.test(w))errs.push('容量が近いのに注意が出ない：'+w);
 const qn=await p.evaluate(()=>{go('qr');V.qrAll=false;render();const a=document.querySelectorAll('.qrl').length;window.print=()=>{};qrPrint();return new Promise(r=>setTimeout(()=>r([a,document.querySelectorAll('.qrl').length]),300))});
 console.log('QRラベル 表示→印刷時',qn.join('→'));if(qn[0]>150||qn[1]!==1000)errs.push('QRラベルの表示数が想定と違う '+qn);
 console.log(slow.length?'遅い：'+slow.join('、'):'遅い画面なし（上限 '+LIM+'ms）');console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
