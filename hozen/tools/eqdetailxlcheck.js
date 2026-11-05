// 文字「大」「特大」・360px：設備の詳しい画面（equipDetail）の4つのタブを、修理履歴8件・測定6回・資料4件・不具合3件・盤の場所つきの設備で開き、
// 横はみ出し・ボタンの中身のはみ出し・44px 未満のボタンと開閉・札（測定の判定など）や場所の道すじが言葉の途中で割れる所が無いことを確かめる（hz-l-equip-detail）。
// usage: node hozen/tools/eqdetailxlcheck.js   （外部への通信は止める。名前は「設備1」「職員1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const out=[];
 for(const [fsc,W] of [['xl',360],['l',360]]){
 const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());p.on('pageerror',e=>out.push('pageerror '+e.message));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const T=TODAY;
  S.locs=S.locs||[];S.locs.push({id:'lb',name:'A棟',type:'棟'},{id:'lf',name:'1階',type:'階',parent:'lb'},{id:'lr',name:'第1電気室',type:'電気室',parent:'lf'},{id:'lp1',name:'動力盤-1',type:'盤',parent:'lr'});
  const reps=[];for(let i=1;i<=8;i++)reps.push({id:'rp'+i,date:addD(T,-i*40),kind:i%2?'故障':'修理',content:'修理内容'+i+'（部品交換・調整）',vendor:'業者'+i,cost:120000*i,photos:[],downH:i});
  S.equipment=S.equipment||[];S.equipment.push({id:'eq1',code:'E-0001-GEN',name:'設備1',kind:'発電機',importance:'A',status:'稼働',locId:'lp1',place:'A棟 1階 第1電気室',maker:'メーカー1',model:'XYZ-1234567890ABCDEFG',serial:'SN-0000123456789',installed:'2005-04',cycle:'月次・年次',life:20,renewYear:2027,renewCost:12345678,photos:[],docs:[{name:'取扱説明書_非常用発電機_第1号機.pdf',type:'application/pdf',id:'d1'},{name:'点検成績書2024.pdf',type:'application/pdf',id:'d2'},{name:'単線結線図.pdf',type:'application/pdf',id:'d3'},{name:'保守契約書.pdf',type:'application/pdf',id:'d4'}],repairs:reps,health:[{at:'',date:addD(T,-10),score:3,by:'職員1',note:'外観に軽い錆'}],spec:{'定格出力':'500kVA','定格電圧':'6600V','燃料消費量（L/h）':'120','燃料タンク容量':'1950L'},run:{mode:'meter',meters:[{date:addD(T,-30),value:1234}]}});
  S.meas=S.meas||[];for(let i=1;i<=6;i++)S.meas.push({id:'ms'+i,at:'',date:addD(T,-i*30),equipId:'eq1',type:'絶縁抵抗',name:'絶縁抵抗測定'+i,rows:[{name:'絶縁抵抗（高圧）',unit:'MΩ',min:100,max:'',v:2000+i},{name:'燃料残量',unit:'L',v:1500}],cond:{},by:'職員1',note:'',photos:[]});
  for(let i=1;i<=3;i++)S.issues.push({id:'is'+i,date:addD(T,-i),title:'不具合'+i+'：排気管からの油にじみ',status:'発見',photos:[],log:[],urgency:'緊急',due:addD(T,-1),equipId:'eq1',place:'A棟 1階 第1電気室'});
  S.library=S.library||[];for(let i=1;i<=4;i++)S.library.push({id:'lib'+i,title:'技術資料'+i+'：保守要領書（第'+i+'版）',tags:'発電機・保守',equipIds:['eq1']});
  S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(500);
 for(const tb of ['ov','rec','insp','rel']){
 await p.evaluate(tb=>{try{closeModal(true)}catch(e){};go('equipDetail',{eq:'eq1',eqTab:tb})},tb);await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const o=[];const DW=document.documentElement.clientWidth;
  if(document.documentElement.scrollWidth>DW+1)o.push('ページ横はみ出し '+document.documentElement.scrollWidth+'>'+DW);
  document.querySelectorAll('#app *').forEach(e=>{const bb=e.getBoundingClientRect();if(!bb.width)return;const cs=getComputedStyle(e);
   if(bb.right>DW+1&&!e.closest('.tblwrap'))o.push('右にはみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」 '+Math.round(bb.right));
   if((e.tagName==='BUTTON'||e.tagName==='A'||e.tagName==='SUMMARY')&&!e.closest('.noprint-hide')&&bb.height<44&&cs.display!=='none')o.push('44px未満 '+e.tagName+'.'+e.className+' 「'+e.innerText.slice(0,16).replace(/\n/g,'/')+'」 '+Math.round(bb.height));
   if(e.scrollWidth>e.clientWidth+1&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&cs.display!=='inline')o.push('中身はみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」');
  });
  // 札（pill）の割れ
  document.querySelectorAll('#app .pill').forEach(e=>{const rs=e.getClientRects();if(rs.length>1)o.push('札が割れる 「'+e.innerText+'」')});
  // 測定の判定の札：「基準未設定」などの言葉の途中で割れない（・の区切りでだけ折り返す）
  document.querySelectorAll('#app .pill').forEach(e=>{if(/・/.test(e.innerText)&&!e.querySelector('.nwl'))o.push('札の中の区切りが無い 「'+e.innerText+'」')});
  document.querySelectorAll('#app .pill .nwl,#app a .nwl').forEach(e=>{if(e.getClientRects().length>1||e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).fontSize)*2.2)o.push('言葉の途中で割れる 「'+e.innerText+'」')});
  // 場所の道すじ（A棟 › 1階 › 第1電気室 › 動力盤-1）は段ごとに割れない
  document.querySelectorAll('#app a').forEach(a=>{if(/›/.test(a.innerText)&&!a.querySelector('.nwl'))o.push('場所の道すじに区切りが無い 「'+a.innerText+'」')});
  return o});
 r.forEach(x=>out.push(fsc+W+' '+tb+' '+x));
 }
 await ctx.close()}
 console.log([...new Set(out)].join('\n')||'NO ERRORS');await b.close();process.exit(out.length?1:0)})();
