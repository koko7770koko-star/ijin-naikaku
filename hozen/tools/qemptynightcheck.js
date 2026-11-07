// 「探す」で 0 件の箱（qEmpty：見つかりません・条件を外す・完了も含めて探す）と、ホームの申し送りの欄（長い英数字の折り返し）を、
// 幅 360px・文字「特大」で、昼と夜の表示で見る：ボタンが重ならず 44px 以上・文字がボタンからはみ出さない・横にはみ出さない・文字と背景の色の差が 4.5:1 以上（hz-v-qempty-360・hz-v-night-longword）。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/qemptynightcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:360,height:780}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 await p.evaluate(()=>{window.save=()=>{};S.issues=[{id:'i1',date:TODAY,title:'VCB 異音',status:'対応中',urgency:'中'}];S.works=[{id:'w1',date:TODAY,title:'VCB 点検',status:'予定'}];
  S.handover={[addD(TODAY,-1)]:{text:('ABC123xyz').repeat(20),by:'',at:''}};const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);S.issues=m.issues;S.works=m.works;S.handover=m.handover}S.settings.fscale='xl';applyFScale()});
 const look=sel=>p.evaluate(sel=>{const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(',').map(Number);return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}};
   const lum=c=>{const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b)};
   const bgOf=e=>{const st=[];for(let n=e;n;n=n.parentElement){const q=parse(getComputedStyle(n).backgroundColor);if(q&&q.a>0)st.push(q);if(q&&q.a>=1)break}let base={r:255,g:255,b:255};for(const q of st.reverse())base={r:q.r*q.a+base.r*(1-q.a),g:q.g*q.a+base.g*(1-q.a),b:q.b*q.a+base.b*(1-q.a)};return base};
   const box=document.querySelector(sel);if(!box)return {none:1};const o=[];
   box.querySelectorAll('*').forEach(e=>{if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const fg=parse(getComputedStyle(e).color),bg=bgOf(e);const L1=lum(fg),L2=lum(bg),cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);if(cr<4.5)o.push('色の差 '+cr.toFixed(1)+' 「'+e.textContent.trim().slice(0,12)+'」')});
   const bs=[...box.querySelectorAll('button')].map(x=>x.getBoundingClientRect());const btn=[...box.querySelectorAll('button')];
   btn.forEach((x,i)=>{if(bs[i].height<44)o.push('ボタンが低い '+Math.round(bs[i].height));if(x.scrollWidth>x.clientWidth+1)o.push('文字がボタンからはみ出す「'+x.textContent.trim()+'」')});
   for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i],d=bs[j];if(a.left<d.right-1&&d.left<a.right-1&&a.top<d.bottom-1&&d.top<a.bottom-1)o.push('ボタンが重なる')}
   return {o,sw:document.documentElement.scrollWidth,n:btn.length}},sel);
 for(const night of ['off','on']){const tag=(night==='on'?'夜':'昼')+'・';
  await p.evaluate(n=>{S.settings.night=n;try{applyNight()}catch(e){document.documentElement.classList.toggle('night',n==='on')}},night);
  for(const [lab,set] of [['異常の一覧',"V.isF='open';V.isQ='無い語';go('issues')"],['作業管理',"V.wkF='open';V.wkQ='無い語';go('works')"]]){
   await p.evaluate(s=>eval(s),set);const r=await look('#app .empty');
   if(r.none)bad.push(tag+lab+'：見つかりませんの箱が出ない');else{if(r.n<2)bad.push(tag+lab+'：ボタンが '+r.n+' 個（2 個のはず）');r.o.forEach(x=>bad.push(tag+lab+'：'+x));if(r.sw>362)bad.push(tag+lab+'：横にはみ出す '+r.sw)}}
  await p.evaluate(()=>{V.isQ='';V.wkQ='';go('home')});const h=await p.evaluate(()=>{const c=[...document.querySelectorAll('#app .card')].find(x=>/申し送り/.test(x.textContent));if(c)c.id='hoCardT';return !!c});
  if(!h)bad.push(tag+'ホームに申し送りの欄が出ない');else{const r=await look('#hoCardT');r.o.forEach(x=>bad.push(tag+'ホームの申し送り：'+x));if(r.sw>362)bad.push(tag+'ホームが横にはみ出す '+r.sw)}
  console.log(tag+'night='+await p.evaluate(()=>document.documentElement.className))}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
