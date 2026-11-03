// 場所を選ぶ欄（locOptions）の確認：施設が1つでその下に棟が2つ以上あるとき、施設の行の下に棟ごとの見出し（optgroup）で分かれ、
//  どの場所も1回ずつ（最近使った場所を除く）・「A棟 › 1階 › 第1電気室（電気室）」の形・自分と自分の下は選べない（exclude）。
//  施設が無い形（棟が並ぶ）・棟が1つだけの形はこれまでどおり。保存は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
 const run=(L,ex)=>p.evaluate(([L,ex])=>{S.locs=L;LOC_RECENT.length=0;const d=document.createElement('select');d.innerHTML=locOptions('',true,ex);
   return {g:[...d.querySelectorAll('optgroup')].map(x=>x.label),o:[...d.querySelectorAll('option')].map(x=>x.value).filter(Boolean),t:[...d.querySelectorAll('option')].map(x=>x.textContent)}},[L,ex||'']);
 const L1=[mk('h','○○総合病院','施設',''),mk('a','A棟','建屋','h'),mk('b','B棟','建屋','h'),mk('f','1階','階','a'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('g','2階','階','b')];
 let r=await run(L1);
 if(r.g.join()!=='A棟,B棟')bad.push('棟ごとの見出しにならない '+r.g.join());
 if(r.o.length!==7||new Set(r.o).size!==7)bad.push('場所が1回ずつ出ない '+r.o.join());
 if(r.o[0]!=='h')bad.push('施設の行が先頭でない');
 if(!r.t.includes('○○総合病院 › A棟 › 1階 › 第1電気室（電気室）'))bad.push('形が違う '+r.t.join('|'));
 r=await run(L1,'f');if(r.o.includes('f')||r.o.includes('r')||r.o.includes('x')||!r.o.includes('a'))bad.push('自分と下を除けない '+r.o.join());
 r=await run([mk('a','A棟','建屋',''),mk('b','B棟','建屋',''),mk('f','1階','階','a')]);if(r.g.join()!=='A棟,B棟'||r.o.length!==3)bad.push('施設の無い形が変わった '+JSON.stringify(r));
 r=await run([mk('h','○○総合病院','施設',''),mk('a','A棟','建屋','h'),mk('f','1階','階','a')]);if(r.g.length||r.o.length!==3)bad.push('棟が1つの形が変わった '+JSON.stringify(r));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
