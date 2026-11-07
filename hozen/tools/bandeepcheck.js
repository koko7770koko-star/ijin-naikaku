// 盤が多い（棟 6×階 10×電気室 5×盤 10＝3000 面）とき、盤の点検の画面・◯● を押す・ホーム・月報が待たされない（盤の画面・押す・ホームは 0.4 秒以内、月報は盤 300 行の表があるので 1 秒以内。前は押すたびに約 0.5 秒・ホーム 0.4 秒）。
// 押した印は正しい盤に入り、場所を足した直後の画面にもその場所が出る（覚えた表が古いまま残らない）。記録の形は変えない（hz-perf-ban-many）。
// usage: node hozen/tools/bandeepcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const r=await p.evaluate(()=>{const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.banChk={};const T={},ms=f=>{const t=performance.now();f();return Math.round(performance.now()-t)};
  T.home=ms(()=>go('home'));T.ban=ms(()=>{V.banYm=TODAY.slice(0,7);V.banB='lb3';go('ban')});T.tap=ms(()=>banTap('lb3f2r4p7',1));
  T.report=ms(()=>{V.rmode='m';V.ry=+TODAY.slice(0,4);V.rm=+TODAY.slice(5,7);go('report')});
  const ym=TODAY.slice(0,7),v=banVal(ym,'lb3f2r4p7',1),other=Object.keys(S.banChk[ym]||{}).filter(k=>k!=='lb3f2r4p7');
  // 場所を足した直後の画面（覚えた表が古いと出ない）
  S.locs.push({id:'lbNEW',name:'新しい盤',type:'盤',parent:'lb3f2r4',note:'',pos:{}});V['bf_lb3f2']=true;V['br_lb3f2r4']=true;go('ban');
  const seen=!!document.getElementById('ban-lbNEW'),kids=locKids('lb3f2r4').length;
  return {T,v,other,seen,kids,sw:document.documentElement.scrollWidth}});
 for(const k in r.T)if(r.T[k]>(k==='report'?1000:400))bad.push(k+' に '+r.T[k]+'ms');
 if(!r.v)bad.push('押した印が入らない');if(r.other.length)bad.push('ほかの盤に印が入った '+r.other.join(','));
 if(!r.seen)bad.push('足した盤が画面に出ない（覚えた表が古い）');if(r.kids!==11)bad.push('render の外の locKids が古い '+r.kids);
 if(r.sw>392)bad.push('はみ出す '+r.sw);
 console.error('時間（ms）：'+JSON.stringify(r.T));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
