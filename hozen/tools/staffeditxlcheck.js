// 人員の資格の窓（editQual）：文字「大」「特大」・360px・全資格にチェックを入れて、資格名が言葉の途中で割れない（折れてよいのは空白の所）・窓が横にはみ出さない・ボタンが44px以上・日付欄が窓の外に出ない（hz-l-staff-edit）
// usage: node hozen/tools/staffeditxlcheck.js   （外部への通信は止める。名前は「職員1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fsc of ['xl','l','']){const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss());
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 await p.evaluate(fsc=>{const Q=['第三種電気主任技術者','第一種電気工事士','第二種電気工事士','高圧電気取扱者特別教育修了','消防設備士 甲種4類'];S.qualList=Q;S.quals={};S.qualExp={};
  for(let i=1;i<=8;i++){const n='職員'+i;S.quals[n]=Q.slice();S.qualExp[n]={};Q.forEach((q,k)=>{S.qualExp[n][q]=addD(TODAY,k===0?-5:k===1?20:400)})}
  S.settings.fscale=fsc;save()},fsc);
 await p.reload();await p.waitForTimeout(1200);await p.evaluate(()=>{try{closeModal(true)}catch(e){};go('staff');editQual('職員1')});await p.waitForTimeout(500);
 const m=await p.evaluate(fsc=>{const o=[],md=document.querySelector('#modal');if(!md)return['窓なし'];const W=document.documentElement.clientWidth;
  if(md.scrollWidth>md.clientWidth+1)o.push('窓が横にはみ出す');
  md.querySelectorAll('input,select,button').forEach(x=>{const r=x.getBoundingClientRect();if(!r.width)return;if(r.right>W+1||r.left<-1)o.push('はみ出す '+(x.getAttribute('aria-label')||x.textContent.trim().slice(0,8)));if(x.tagName==='BUTTON'&&r.height<44)o.push('ボタン44px未満 '+x.textContent.trim().slice(0,8)+' '+Math.round(r.height))});
  if(fsc)md.querySelectorAll('label.chkl,.qlx>span').forEach(x=>{const n=[...x.childNodes].filter(c=>c.nodeType===3)[0]||x.firstChild;if(!n||n.nodeType!==3)return;const t=n.textContent;let pt=null;for(let i=0;i<t.length;i++){if(!t[i].trim()){pt=null;continue}const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+1);const q=rg.getClientRects()[0];if(!q)continue;const top=Math.round(q.top);
    if(pt!==null&&top>pt+2&&t[i-1]!==' '&&!'（(・'.includes(t[i]))o.push('資格名が割れる「'+t.slice(0,i)+'/'+t.slice(i)+'」');pt=top}});
  return o},fsc);
 [...new Set(m)].forEach(x=>bad.push((fsc||'標準')+'・360px：'+x));await ctx.close()}
 console.log(bad.slice(0,20).join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
