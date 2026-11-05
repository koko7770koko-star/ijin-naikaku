// 文字「大」「特大」・360px：人員・資格の一覧で「（〜日付）」「期限切れ」が言葉の途中で割れず、資格の窓の有効期限の欄で資格名が細い列に押し込まれない（hz-l-staff-qual）
// usage: node hozen/tools/staffqualxlcheck.js   （外部への通信は止める。名前は「職員1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fsc of ['xl','l']){const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const Q=['第三種電気主任技術者','第一種電気工事士','第二種電気工事士','高圧電気取扱者特別教育修了','消防設備士 甲種4類'];S.quals={};S.qualExp={};
  for(let i=1;i<=8;i++){const n='職員'+i;S.quals[n]=Q.slice(0,3+(i%3));S.qualExp[n]={};S.quals[n].forEach((q,k)=>{S.qualExp[n][q]=addD(TODAY,k===0?-5:k===1?20:400)})}
  S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForTimeout(1200);await p.evaluate(()=>{try{closeModal(true)}catch(e){};go('staff')});await p.waitForTimeout(300);
 const m=await p.evaluate(()=>{const o=[];document.querySelectorAll('#app .item').forEach(it=>{const bb=it.getBoundingClientRect();it.querySelectorAll('*').forEach(x=>{const r=x.getBoundingClientRect();if(r.width&&r.right>bb.right+1)o.push('外へ '+x.className+' '+x.innerText.slice(0,20))})});
   document.querySelectorAll('#app .item small,#app .item .pill').forEach(x=>{if(x.getClientRects().length>1&&/〜|あと|期限/.test(x.innerText))o.push('割れ「'+x.innerText+'」')});
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('横はみ出し');return o});
 await p.evaluate(()=>editQual('職員1'));await p.waitForTimeout(500);
 const m2=await p.evaluate(()=>{const o=[];const md=document.querySelector('#modal');if(!md)return['窓なし'];const mb=md.getBoundingClientRect();md.querySelectorAll('input,select,button,label').forEach(x=>{const r=x.getBoundingClientRect();if(r.width&&(r.right>innerWidth+1))o.push('窓の外 '+x.tagName+' '+(x.innerText||x.value||'').slice(0,16))});
  md.querySelectorAll('.qlx').forEach(x=>{if(getComputedStyle(x).display==='none')return;const s=x.querySelector('span'),r=x.getBoundingClientRect();if(s&&s.getBoundingClientRect().width<r.width*0.6)o.push('有効期限の欄の資格名が細い列（'+Math.round(s.getBoundingClientRect().width)+'px）：'+s.innerText)});if(!md.querySelector('.qlx'))o.push('有効期限の欄が無い');return o});
 [...errs,...new Set(m),...new Set(m2)].forEach(x=>bad.push(fsc+'・360px：'+x));await ctx.close()}
 console.log(bad.slice(0,20).join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
