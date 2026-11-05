// 月報・年報の画面：文字「大」「特大」・360px で、上の操作（月の前後・印刷・共有・切り替え）が44px以上で中身がはみ出さず、
// 画面の上のまとめ（要約の札）が言葉の途中で割れず、ページが横にはみ出さないことを、点検30件・不具合6件・発電機3台の月で確かめる。hz-l-report-month
// usage: node hozen/tools/reportmonthxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
 const c=await b.newContext({viewport:{width:360,height:800}});const p=await c.newPage();const tag='360px・'+({xl:'特大',l:'大'})[fs];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();const y=now.getFullYear(),m=now.getMonth()+1,pm=y+'-'+String(m).padStart(2,'0')+'-';
  S.items=[...Array(30)].map((_,i)=>({id:'it'+i,name:'設備'+(i+1)+'の点検（受変電設備）',cat:['受変電','発電機','空調','消防'][i%4],cycle:'毎月',base:y+'-01-10',who:i%2?'委託':'自主'}));
  S.tasks=[...Array(30)].map((_,i)=>({id:'t'+i,date:pm+String(1+i%27).padStart(2,'0'),time:'',kind:'月次',cat:'',title:'設備'+(i+1)+'の点検（受変電設備）',place:'',staff:'職員1',attend:'',status:i%5?'完了':'予定',result:i%7?'良':'不良',note:'',photos:[]}));
  S.issues=[...Array(6)].map((_,i)=>({id:'is'+i,date:pm+String(2+i).padStart(2,'0'),title:'異常の試し'+i+'（設備'+i+'の発熱）',place:'A棟 1F',status:i%3?'完了':'対応中',action:'増し締め',closed:'',detail:''}));
  V.ry=y;V.rm=m;V.rfy=m>=4?y:y-1},fs);
 for(const [name,mode] of [['月報','m'],['年報','y']]){
  await p.evaluate(md=>{V.rmode=md;go('report')},mode);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const o={page:document.documentElement.scrollWidth,btn:[],over:[],split:[]};
   for(const e of document.querySelectorAll('#app button,#app .btn,#app .tabs button,#app .seg button')){const q=e.getBoundingClientRect();if(!q.width||getComputedStyle(e).display==='none'||e.closest('.rep'))continue;
    const t=(e.textContent||'').trim().slice(0,10);if(q.height<43.5)o.btn.push(t+':'+Math.round(q.height));
    if(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)o.over.push(t)}
   for(const e of document.querySelectorAll('#app .noprint .pill,#app .noprint .tag,#app .noprint .badge,#app .noprint .tdl,#app .noprint .muted')){const q=e.getBoundingClientRect();if(!q.width)continue;const fsz=parseFloat(getComputedStyle(e).fontSize);
    if(e.children.length===0&&(e.textContent||'').trim().length<=12&&q.height>fsz*2.2)o.split.push((e.textContent||'').trim()+':'+Math.round(q.height))}
   return o});
  if(r.page>362)errs.push(tag+'・'+name+'：横にはみ出す '+r.page);
  if(r.btn.length)errs.push(tag+'・'+name+'：44px未満のボタン '+r.btn.join(' '));
  if(r.over.length)errs.push(tag+'・'+name+'：ボタンの中身がはみ出す '+r.over.join(' '));
  if(r.split.length)errs.push(tag+'・'+name+'：短い言葉が割れる '+r.split.join(' '));
  if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+'/rep-'+fs+'-'+mode+'.png',fullPage:false})}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
