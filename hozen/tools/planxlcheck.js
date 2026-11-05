// 文字「大」「特大」・390/360px：年間計画（plan）の3つのタブ（点検期限・更新計画・測定の周期）を、期限超過・長い名前・大きな金額つきで開き、
// 横はみ出し・44px 未満のボタン・札（pill）の割れ・日付や金額が言葉の途中で割れる所が無いことを確かめる（hz-l-works-plan）。
// usage: node hozen/tools/planxlcheck.js   （外部への通信は止める。名前は「設備1」「点検1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const out=[];
 for(const [fsc,W] of [['l',390],['xl',360],['l',360]]){
 const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());p.on('pageerror',e=>out.push('pageerror '+e.message));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const T=TODAY;
  S.items=[];['法定','社内','自主',''].forEach((lg,k)=>{for(let i=1;i<=3;i++)S.items.push({id:'i'+k+i,name:'点検'+k+i+'：高圧受電設備の年次精密点検（停電あり）',cat:'電気',cycle:'年1回',who:'自主',legal:lg,base:addD(T,i===1?-45:i===2?12:200),track:true,note:''})});
  S.marks={};DL_CACHE=null;
  S.equipment=S.equipment||[];for(let i=1;i<=4;i++)S.equipment.push({id:'eq'+i,code:'E-000'+i,name:'設備'+i+'（非常用発電機）',kind:'発電機',importance:'A',status:'稼働',installed:'2000-04',life:20,renewYear:fyNow()+(i-2),renewCost:123456789+i,photos:[],docs:[],repairs:[],spec:{}});
  S.plans=S.plans||[];for(let i=1;i<=4;i++)S.plans.push({id:'pl'+i,title:'計画'+i+'：受変電設備の更新工事（実施設計を含む）',year:fyNow()+i,kind:'更新',equipId:i%2?'eq'+i:'',cost:98765432,status:['計画','予算化','実施済み','見送り'][i-1],note:''});
  S.plans.push({id:'pl9',title:'計画9：年度未定の改修',year:'',kind:'改修',equipId:'',cost:'',status:'計画',note:''});
  S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(500);
 for(const tb of ['legal','renew','measdue']){
 await p.evaluate(tb=>{try{closeModal(true)}catch(e){};go('plan',{plTab:tb})},tb);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const o=[];const DW=document.documentElement.clientWidth;const fs=parseFloat(getComputedStyle(document.body).fontSize);
  if(document.documentElement.scrollWidth>DW+1)o.push('ページ横はみ出し '+document.documentElement.scrollWidth+'>'+DW);
  document.querySelectorAll('#app *').forEach(e=>{const bb=e.getBoundingClientRect();if(!bb.width)return;const cs=getComputedStyle(e);
   if(bb.right>DW+1&&!e.closest('.tblwrap'))o.push('右にはみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」');
   if((e.tagName==='BUTTON'||e.tagName==='SUMMARY')&&!e.closest('.noprint-hide')&&bb.height<44&&cs.display!=='none')o.push('44px未満 '+e.tagName+'.'+e.className+' 「'+e.innerText.slice(0,16).replace(/\n/g,'/')+'」 '+Math.round(bb.height));
   if(e.scrollWidth>e.clientWidth+1&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&cs.display!=='inline')o.push('中身はみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」');
  });
  // 札の割れ（期限・状態など。1行のはず）と、先頭の札の「あと12日」「45日超過」が途中で割れない
  document.querySelectorAll('#app .pill').forEach(e=>{if(e.getClientRects().length>1||e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).fontSize)*3)o.push('札が割れる 「'+e.innerText+'」')});
  document.querySelectorAll('#app .item .dt').forEach(e=>{if(e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).fontSize)*3)o.push('期限の札の列が高い 「'+e.innerText+'」')});
  // 「前回 日付」「期限 日付」は日付だけが次の行に離れない
  document.querySelectorAll('#app .item .meta').forEach(m=>{if(/(前回|期限)\s*[\d\/－]/.test(m.innerText)&&!m.querySelector('.nwl'))o.push('前回・期限が1まとまりでない 「'+m.innerText.slice(0,24)+'」');m.querySelectorAll('.nwl').forEach(n=>{if(n.getClientRects().length>1||n.getBoundingClientRect().height>parseFloat(getComputedStyle(n).fontSize)*2.2)o.push('言葉の途中で割れる 「'+n.innerText+'」')})});
  return o});
 r.forEach(x=>out.push(fsc+W+' '+tb+' '+x));
 }
 await ctx.close()}
 console.log([...new Set(out)].join('\n')||'NO ERRORS');await b.close();process.exit(out.length?1:0)})();
