// 小さい端末（320px・360px）で go() の全画面を開き、横にはみ出す画面が無いかを確かめる。記録が空のときと、記録が多め
// （場所 棟→階→電気室→盤 の長い名前・盤40面・設備60台・予定150件・異常40件・作業20件）のときの両方。印刷は見ない。保存の形は変えない。
// はみ出したら、その画面と右端を越えた部品（クラス名・文字の頭）を出す。
// usage: node hozen/tools/narrowallcheck.js [幅をカンマで 例 320,360]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const WIDTHS=(process.argv[2]||'320,360').split(',').map(Number);const bad=[],note=[];
// 直し中の物（取り込まれたらここから消す）：日報の点検表は wC/hz-day-narrow（iC）で直し中
const KNOWN={dailyRep:'wC/hz-day-narrow で直し中'};
(async()=>{const b=await chromium.launch();
 for(const W of WIDTHS)for(const many of [false,true]){
  const c=await b.newContext({viewport:{width:W,height:740}});const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  if(many)await p.evaluate(()=>{const pad=n=>String(n).padStart(2,'0'),ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const base=new Date();const day=i=>{const d=new Date(base);d.setDate(d.getDate()-i);return ds(d)};
   const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});const L=[mk('h','○○総合病院 本館・東館・西館 電気設備','施設','')];
   ['A','B','C'].forEach((x,i)=>{L.push(mk('b'+i,x+'棟（中央診療棟・病棟・外来）','建屋','h'));for(let f=1;f<=2;f++){L.push(mk('f'+i+f,'地下'+f+'階 機械室フロア','階','b'+i));const r='r'+i+f;L.push(mk(r,'第'+f+'電気室（高圧受変電設備・非常用発電機室）','電気室','f'+i+f));for(let k=1;k<=7;k++)L.push(mk('p'+i+f+k,'動力制御盤-'+k+'（空調・給排水ポンプ系統 東側）','盤','r'+i+f))}});
   S.locs=L;const lids=L.filter(l=>l.type==='盤').map(l=>l.id);
   S.equipment=[...Array(60)].map((_,i)=>({id:'eq'+i,code:'EQ-'+String(i+1).padStart(5,'0'),name:'高圧真空遮断器 VCB-'+(i+1)+'（受電・き電盤用 長い名前の確認）',kind:i%5?'その他':'発電機',place:'A棟 地下1階 第1電気室',locId:lids[i%lids.length],status:'稼働',importance:'A',run:{meters:[]},repairs:[],photos:[],docs:[],spec:{}}));
   S.tasks=[...Array(150)].map((_,i)=>({id:'tk'+i,date:day(i%60-20),time:'09:00',title:'年次点検 高圧受変電設備 停電作業を伴う点検'+i,kind:'点検',cat:'',place:'A棟（中央診療棟）地下1階 第1電気室',staff:'職員'+(i%9+1),attend:'',status:i%3?'完了':'予定',result:'',note:'',photos:[],equipId:'eq'+(i%60)}));
   S.issues=[...Array(40)].map((_,i)=>({id:'is'+i,date:day(i),title:'盤の異常：動力制御盤-'+i+'（端子および碍子）締付けトルク不足の疑い',place:'A棟 › 地下1階 › 第1電気室 › 動力制御盤-1',detail:'確認',action:'',status:i%4?'完了':'発見',equipId:'eq'+(i%60),photos:[],log:[]}));
   const ym=TODAY.slice(0,7);S.banChk={[ym]:Object.fromEntries(lids.map((id,i)=>[id,[i%2?'済':'○',i%3?'':'済',i%5?'':'延']]))};
   save()});
  const views=await p.evaluate(()=>Object.keys(VIEWS));
  for(const v of views){
   await p.evaluate(v=>{try{go(v,v==='dailyRep'?{day:TODAY}:v==='equipDetail'?{eq:(S.equipment[0]||{}).id||''}:v==='ban'?{}:undefined)}catch(e){console.error(v,e.message)}},v);await p.waitForTimeout(120);
   const o=await p.evaluate(W=>{const sw=document.documentElement.scrollWidth;if(sw<=W+1)return null;const r=[];
     document.querySelectorAll('#app *').forEach(e=>{const x=e.getBoundingClientRect();if(x.width>0&&x.right>W+1&&getComputedStyle(e).display!=='none'&&!e.closest('.noscreen,.banprint,.prt,[hidden]')){const kids=[...e.children].some(k=>k.getBoundingClientRect().right>W+1);if(!kids)r.push((e.tagName.toLowerCase()+'.'+String(e.className||'').split(' ').slice(0,2).join('.'))+' 右'+Math.round(x.right)+' 「'+(e.textContent||e.value||'').trim().slice(0,14)+'」')}});
     return sw+'px：'+r.slice(0,3).join('、')},W);
   if(o)(KNOWN[v]?note:bad).push(`${W}px${many?'・記録多め':''} ${v}：${o}${KNOWN[v]?'（'+KNOWN[v]+'）':''}`);
   // ボタンどうしが重なっていないか（見えている物だけ）
   const ov=await p.evaluate(()=>{const pinned=e=>{for(let x=e;x&&x!==document.body;x=x.parentElement){const p=getComputedStyle(x).position;if(p==='fixed'||p==='sticky')return true}return false}; // 下のボタン列・上に貼り付く帯の下を流れる物は重なりとしない
     const B=[...document.querySelectorAll('#app button,#app .btn')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('.banprint,.noscreen,[hidden]')&&!pinned(e)}).map(e=>[e,e.getBoundingClientRect()]);const out=[];
     for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const [a,x]=B[i],[c,y]=B[j];if(a.contains(c)||c.contains(a))continue;const w=Math.min(x.right,y.right)-Math.max(x.left,y.left),h=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);if(w>3&&h>3)out.push('「'+a.textContent.trim().slice(0,8)+'」と「'+c.textContent.trim().slice(0,8)+'」')}
     return out.slice(0,3).join('、')});
   if(ov)bad.push(`${W}px${many?'・記録多め':''} ${v}：ボタンが重なる ${ov}`);
  }
  if(errs.length)bad.push(`${W}px${many?'・記録多め':''}：`+errs.slice(0,3).join(' / '));
  await c.close();
 }
 if(note.length)console.log('注意（既知）：\n'+note.join('\n'));console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
