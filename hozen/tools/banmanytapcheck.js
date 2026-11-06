// 盤の点検：電気室に盤が 60 面あるとき、◯→● を押してから印が変わるまで 150ms 以内、390px で横にはみ出さず、
// 押した後に一覧の位置（スクロール）が飛ばない（棟→階→電気室→盤。保存の形は変えない。hz-v-ban-many-tap）
// usage: node hozen/tools/banmanytapcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[],errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});
  S.locs=[mk('l1','A棟','建屋',''),mk('l2','1階','階','l1'),mk('l3','第1電気室','電気室','l2'),...Array.from({length:60},(_,i)=>mk('b'+(i+1),'盤-'+(i+1),'盤','l3'))];
  S.banChk={};save();go('ban')});await p.waitForTimeout(300);
 const n=await p.locator('[id^="ban-b"]').count();if(n!==60)bad.push('盤の行の数が '+n);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>390)bad.push('横にはみ出す '+sw);
 const times=[],jumps=[];
 for(const id of ['b5','b30','b58']){
  await p.evaluate(id=>document.getElementById('ban-'+id).scrollIntoView({block:'center'}),id);await p.waitForTimeout(100);
  for(const want of ['○','済']){
   const r=await p.evaluate(([id,want])=>{const y0=scrollY,top0=document.getElementById('ban-'+id).getBoundingClientRect().top;
    const btn=document.querySelector('#ban-'+id+' .bm');const t0=performance.now();btn.click();const t1=performance.now();
    const v=((S.banChk[TODAY.slice(0,7)]||{})[id]||[])[0];const btn2=document.querySelector('#ban-'+id+' .bm');
    return{ms:t1-t0,v,cls:btn2?btn2.className:'',dy:Math.abs(scrollY-y0),dtop:Math.abs(document.getElementById('ban-'+id).getBoundingClientRect().top-top0)}},[id,want]);
   times.push(r.ms);if(r.v!==want)bad.push(id+'：印が '+want+' にならない（'+r.v+'）');
   if(!r.cls.includes(want==='済'?'mk-d':'mk-o'))bad.push(id+'：ボタンの見た目が変わらない');
   if(r.dtop>2)jumps.push(id+' '+Math.round(r.dtop)+'px');
   await p.evaluate(()=>{const u=document.querySelector('#undobar');if(u)u.classList.remove('on')});await p.waitForTimeout(50)}}
 const mx=Math.max(...times);if(mx>150)bad.push('押してから印が変わるまで '+Math.round(mx)+'ms（150ms 超）');
 if(jumps.length)bad.push('押した後に一覧の位置が飛ぶ：'+jumps.join('・'));
 console.log('最大 '+Math.round(mx)+'ms');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
