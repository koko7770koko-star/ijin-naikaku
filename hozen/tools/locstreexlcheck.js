// 文字「大」「特大」・360px／390px：設備の場所（locs）を 棟3・階2・電気室2・盤2 の深い木で全部ひらき、盤の名前「▾ 動力盤-1」が「動力／盤-1」と言葉の途中で割れない・
// ページが横にはみ出さない・ボタンが 44px 以上であることを確かめる（hz-l-locs-tree）。名前は「動力盤-1」の形だけ。
// usage: node hozen/tools/locstreexlcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const out=[];
 for(const [fsc,W] of [['xl',360],['l',390],['l',360]]){
 const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();p.on('dialog',d=>d.dismiss());p.on('pageerror',e=>out.push('pageerror '+e.message));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const T=TODAY;
  S.locs=[];['A棟','B棟','C棟'].forEach((bn,bi)=>{S.locs.push({id:'b'+bi,name:bn,type:'建屋'});for(let f=1;f<=2;f++){const fid='f'+bi+f;S.locs.push({id:fid,name:f+'階',type:'階',parent:'b'+bi});for(let r=1;r<=2;r++){const rid='r'+bi+f+r;S.locs.push({id:rid,name:(bi===0&&f===1&&r===1)?'第1電気室（高圧受電・変圧器室）':'第'+r+'電気室',type:'電気室',parent:fid});for(let k=1;k<=2;k++)S.locs.push({id:'p'+bi+f+r+k,name:'動力盤-'+k,type:'盤',parent:rid})}}});
  S.equipment=[...Array(10)].map((_,i)=>({id:'q'+i,code:'E-'+(1000+i),name:'設備'+(i+1),kind:i<3?'発電機':'分電盤',importance:'A',locId:'p011'+(1+i%2),place:'',status:'稼働',photos:[],docs:[],repairs:[],health:[]}));
  S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);await p.waitForTimeout(500);
 for(const tb of ['locs']){
 await p.evaluate(tb=>{try{closeModal(true)}catch(e){};go('locs');locFold(true);try{Object.keys(V).forEach(k=>{});}catch(e){}},tb);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const o=[];const DW=document.documentElement.clientWidth;
  if(document.documentElement.scrollWidth>DW+1)o.push('ページ横はみ出し '+document.documentElement.scrollWidth+'>'+DW);
  document.querySelectorAll('#app *').forEach(e=>{const bb=e.getBoundingClientRect();if(!bb.width||e.closest('[hidden]'))return;const cs=getComputedStyle(e);
   if(bb.right>DW+1&&!e.closest('.tblwrap'))o.push('右にはみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」 '+Math.round(bb.right));
   if((e.tagName==='BUTTON'||e.tagName==='SELECT'||e.tagName==='SUMMARY')&&bb.height<44&&cs.display!=='none'&&!e.closest('nav'))o.push('44px未満 '+e.tagName+'.'+e.className+' 「'+e.innerText.slice(0,16).replace(/\n/g,'/')+'」 '+Math.round(bb.height));
   if(e.scrollWidth>e.clientWidth+1&&!e.classList.contains('locn')&&!e.querySelector(':scope>.item')&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&cs.display!=='inline')o.push('中身はみ出し '+(e.className||e.tagName)+' 「'+e.innerText.slice(0,20).replace(/\n/g,'/')+'」');
  });
  document.querySelectorAll('#app .pill').forEach(e=>{if(e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).fontSize)*2.4)o.push('札が割れる 「'+e.innerText+'」')});
  // 短い名前（8文字まで）の段は名前が1行に収まる
  document.querySelectorAll('#app .locn>.item>.bd>.ti').forEach(t=>{const nm=t.innerText.replace(/^[▾▸]\s*/,'');if(nm.length>8)return;const fs=parseFloat(getComputedStyle(t).fontSize);if(t.getBoundingClientRect().height>fs*2)o.push('場所の名前が割れる 「'+t.innerText+'」')});
  return o});
 r.forEach(x=>out.push(fsc+W+' '+tb+' '+x));
 }
 await ctx.close()}
 console.log([...new Set(out)].join('\n')||'NO ERRORS');await b.close();process.exit(out.length?1:0)})();
