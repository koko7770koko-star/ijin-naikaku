// 点検履歴（go('hist')）のキーワード：日常点検 3 年分で、2 語（並びが逆・全角空白）・半角カナ・全角英数で同じく絞れ、書き直しが 0.3 秒以内、
// 0 件のとき「条件を外して全期間を見る」（44px）が出て、押すと戻るか。390px・特大で横にはみ出さないか（hz-v-search-words-hist2）。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/histwordscheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{window.save=()=>{};const cd=chkDefs();
  for(let i=0;i<1095;i++){const d=addD(TODAY,-i),c={};cd.forEach(x=>c[x.id]='○');S.daily[d]={c,by:'職員'+(i%5+1),note:(i%2?'VCB 異音 ':'バッテリー 交換 ')+(i%3?'A棟':'B棟')}}
  S.settings.fscale='xl';applyFScale();V.hRange='all';const R={};
  const t=kw=>{V.hKw=kw;const s=performance.now();go('hist');const ms=performance.now()-s;const m=(document.querySelector('#hCount')||{}).textContent||'';R[kw]={n:+(m.match(/\d+/)||[0])[0],ms:Math.round(ms),sw:document.documentElement.scrollWidth}};
  ['VCB','ｖｃｂ','バッテリー','ﾊﾞｯﾃﾘｰ','Ａ棟 vcb','b棟　ﾊﾞｯﾃﾘｰ','無い語 vcb'].forEach(t);return R});
 console.log(JSON.stringify(r));
 const all=r['VCB'].n;if(!all)bad.push('VCB が見つからない');
 if(r['ｖｃｂ'].n!==all)bad.push('全角小文字の件数が違う');if(r['ﾊﾞｯﾃﾘｰ'].n!==r['バッテリー'].n)bad.push('半角カナの件数が違う');
 if(!(r['Ａ棟 vcb'].n>0&&r['Ａ棟 vcb'].n<all))bad.push('2 語（逆の並び）で絞れない '+r['Ａ棟 vcb'].n);
 if(!(r['b棟　ﾊﾞｯﾃﾘｰ'].n>0&&r['b棟　ﾊﾞｯﾃﾘｰ'].n<r['バッテリー'].n))bad.push('全角空白の 2 語で絞れない '+r['b棟　ﾊﾞｯﾃﾘｰ'].n);
 if(r['無い語 vcb'].n!==0)bad.push('無い語を含む 2 語で見つかる');
 for(const [k,x] of Object.entries(r)){if(x.ms>300)bad.push('「'+k+'」の書き直しが遅い '+x.ms+'ms');if(x.sw>392)bad.push('「'+k+'」で横にはみ出す '+x.sw)}
 const h=await p.evaluate(()=>{const e=document.querySelector('#hClearBtn');return e?e.getBoundingClientRect().height:0});if(h<44)bad.push('0 件のとき「条件を外す」が無いか 44px 未満 '+h);
 else{await p.click('#hClearBtn');const n=await p.evaluate(()=>({kw:V.hKw||'',n:document.querySelectorAll('#app .card .item').length}));if(n.kw||!n.n)bad.push('「条件を外す」で戻らない '+JSON.stringify(n))}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
