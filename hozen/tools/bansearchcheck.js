// 盤の点検表：盤の名前で探す（盤20面で「動力盤-1」を入れて合う盤だけ出る・見出しは残る・空にすると全部戻る・絞り込み中は全部●を出さない・全角でも探せる・保存の形は変えない）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const keys0=await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});
  S.locs=[mk('a','A棟','建屋',''),mk('f1','1階','階','a'),mk('r1','第1電気室','電気室','f1'),mk('r2','第2電気室','電気室','f1'),mk('b','B棟','建屋',''),mk('g1','1階','階','b'),mk('s1','第1電気室','電気室','g1')];
  for(let i=1;i<=12;i++)S.locs.push(mk('p'+i,'動力盤-'+i,'盤','r1'));
  for(let i=1;i<=8;i++)S.locs.push(mk('q'+i,'照明盤-'+i,'盤','r2'));
  S.locs.push(mk('z1','特別盤-9','盤','s1'));
  const k=Object.keys(S).sort().join();V.banB='a';go('ban');return k});await p.waitForTimeout(300);
 const n=()=>p.evaluate(()=>document.querySelectorAll('.banrow:not(.bh)').length);
 if(!await p.$('#banQ'))bad.push('探す欄が出ない');
 if(await n()!==20)bad.push('最初に20面出ない '+await n());
 const sh=async v=>{await p.fill('#banQ',v);await p.waitForTimeout(600)};
 await sh('動力盤-1');let c1=await n();if(c1!==4)bad.push('「動力盤-1」で 1,10,11,12 の4面にならない '+c1); // 動力盤-1,-10,-11,-12
 if(!await p.evaluate(()=>/第1電気室/.test(document.body.textContent)&&!document.querySelector('[data-room="r2"]')))bad.push('電気室の見出しの出入りが違う');
 if(await p.$('button:has-text("全部 ●")'))bad.push('絞り込み中に「全部 ●」が出る');
 await sh('ＡＢＣ');
 await sh('照明盤－3');if(await n()!==1)bad.push('全角のハイフン違いで探せない '+await n());
 await sh('照明');if(await n()!==8)bad.push('照明 8面にならない '+await n());
 await sh('特別');if(!/合う盤がありません/.test(await p.evaluate(()=>document.body.textContent))||!await p.$('button:has-text("B棟 に 1面あります")'))bad.push('他の棟の案内が出ない');
 await p.click('button:has-text("B棟 に 1面あります")');await p.waitForTimeout(300);if(await n()!==1)bad.push('B棟へ移っても絞り込みが効かない '+await n());
 await sh('');await p.evaluate(()=>{V.banB='a';render()});await p.waitForTimeout(200);if(await n()!==20)bad.push('空にしても全部戻らない '+await n());
 const keys1=await p.evaluate(()=>Object.keys(S).sort().join());if(keys1!==keys0)bad.push('保存の形（トップの項目）が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
