// 設備台帳の一覧の印刷：設備 500 台（長い名前・型式・場所）で、A4 の PDF に最後の 1 台まで出て、空に近い頁が出ず、
// 1 件の行が頁の境で割れず、文字「標準」「特大」でも紙の幅を横にはみ出さないか（hz-v-equip-print-many）。保存せず画面の中だけで確かめる。
// usage: node hozen/tools/equipprintmanycheck.js（pdftotext を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fsc of ['m','xl']){const tag=(fsc==='xl'?'特大':'標準')+'・';const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S);await p.waitForTimeout(200);
 const ms=await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;S.equipment=[];
  for(let i=0;i<500;i++)S.equipment.push({id:'ep'+i,code:'E-'+(1000+i),name:i%7===0?'高圧受電盤 真空遮断器（VCB）および保護継電器一式（長い名前の例）'+i:'分電盤'+i,kind:i%2?'分電盤':'受変電',importance:i%3?'B':'A',place:i%7===0?'A棟 3階 第2電気室 奥（長い場所の例）':'',maker:'○○電機',model:i%7===0?'VCB-7.2kV-600A-12.5kA-XXXXXXXXXXXXXXXXXXXX':'M'+i,serial:'',installed:'2015-04',life:'',status:'稼働',repairs:[],photos:[],docs:[]});
  const v=validateData(clone(S));if(!v.ok)throw new Error('validateData '+v.fatal);S.equipment=v.data.equipment;applyFScale();V.eqQ='';V.eqKind='';V.eqImp='';V.eqLoc='';
  const s=performance.now();go('equip');return performance.now()-s},fsc);
 if(ms>1000)bad.push(tag+'一覧が出るまで '+Math.round(ms)+'ms');
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const st=await p.evaluate(()=>{const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const rows=[...document.querySelectorAll('#app .item, #app tbody tr')].filter(vis);
  return{n:rows.length,split:rows.filter(r=>!/avoid/.test(getComputedStyle(r).breakInside)).length,sw:document.documentElement.scrollWidth,W:innerWidth,
   over:[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&(e.getBoundingClientRect().right>innerWidth+1)).slice(0,3).map(e=>e.tagName+'.'+e.className)}});
 const f=path.join(os.tmpdir(),'hz-eqp-'+Date.now()+'.pdf');await p.pdf({path:f,preferCSSPageSize:true,printBackground:true});
 let pages=[];try{pages=execFileSync('pdftotext',['-layout',f,'-']).toString('utf8').split('\f').filter((x,i,a)=>i<a.length-1||x.trim())}catch(e){console.log('SKIP pdftotext')}fs.unlinkSync(f);
 const all=pages.join('\n'),missCode=[...Array(500)].map((_,i)=>'E-'+(1000+i)).filter(k=>!all.includes(k));
 const thin=pages.map((t,i)=>[i+1,t.replace(/\s/g,'').length]).filter(x=>x[1]<40);
 console.log(tag+JSON.stringify({ms:Math.round(ms),pages:pages.length,thin,missCode:missCode.length,...st}));
 if(st.n<500)bad.push(tag+'印刷に出る行が '+st.n+'（500 台のはず）');if(st.split)bad.push(tag+'頁の境で割れる行 '+st.split);
 if(st.sw>st.W+1||st.over.length)bad.push(tag+'紙の幅からはみ出す '+st.sw+' '+st.over.join(','));
 if(pages.length&&missCode.length)bad.push(tag+'PDF に出ない設備 '+missCode.length+'（例 '+missCode.slice(0,3).join(',')+'）');if(thin.length)bad.push(tag+'空に近い頁 '+JSON.stringify(thin.slice(0,5)));
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
