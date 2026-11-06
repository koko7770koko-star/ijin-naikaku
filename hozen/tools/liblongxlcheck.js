// 技術資料（lib）：文字「特大」「大」・360px と 390px で、題名 60 字・タグ 10 個・長い英数字のファイル名の資料が
// 一覧・検索の結果・詳細（編集）の窓で、横にはみ出さない・ボタンが 44px 以上で画面の中・文字が切れない（hz-v-lib-long-name）
// usage: node hozen/tools/liblongxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'xl']]){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  const tag=w+'px・'+({xl:'特大',l:'大'})[fs]+'・';
  const look=sel=>p.evaluate(sel=>{const o=[],root=document.querySelector(sel);if(!root)return ['見る所が無い '+sel];
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
   root.querySelectorAll('*').forEach(e=>{if(!e.offsetParent||e.tagName==='TEXTAREA'||e.tagName==='INPUT'||e.tagName==='SELECT')return;const q=e.getBoundingClientRect();if(!q.width)return;
    if(q.right>innerWidth+1)o.push('画面の右から出る <'+e.tagName.toLowerCase()+'> 「'+(e.textContent||'').trim().slice(0,14)+'」');
    const cs=getComputedStyle(e);if(e.scrollWidth>e.clientWidth+1&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&cs.textOverflow!=='ellipsis'&&e.children.length===0)o.push('文字が箱からはみ出す 「'+(e.textContent||'').trim().slice(0,14)+'」')});
   root.querySelectorAll('button').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(q.height&&q.height<43.5)o.push('44px 未満のボタン '+Math.round(q.height)+'px 「'+e.textContent.trim().slice(0,12)+'」')});
   return [...new Set(o)]},sel);
  await p.evaluate(f=>{const T='高圧受電設備 真空遮断器（VCB）取扱説明書・保守点検要領・部品交換の目安 第3版（メーカー提出資料）'.slice(0,60);
   S.library=[...Array(8)].map((_,i)=>({id:'l'+i,title:i%2?T:'VCB_TORISETSU_ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789_'+i+'.pdf',tags:[...Array(10)].map((_,k)=>'タグ'+k+'_ABCDEFG').join(' '),text:'開閉回数の目安 VCB 仕様',file:i%3?'':'f'+i,type:'application/pdf',equipIds:[]}));
   S.settings.fscale=f;save();applyFScale();V.libQ='';go('lib')},fs);await p.waitForTimeout(100);
  (await look('#app')).forEach(x=>errs.push(tag+'一覧・'+x));
  await p.evaluate(()=>{V.libQ='VCB';go('lib')});await p.waitForTimeout(100);
  (await look('#app')).forEach(x=>errs.push(tag+'検索の結果・'+x));
  for(const id of ['l0','l1']){await p.evaluate(id=>{closeModal&&closeModal(true);editLib(id)},id);await p.waitForTimeout(150);
   if(!await p.evaluate(()=>document.querySelector('#mask').classList.contains('on')&&document.querySelector('#lb_title')))errs.push(tag+'窓（'+id+'）が開かない');
   (await look('#modal')).forEach(x=>errs.push(tag+'窓（'+id+'）・'+x))}
  await c.close()}
 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
