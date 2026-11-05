// 夜の表示（night）×文字「特大」：ホーム・日常点検・シフト・メニューで、文字と背景の色の差（コントラスト）が小さい所と、夜の色が当たらず白いまま残った箱を探す（hz-night-xl-review）。
// usage: node hozen/tools/nightxlcontrastcheck.js [--list]   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const MIN=+(process.env.MINC||4.5);
(async()=>{const b=await chromium.launch();const out=[];
 const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());p.on('pageerror',e=>out.push('pageerror '+e.message));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(()=>{S.settings.night='on';S.settings.fscale='xl';S.equipment=[{id:'eq1',code:'E-1',name:'設備1',kind:'発電機',importance:'A',status:'稼働',photos:[],docs:[],repairs:[],spec:{}}];S.issues=S.issues||[];S.issues.push({id:'is1',date:addD(TODAY,-3),title:'不具合1',status:'発見',photos:[],log:[],urgency:'緊急',due:addD(TODAY,-1),equipId:'eq1'});save()});
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(500);
 for(const v of ['home','day','shift','menu']){
  await p.evaluate(v=>{try{closeModal(true)}catch(e){};go(v==='day'?'day':v,v==='day'?{day:TODAY}:undefined)},v);await p.waitForTimeout(500);
  const r=await p.evaluate(MIN=>{const o=[];
   const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(',').map(Number);return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}};
   const lum=c=>{const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b)};
   const bgOf=e=>{let c={r:0,g:0,b:0,a:0};const stack=[];for(let n=e;n;n=n.parentElement){const q=parse(getComputedStyle(n).backgroundColor);if(q&&q.a>0)stack.push(q);if(q&&q.a>=1)break}
     let base={r:255,g:255,b:255};for(const q of stack.reverse()){base={r:q.r*q.a+base.r*(1-q.a),g:q.g*q.a+base.g*(1-q.a),b:q.b*q.a+base.b*(1-q.a)}}return base};
   document.querySelectorAll('#app *, #nav *').forEach(e=>{
    const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());const bb=e.getBoundingClientRect();if(!bb.width||!bb.height)return;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)return;
    const lab=(e.className||e.tagName)+' 「'+e.innerText.trim().slice(0,14).replace(/\n/g,'/')+'」';
    if(own){const fg=parse(cs.color);const bg=bgOf(e);if(fg){const L1=lum(fg),L2=lum(bg),cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);if(cr<MIN)o.push('文字の色の差が小さい '+cr.toFixed(1)+' '+lab)}}
    else if(bb.width>40&&bb.height>20){const bg=bgOf(e);if(lum(bg)>0.75&&e.children.length)o.push('白いまま '+lab)}
   });return o},MIN);
  r.forEach(x=>out.push(v+' '+x));
 }
 console.log([...new Set(out)].join('\n')||'NO ERRORS');await b.close();process.exit(out.length?1:0)})();
