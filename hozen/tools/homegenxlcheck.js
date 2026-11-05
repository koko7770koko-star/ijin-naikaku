// ホーム：文字「大」「特大」・360px・発電機5台（2台入力済み）・期限の近い点検6件・在庫不足2件で、札・数と「台」「件」が割れず、押せる所が44px以上で、横にはみ出さない（hz-l-home-gen）
// usage: node hozen/tools/homegenxlcheck.js   （外部への通信は止める。名前は「設備1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fsc of ['xl','l']){const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  await p.evaluate(fsc=>{const T=TODAY;S.equipment=[...Array(5)].map((_,i)=>({id:'g'+i,code:'G-'+(i+1),name:'非常用発電機'+(i+1),kind:'発電機',place:'',status:'',photos:[],docs:[],repairs:[]}));
   S.meas=[0,1].map(i=>({id:'m'+i,tplId:'mt_gen',equipId:'g'+i,date:T,by:'職員1',rows:{}}));
   S.tasks=[...Array(6)].map((_,i)=>({id:'tk'+i,date:addD(T,i%3),time:'',kind:'月次',cat:'受変電',title:'設備'+(i+1)+'の点検（受変電設備）',place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]}));
   S.parts=[0,1].map(i=>({id:'p'+i,code:'P-'+i,name:'端子台 M6 3極（予備品'+(i+1)+'）',spec:'',maker:'',place:'',unit:'個',qty:0,min:2,price:'',equipIds:[],note:''}));
   S.settings.fscale=fsc;save()},fsc);
  await p.reload();await p.waitForFunction(()=>typeof S==='object'&&document.querySelector('#app').children.length>0);await p.waitForTimeout(500);
  await p.evaluate(()=>{try{closeModal(true)}catch(e){};go('home')});await p.waitForTimeout(400);
  if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+'/home-'+fsc+'.png',fullPage:true});
  const m=await p.evaluate(()=>{const o=[],W=document.documentElement.clientWidth,app=document.querySelector('#app');
   if(document.documentElement.scrollWidth>W+1)o.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
   app.querySelectorAll('button,.btn,.alchip,.al,.linkbtn,[onclick]').forEach(x=>{const r=x.getBoundingClientRect();if(!r.width||getComputedStyle(x).display==='none'||x.closest('.noprint')===null&&false)return;
     const nm=(x.textContent||'').trim().slice(0,14);if(r.right>W+1||r.left<-1)o.push('はみ出す「'+nm+'」');
     if(x.matches('button,.btn,.alchip,.linkbtn')&&r.height<43.5)o.push('44px未満「'+nm+'」'+Math.round(r.height))});
   // 札・数と台/件が割れる：「n台」「n件」「n日」を含む短い文字が2行にまたがる
   const tw=document.createTreeWalker(app,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){const t=n.data;const re=/\d+(台|件|日|個|本|か月)/g;let mm;while(mm=re.exec(t)){const rg=document.createRange();rg.setStart(n,mm.index);rg.setEnd(n,mm.index+mm[0].length);const tops=new Set([...rg.getClientRects()].filter(q=>q.width>0).map(q=>Math.round(q.top)));if(tops.size>1)o.push('数と単位が割れる「'+mm[0]+'」')}}
   return o});
  [...new Set(m)].forEach(x=>bad.push((fsc==='xl'?'特大':'大')+'・360px：'+x));await ctx.close()}
 console.log(bad.slice(0,20).join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
