// 点検履歴・グラフ（hist）：文字「特大」「大」・360px で、日常点検の数字 8 項目を 90 日分入れ、項目ごとに開いて
// ①ページが横にはみ出さない ②項目の選びの文字が切れない・ボタンが 44px 以上 ③グラフの軸の数と管理値が重ならない・箱から出ない（hz-l-hist-graph）
// usage: node hozen/tools/histgraphxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  const ids=await p.evaluate(f=>{const N=numDefs();N.splice(0,N.length,...[['変圧器温度','℃',90,0],['受電電圧','kV',0,0],['最大需要電力','kW',0,0],['非常用発電機 蓄電池電圧','V',0,0],['受変電設備 接地抵抗 測定値','Ω',0,0],['力率','%',0,0],['冷却水温度','℃',0,0],['空調用冷凍機 運転電流','A',0,0]].map(([name,unit,max,m],i)=>({id:'n'+i,name,short:name.slice(0,6),unit,min:'',max:max?String(max+150):'',equip:'',step:1})));for(let i=0;i<90;i++){const d=addD(TODAY,-i),x={c:{},by:'職員1'};N.forEach((n,k)=>x[n.id]=Math.round((100+k*37+10*Math.sin(i/5))*100)/100);S.daily[d]=x}
   S.settings.fscale=f;save();applyFScale();return N.map(n=>n.id)},fs);
  const tag='360px・'+({xl:'特大',l:'大'})[fs]+'・';
  for(const id of ids.slice(0,8)){
   await p.evaluate(id=>{V.hItem=id;V.hRange='90';go('hist')},id);await p.waitForTimeout(120);
   const r=await p.evaluate(()=>{const o=[];
    if(document.documentElement.scrollWidth>innerWidth+1)o.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
    document.querySelectorAll('#app button,#app select').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(!q.height)return;const lb=(e.textContent||'').trim().slice(0,12);
     if(q.height<43.5)o.push('44px 未満 '+Math.round(q.height)+'px 「'+lb+'」');
     if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+1)o.push('ボタンの文字が切れる 「'+lb+'」');
     // 項目の選びは 1 行いっぱいの幅。長い名前は選びの中で「…」になり、開くと全部読める（選びは折り返せない）
    });
    const pb=document.querySelector('#hPrintBtn');if(pb&&pb.childNodes.length>1)o.push('印刷ボタンの文字が別々の塊（flex の gap）に割れて隙間が空く');
    const svg=document.querySelector('#app svg[role=img]');if(svg){const sr=svg.getBoundingClientRect();const T=[...svg.querySelectorAll('text')].map(t=>t.getBoundingClientRect());
     T.forEach(t=>{if(t.left<sr.left-1||t.right>sr.right+1)o.push('グラフの数字が枠から出る')});
     for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i],b=T[j];if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)o.push('グラフの数字が重なる')}}
    else o.push('グラフが出ない');
    return [...new Set(o)]});
   r.forEach(x=>errs.push(tag+id+'・'+x))}
  await c.close()}
 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
