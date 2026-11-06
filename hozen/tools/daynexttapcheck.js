// 日常点検：数字を入れた直後（欄を離れる前）に「次の未入力へ」を押しても1回目から効き、次の欄に移る。入れた値は保存される。指（タップ）でもマウスでも（hz-v-day-next-gen の続き）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const touch of [false,true]){const c=await b.newContext({viewport:{width:390,height:844},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
  await p.evaluate(()=>{delete S.daily[TODAY];go('day',{day:TODAY})});await p.waitForTimeout(300);
  const L0=await p.evaluate(()=>dayRestList(V.day).slice(0,2));
  await p.fill('#'+L0[0],'6.6');
  if(touch)await p.tap('#dayNextBtn');else await p.click('#dayNextBtn');await p.waitForTimeout(800);
  const r=await p.evaluate(id=>({ae:document.activeElement&&document.activeElement.id,v:(S.daily[TODAY]||{})[id.slice(2)]}),L0[0]);
  const tag=touch?'タップ：':'マウス：';
  if(r.ae!==L0[1])bad.push(tag+'1回目で次の欄に移らない（焦点 '+r.ae+'、次は '+L0[1]+'）');
  if(String(r.v)!=='6.6')bad.push(tag+'入れた値が保存されない '+r.v);
  bad.push(...errs);await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
