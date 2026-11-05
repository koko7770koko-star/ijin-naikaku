// 文字「大」「特大」・360px：異常の記録（editIssue）と測定記録（editMeas）の入力窓を、設備つき・測定8行（MΩ・kV・℃・%・○×）で開き、
// 窓の中の横はみ出し・44px 未満のボタン・単位や札が言葉の途中で割れる所・下のボタンの重なりが無いことを確かめる（hz-l-modal-issue-meas）。
// usage: node hozen/tools/modalissmeasxlcheck.js   （外部への通信は止める。名前は「設備1」「職員1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const out=[];
 for(const [fsc,W] of [['xl',360],['l',360],['l',390]]){
 const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());p.on('pageerror',e=>out.push('pageerror '+e.message));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{S.equipment=S.equipment||[];S.equipment.push({id:'eq1',code:'E-0001',name:'設備1（非常用発電機）',kind:'発電機',importance:'A',status:'稼働',photos:[],docs:[],repairs:[],spec:{}});S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(400);
 const calls={issue:"editIssue(null,{equipId:'eq1'})",meas:"editMeas(null,{equipId:'eq1',type:'絶縁抵抗',name:'絶縁抵抗測定（高圧受電設備・年次）',rows:[['絶縁抵抗（高圧一次側）','MΩ'],['耐圧試験電圧','kV'],['負荷電流（R相）','A'],['巻線温度','℃'],['湿度','%'],['外観に異常なし','○×'],['接地抵抗','Ω'],['燃料残量','L']].map(([name,unit])=>({name,unit,v:'',min:'',max:''}))})"};
 for(const [k,call] of Object.entries(calls)){
 await p.evaluate(c=>{try{closeModal(true)}catch(e){};eval(c)},call);await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const o=[];const DW=document.documentElement.clientWidth;const m=document.querySelector('#modal');if(!m)return ['窓が開かない'];
  if(document.documentElement.scrollWidth>DW+1)o.push('ページ横はみ出し');
  if(m.scrollWidth>m.clientWidth+1)o.push('窓が横に動く '+m.scrollWidth+'>'+m.clientWidth);
  m.querySelectorAll('*').forEach(e=>{const bb=e.getBoundingClientRect();if(!bb.width)return;const cs=getComputedStyle(e);
   if(bb.right>DW+1)o.push('右にはみ出し '+(e.className||e.tagName)+' 「'+(e.innerText||e.value||'').slice(0,16).replace(/\n/g,'/')+'」');
   if((e.tagName==='BUTTON')&&bb.height<44&&cs.display!=='none')o.push('44px未満 BUTTON.'+e.className+' 「'+e.innerText.slice(0,14).replace(/\n/g,'/')+'」 '+Math.round(bb.height));
   if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+1)o.push('ボタンの中身はみ出し 「'+e.innerText.slice(0,14)+'」');
   if(e.matches('.pill')&&e.getBoundingClientRect().height>parseFloat(cs.fontSize)*3)o.push('札が割れる 「'+e.innerText+'」');
  });
  // 単位（MΩ・kV・A・℃・%）が1文字ずつ割れない
  m.querySelectorAll('.unit,.u,span').forEach(e=>{const t=(e.innerText||'').trim();if(/^(MΩ|kV|kΩ|mA|℃|%|Ω|L|A)$/.test(t)&&e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).fontSize)*2.2)o.push('単位が割れる 「'+t+'」')});
  // 下のボタンどうしが重ならない
  const bs=[...m.querySelectorAll('button')].filter(x=>x.offsetParent&&x.closest('.mfoot,.modal-foot,.foot')).map(x=>x.getBoundingClientRect());
  for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i],c=bs[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)o.push('下のボタンが重なる')}
  return o});
 r.forEach(x=>out.push(fsc+W+' '+k+' '+x));
 }
 await ctx.close()}
 console.log([...new Set(out)].join('\n')||'NO ERRORS');await b.close();process.exit(out.length?1:0)})();
