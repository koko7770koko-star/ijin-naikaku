// 文字「大」「特大」・360px／390px：診断（diag）の健全度・推奨・故障分析・測定記録のタブを、設備10台（発電機3・変圧器3）・測定 1台6回（kV・A・℃・%・MΩ）・推奨の ng/warn ありで開き、
// 横はみ出し・44px 未満のボタン・札の割れ、測定の値「負荷電流 120.5A」や「人の評価 未」が言葉の途中で割れない・行が「・」から始まらないことを確かめる（hz-l-diag-tabs）。
// usage: node hozen/tools/diagtabxlcheck.js   （外部への通信は止める。名前は「設備1」「職員1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const out=[];
 for(const [fsc,W] of [['xl',360],['l',390],['l',360]]){
 const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());p.on('pageerror',e=>out.push('pageerror '+e.message));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const T=TODAY;
  S.equipment=[...Array(10)].map((_,i)=>({id:'q'+i,code:'E-'+(1000+i),name:'設備'+(i+1),kind:i<3?'発電機':i<6?'変圧器':'分電盤',importance:'ABC'[i%3],place:'A棟 1階 第1電気室',status:'稼働',installed:i<4?'2001-04':'2018-04',life:15,photos:[],docs:[],repairs:i<3?[{id:'r'+i,date:addD(T,-40),kind:'故障',content:'故障'+i,downH:5,upAt:''}]:[],health:i%2?[{date:addD(T,-30),score:1+i%5,by:'職員1'}]:[]}));
  S.meas=[];S.equipment.forEach((e,k)=>{for(let j=0;j<6;j++)S.meas.push({id:'m'+k+'_'+j,at:nowIso(),date:addD(T,-j*30-k),type:MEAS_TYPES[0],name:'絶縁抵抗測定',equipId:e.id,tplId:'',rows:[{name:'絶縁抵抗（高圧）',v:j%3?2000:0.05,unit:'MΩ',min:100,max:'',src:''},{name:'変圧器温度',v:65+j,unit:'℃',min:'',max:70},{name:'負荷電流',v:120.5,unit:'A',min:'',max:''},{name:'電圧',v:6.6,unit:'kV',min:'',max:''},{name:'負荷率',v:85,unit:'%',min:'',max:80}],cond:{temp:'',hum:'',toolName:''},by:'職員1',note:''})});
  S.issues=[...Array(5)].map((_,i)=>({id:'qi'+i,date:addD(T,-i*20),title:'不具合'+i,place:'',detail:'',status:i<2?'発見':'完了',urgency:'緊急',due:addD(T,-1),action:'',closed:i<2?'':addD(T,-i*20+1),photos:[],equipId:'q'+(i%3),failure:true,log:[]}));
  S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(500);
 for(const tb of ['rec','meas','health','fail']){
 await p.evaluate(tb=>{try{closeModal(true)}catch(e){};go('diag',{dgTab:tb})},tb);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const o=[];const DW=document.documentElement.clientWidth;
  if(document.documentElement.scrollWidth>DW+1)o.push('ページ横はみ出し '+document.documentElement.scrollWidth+'>'+DW);
  document.querySelectorAll('#app *').forEach(e=>{const bb=e.getBoundingClientRect();if(!bb.width||e.closest('[hidden]'))return;const cs=getComputedStyle(e);
   if(bb.right>DW+1&&!e.closest('.tblwrap'))o.push('右にはみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」 '+Math.round(bb.right));
   if((e.tagName==='BUTTON'||e.tagName==='SELECT'||e.tagName==='SUMMARY')&&bb.height<44&&cs.display!=='none'&&!e.closest('nav'))o.push('44px未満 '+e.tagName+'.'+e.className+' 「'+e.innerText.slice(0,16).replace(/\n/g,'/')+'」 '+Math.round(bb.height));
   if(e.scrollWidth>e.clientWidth+1&&!e.querySelector(':scope>.item')&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&cs.display!=='inline')o.push('中身はみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」');
  });
  document.querySelectorAll('#app .pill').forEach(e=>{if(e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).fontSize)*2.4)o.push('札が割れる 「'+e.innerText+'」')});
  // 測定の値・健全度の下の行：区切りごとに .nwl でまとめ、行が「・」から始まらない
  document.querySelectorAll('#app .item .meta').forEach(m=>{if(!/・/.test(m.innerText))return;if(!m.querySelector('.nwl'))o.push('区切りのまとまりが無い 「'+m.innerText.slice(0,30)+'」');
   const w=document.createTreeWalker(m,NodeFilter.SHOW_TEXT);let n,prevTop=null;while(n=w.nextNode()){for(let i=0;i<n.textContent.length;i++){const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+1);const r=rg.getClientRects()[0];if(!r)continue;const t=Math.round(r.top);if(prevTop!=null&&t>prevTop+3&&n.textContent[i]==='・')o.push('行が「・」から始まる 「'+m.innerText.slice(0,30)+'」');prevTop=t}}});
  return o});
 r.forEach(x=>out.push(fsc+W+' '+tb+' '+x));
 }
 await ctx.close()}
 console.log([...new Set(out)].join('\n')||'NO ERRORS');await b.close();process.exit(out.length?1:0)})();
