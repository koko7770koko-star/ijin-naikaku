// 推移のグラフ（点検履歴・trendCard）：文字「特大」・360px で 2 年分（月 1 回・24 点）のとき
// ①軸の数・日付・管理値・最後の値の文字が重ならない・枠から出ない（最後の値が管理値の線のすぐそばでも）
// ②年をまたぐときは日付に年が付き、始めと終わりが同じ「11/7」に見えない ③ページが横にはみ出さない（hz-v-meas-graph-xl）
// usage: node hozen/tools/measgraphxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 // 最後の値：管理値の上限のすぐ下・ちょうど上限・上限を越える・下限のすぐ上
 const CASES=[['上限の近く',[0,100],98],['上限ちょうど',[0,100],100],['上限越え',[0,100],104],['下限の近く',[20,100],21],['管理値なし',['',''],55]];
 for(const fs of ['xl','l','m']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  for(const [nm,[mn,mx],last] of CASES){
   const r=await p.evaluate(([f,mn,mx,last])=>{const N=numDefs();N.splice(0,N.length,{id:'g1',name:'変圧器 絶縁抵抗',short:'絶縁',unit:'MΩ',min:String(mn),max:String(mx),equip:'',step:1});
    S.daily={};for(let i=0;i<24;i++){const d=addM(TODAY,-i);S.daily[d]={c:{},by:'職員1',g1:i===0?last:Math.round(60+15*Math.sin(i/3))}}
    S.settings.fscale=f;save();applyFScale();V.hItem='g1';V.hRange='all';go('hist');
    const o=[];if(document.documentElement.scrollWidth>innerWidth+1)o.push('ページが横にはみ出す');
    const svg=document.querySelector('#app svg[role=img]');if(!svg)return ['グラフが出ない'];
    const sr=svg.getBoundingClientRect(),TT=[...svg.querySelectorAll(':scope>text')],T=TT.map(t=>t.getBoundingClientRect());
    T.forEach((t,i)=>{if(t.left<sr.left-1||t.right>sr.right+1||t.top<sr.top-1||t.bottom>sr.bottom+1)o.push('文字が枠から出る「'+TT[i].textContent+'」')});
    for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i],c=T[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)o.push('文字が重なる「'+TT[i].textContent+'」と「'+TT[j].textContent+'」')}
    const dl=TT.filter(t=>+t.getAttribute('y')>=svg.viewBox.baseVal.height-4).map(t=>t.textContent);
    if(dl.length>=2&&dl[0]===dl[dl.length-1])o.push('始めと終わりの日付が同じに見える「'+dl[0]+'」');
    if(dl.length&&!/\d{2,4}[\/年]/.test(dl[0].replace(/^\d{1,2}\/\d{1,2}$/,'')))o.push('年をまたぐのに日付に年が無い「'+dl.join(' ')+'」');
    return o},[fs,mn,mx,last]);
   r.forEach(x=>errs.push('360px・'+({xl:'特大',l:'大',m:'標準'})[fs]+'・'+nm+'・'+x))}
  await c.close()}
 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
