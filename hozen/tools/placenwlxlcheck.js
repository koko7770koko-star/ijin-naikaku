// 文字「大」「特大」・360px：場所「A棟 › 1階 › 第1電気室 › 動力盤-1」を出すほかの画面（設備台帳の一覧・設備の詳細・月の予定と工事・工事の一覧・
// ホーム・人員・診断・場所の設備の窓）で、段の途中（「動力／盤-1」「第1／電気室」）で割れないことを確かめる（hz-place-nwl-others）。
// 標準の文字では見える文字が変わらない（「発電機・A棟 › 1階 › 第1電気室 › 動力盤-1」のまま）こと、ページが横にはみ出さないことも見る。
// 報告書・日報の表（印刷の形）は対象外。名前は「動力盤-1」「変圧器1」の形だけ。
// usage: node hozen/tools/placenwlxlcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['',390],['xl',360],['l',360]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{const T=TODAY,PL='A棟 › 1階 › 第1電気室 › 動力盤-1';
   S.locs=[{id:'L1',type:'建屋',name:'A棟',parent:''},{id:'L2',type:'階',name:'1階',parent:'L1'},{id:'L3',type:'電気室',name:'第1電気室',parent:'L2'},{id:'L4',type:'盤',name:'動力盤-1',parent:'L3'}];
   S.equipment=[{id:'e1',code:'E-1',name:'変圧器1',place:PL,locId:'L4',kind:'発電機',status:'稼働',repairs:[]},{id:'e2',code:'E-2',name:'分電盤2',place:PL,locId:'L4',kind:'',status:'稼働',repairs:[]}];
   S.issues=[];
   S.works=[{id:'w1',no:'1',title:'工事1',date:T,endDate:T,place:PL,status:'予定',kind:'',equipIds:['e1'],staff:[],vendor:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],docs:[],hist:[],approvals:[],quals:[],pre:[],post:[],photos:[]}];
   S.tasks=(S.tasks||[]).filter(t=>t.id!=='t1');S.tasks.push({id:'t1',title:'点検1',date:T,place:PL,status:'予定',equipId:'e1'});
   S.settings.fscale=fs;save();applyFScale();
   const words=['動力盤-1','第1電気室'],o=[];
   const scan=(tag,root)=>{if(!root||!fs)return; // 割れの確かめは「大」「特大」だけ（標準は文字が変わらないことだけ見る）
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){
     const el=n.parentElement;if(!el||el.closest('input,textarea,select,option,script,style'))continue;
     for(const w of words){let i=n.data.indexOf(w);while(i>=0){const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+w.length);
      const tops=new Set([...rg.getClientRects()].filter(x=>x.width>0).map(x=>Math.round(x.top)));
      if(tops.size>1)o.push(tag+'：「'+w+'」が段の途中で割れる（'+el.tagName.toLowerCase()+'.'+el.className+'）');
      i=n.data.indexOf(w,i+1)}}}
    if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)o.push(tag+'：ページが横にはみ出す')};
   const view=(v,opt)=>{try{closeModal(true)}catch(e){}go(v,opt||{});scan(v,document.querySelector('#app'))};
   ['home','equip','month','works','staff','diag'].forEach(v=>view(v));
   view('equipDetail',{eq:'e1',eqTab:'ov'});
   go('home');locEquip('L4');scan('場所の設備の窓',document.querySelector('#modal'));closeModal(true);
   // 標準の文字：見える文字は前と同じ
   const txt=[];if(!fs){V.eqQ='';V.eqLoc='';V.eqKind='';go('equip');document.querySelectorAll('#app .item .meta').forEach(m=>txt.push(m.innerText.trim()))}
   return {o:[...new Set(o)],txt}},fs);
  r.o.forEach(x=>errs.push((fs||'標準')+W+' '+x));
  if(!fs&&!r.txt.includes('発電機・A棟 › 1階 › 第1電気室 › 動力盤-1'))errs.push('標準の設備台帳の場所の文字が変わった：'+r.txt.join(' | '));
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
