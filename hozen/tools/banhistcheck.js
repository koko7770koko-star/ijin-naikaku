// 盤の記録（hz-ban-history）：盤の点検で盤の名前を押すと、その盤の過去12か月 × 3項目（月は縦）と、その盤の異常の記録が見える。
//  12か月分の見本を入れて表の行（12）・印・⚠ の数・異常の一覧・異常を押すと開く を確かめる。今月の行が目立つ。読むだけで記録は変わらない。390px・44px。
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r')];
  const now=TODAY.slice(0,7);let y=+now.slice(0,4),m=+now.slice(5,7);S.banChk={};
  for(let i=0;i<14;i++){const ym=y+'-'+String(m).padStart(2,'0');S.banChk[ym]={x:i%3===0?['済','済','済']:i%3===1?['○','','延']:['','',''],y:['済','','']};m--;if(m<1){m=12;y--}}
  const pm=(()=>{let yy=+now.slice(0,4),mm=+now.slice(5,7)-1;if(mm<1){mm=12;yy--}return yy+'-'+String(mm).padStart(2,'0')})();
  S.issues=[{id:'i1',date:now+'-01',title:'盤の異常：動力盤-1（端子および碍子）',place:'A棟 › 1階 › 第1電気室 › 動力盤-1',status:'発見',detail:'',action:'',photos:[],equipId:''},
            {id:'i2',date:pm+'-10',title:'盤の異常：動力盤-1（盤内 発熱）',place:'A棟 › 1階 › 第1電気室 › 動力盤-1',status:'完了',detail:'',action:'',photos:[],equipId:''},
            {id:'i3',date:now+'-02',title:'別の盤',place:'A棟 › 1階 › 第1電気室 › 動力盤-2',status:'発見',detail:'',action:'',photos:[],equipId:''}];
  V.banB='b';V.banYm=now;go('ban');return JSON.stringify({c:S.banChk,i:S.issues})});await p.waitForTimeout(200);
 await p.click('[aria-label="動力盤-1の記録（12か月）"]');await p.waitForSelector('#modal tr[data-ym]');
 const r=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#modal tr[data-ym]')];return {n:rows.length,first:rows[0].innerText.replace(/\s+/g,' '),second:rows[1].innerText.replace(/\s+/g,' '),hl:rows[0].getAttribute('style')||'',iss:[...document.querySelectorAll('#modal .item .ti')].map(x=>x.textContent)}});
 if(r.n!==12)bad.push('12か月の行にならない '+r.n);
 if(!/● ● ● ⚠1/.test(r.first))bad.push('今月の行が違う '+r.first);if(!/◯ － 延 ⚠1/.test(r.second))bad.push('先月の行が違う '+r.second);
 if(!/background/.test(r.hl))bad.push('今月の行が目立たない');
 if(r.iss.length!==2||r.iss.some(t=>/別の盤/.test(t)))bad.push('この盤の異常だけが出ない '+JSON.stringify(r.iss));
 const small=await p.evaluate(()=>[...document.querySelectorAll('#modal button')].filter(e=>{const x=e.getBoundingClientRect();return x.width>0&&x.height<44}).length);if(small)bad.push('窓のボタンが44px未満 '+small);
 const ov=await p.evaluate(()=>{const m=document.querySelector('#modal');return m.scrollWidth>m.clientWidth+1});if(ov)bad.push('窓の表が横にはみ出す');
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'banhist.png')})}
 await p.click('#modal .item');await p.waitForTimeout(200);if(!(await p.$('#is_title')))bad.push('異常を押しても開かない');
 await p.evaluate(()=>closeModal(true));
 if(await p.evaluate(()=>JSON.stringify({c:S.banChk,i:S.issues}))!==before)bad.push('記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
