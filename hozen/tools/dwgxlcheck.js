// 図面の一覧（dwgs）と図面1件（dwg）：文字「特大」「大」・360px で、図面 6 件（長い名前・場所・版 3 つ・設備の印）が
// ①ページが横にはみ出さない ②行の「種類・場所・版・設備の印」が段・語の途中で割れず、行が「・」から始まらない
// ③版の選びの文字が切れない ④ボタン・選びが 44px 以上（hz-l-dwg）
// usage: node hozen/tools/dwgxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  await p.evaluate(async([f,png])=>{S.settings.fscale=f;
   S.locs=[{id:'B0',name:'A棟',type:'建屋',parent:'',note:'',pos:{}},{id:'F0',name:'1階',type:'階',parent:'B0',note:'',pos:{}},{id:'R0',name:'第1電気室',type:'電気室',parent:'F0',note:'',pos:{}}];
   S.equipment=[0,1].map(i=>({id:'E'+i,code:'E-'+i,name:'設備'+(i+1),kind:'変圧器',locId:'R0',importance:'A',status:'稼働',place:'',photos:[],docs:[],repairs:[],health:[]}));
   const id=await putPhoto(png);
   S.drawings=[...Array(6)].map((_,i)=>({id:'d'+i,name:i===1?'受変電設備単線結線図ABCDEFGHIJ-1234567890-XYZ':'図面'+(i+1),kind:i%2?'単線結線図':'配置図',locId:i<3?'R0':'',
    vers:[1,2,3].map(k=>({id:'v'+i+k,ver:i===1?'改訂'+k:String(k),date:TODAY,note:k===3?'変更内容の例':'',by:'',file:id,type:'image/png'})),pins:i<4?[{id:'p'+i,equipId:'E0',label:'',x:.5,y:.5},{id:'q'+i,equipId:'E1',label:'',x:.2,y:.2}]:[]}));
   save();applyFScale();go('dwgs')},[fs,PNG]);
  const chk=()=>p.evaluate(()=>{const o=[];
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
   document.querySelectorAll('#app button, #app select').forEach(e=>{const q=e.getBoundingClientRect();if(!q.height)return;if(q.height<43.5)o.push('44px 未満 '+Math.round(q.height)+'px '+(e.textContent||'').slice(0,12));if(e.scrollWidth>e.clientWidth+1)o.push('文字が切れる '+(e.textContent||'').slice(0,12))});
   document.querySelectorAll('#app select').forEach(e=>{const sp=document.createElement('span');sp.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+getComputedStyle(e).font;sp.textContent=e.options[e.selectedIndex].text;document.body.appendChild(sp);const w=sp.getBoundingClientRect().width;sp.remove();if(w+34>e.getBoundingClientRect().width)o.push('選びの文字が切れる（文字 '+Math.round(w)+'px・箱 '+Math.round(e.getBoundingClientRect().width)+'px）')});
   document.querySelectorAll('#app .item .meta').forEach(m=>{if(m.textContent.includes('・')&&!m.querySelector('.nwl'))o.push('行が段・語ごとに包まれていない '+m.textContent.slice(0,25));
    const t=m.textContent;if(/^・/.test(t))o.push('行が「・」から始まる');
    m.querySelectorAll('.nwl').forEach(n=>{if(n.getBoundingClientRect().height>n.parentElement.getBoundingClientRect().height*0+ (parseFloat(getComputedStyle(n).lineHeight)||40)*1.6)o.push('割れる '+n.textContent)})});
   return [...new Set(o)]});
  (await chk()).forEach(x=>errs.push('360px・'+({xl:'特大',l:'大'})[fs]+'・一覧・'+x));
  await p.evaluate(()=>go('dwg',{dwg:'d1',dwgZ:1}));await p.waitForSelector('#dwgv');
  (await chk()).forEach(x=>errs.push('360px・'+({xl:'特大',l:'大'})[fs]+'・図面1件・'+x));
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
