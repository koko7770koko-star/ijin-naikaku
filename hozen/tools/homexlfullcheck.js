// 文字「大」（390px）・「特大」（360px）で、記録が多いときのホーム（hz-xl-home-full）：
// ①今日の点検の数（日常点検・盤・発電機）の「済み n／全部 m」がボタンからはみ出さず、隣と重ならない
// ②札（全体の状況）の小さい説明が言葉の途中で割れない（「対／応期限超過」にならない）
// ③「ほか n件を表示」などの文字のボタンが 44px 以上　④横にはみ出さない・エラーなし
// usage: node hozen/tools/homexlfullcheck.js   （外部への通信は止める。名前は「設備1」の形だけ）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const [fsc,W] of [['xl',360],['l',390],['xl',390],['l',360]]){
  const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof MIRROR_READY!=='undefined'&&MIRROR_READY,null,{timeout:15000});await p.waitForTimeout(300);
  await p.evaluate(fsc=>{const T=TODAY;
   S.equipment=S.equipment||[];for(let i=1;i<=20;i++)S.equipment.push({id:'eq'+i,code:'E-'+i,name:'設備'+i,kind:i<=3?'発電機':'変圧器',place:'',status:'',photos:[],docs:[],repairs:[]});
   const U=['緊急','高','中','低'];for(let i=1;i<=10;i++)S.issues.push({id:'is'+i,date:addD(T,-i),title:'不具合'+i,place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[],urgency:U[i%4],due:i<5?addD(T,-2):''});
   for(let i=1;i<=5;i++)S.tasks.push({id:'tk'+i,date:T,time:'',kind:'月次',cat:'受変電',title:'月次点検'+i,place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]});
   S.works=S.works||[];for(let i=1;i<=3;i++)S.works.push({id:'wk'+i,title:'作業'+i,date:T,status:'承認待ち',staff:['職員1'],outage:''});
   S.locs=S.locs||[];S.locs.push({id:'lb',name:'A棟',type:'棟'},{id:'lf',name:'1階',type:'階',parent:'lb'},{id:'lr',name:'第1電気室',type:'電気室',parent:'lf'});for(let i=1;i<=12;i++)S.locs.push({id:'lp'+i,name:'盤'+i,type:'盤',parent:'lr'});
   S.settings.fscale=fsc;save()},fsc);
  await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(600);
  await p.evaluate(()=>{try{closeModal(true)}catch(e){};go('home')});await p.waitForTimeout(300);
  const tag=`${fsc==='xl'?'特大':'大'}・${W}px`;
  const r=await p.evaluate(()=>{const o=[];
   const hc=[...document.querySelectorAll('.homecount .btn')];if(hc.length<3)o.push('今日の点検の数のボタンが '+hc.length+' 個');
   hc.forEach((e,i)=>{const bb=e.getBoundingClientRect();if(e.scrollWidth>e.clientWidth+1)o.push('数のボタン '+(i+1)+' の中身がはみ出す（'+e.scrollWidth+'>'+e.clientWidth+'）');
    e.querySelectorAll('b,small').forEach(x=>{const xb=x.getBoundingClientRect();if(xb.left<bb.left-1||xb.right>bb.right+1)o.push('数のボタン '+(i+1)+' の「'+x.innerText.replace(/\n/g,'')+'」がボタンの外に出る')})});
   document.querySelectorAll('.tile .ts').forEach(e=>{const t=e.innerText;if(/対\n応|承\n認|健\n全|要\n注意/.test(t))return o.push('札の説明が言葉の途中で割れる：'+t.replace(/\n/g,'⏎'));
    e.querySelectorAll('.tsn').forEach(x=>{const lh=parseFloat(getComputedStyle(x).fontSize)*1.7;if(x.getBoundingClientRect().height>lh&&x.getBoundingClientRect().width<e.clientWidth-2)o.push('札の説明が割れる：'+x.innerText)})});
   if(!document.querySelector('.tile .ts .tsn'))o.push('札の説明の区切り（.tsn）が無い');
   document.querySelectorAll('#app .linkbtn').forEach(e=>{const h=e.getBoundingClientRect().height;if(h&&h<44)o.push('文字のボタン「'+e.innerText.slice(0,14)+'」が '+Math.round(h)+'px')});
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('横にはみ出す '+document.documentElement.scrollWidth);
   return o});
  r.concat(errs).forEach(x=>bad.push(tag+'：'+x));await ctx.close();
 }
 // 標準の文字では「済み n／全部 m」は1行のまま（見た目を変えない）
 {const ctx=await b.newContext({viewport:{width:390,height:780}});const p=await ctx.newPage();await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof MIRROR_READY!=='undefined'&&MIRROR_READY,null,{timeout:15000});
  const one=await p.evaluate(()=>{S.settings.fscale='';S.equipment=(S.equipment||[]).concat([{id:'g1',name:'設備1',kind:'発電機'}]);go('home');const x=document.querySelector('.homecount b');if(!x)return true;return x.getBoundingClientRect().height<parseFloat(getComputedStyle(x).fontSize)*1.8});
  if(!one)bad.push('標準・390px：「済み n／全部 m」が2行になった（標準の見た目は変えない）');await ctx.close()}
 console.log([...new Set(bad)].slice(0,20).join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
