// 盤の点検表の4段（棟 → 階 → 電気室 → 盤）の確認：
//  電気室を開くと中の盤が何面でも並び（上限なし）、盤ごとに3項目の ◯/● を押せる。見出しは「A棟 › 3階」と電気室名、済み件数は階・電気室ごと。
//  「この電気室を全部 ●」「この階を全部 ●」は押す前に件数を出して確かめ（やめると変わらない）、延期の印は残し、元に戻せる。
//  古い形（棟→階→盤・棟→電気室→盤・施設→建屋→電気室→盤）と棟の無い形（電気室→盤）も崩れずに出て、どの盤も1回だけ出る。保存の値の形は変えない。390px ではみ出さない。
// usage: node hozen/tools/banroomcheck.js [スクリーンショットの出力先フォルダ]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const shot=async n=>{if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,n+'.png'),fullPage:false})}};
 const wide=async w=>{const x=await p.evaluate(()=>document.documentElement.scrollWidth);if(x>392)bad.push(w+'：横にはみ出す '+x)};
 const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
 // 4段：A棟 › 1階（第1電気室に盤25面・第2電気室に盤2面・階に直接の盤1面）／2階（電気室だけ・盤なし）
 const L=[mk('bA','A棟','建屋',''),mk('f1','1階','階','bA'),mk('f2','2階','階','bA'),mk('r1','第1電気室','電気室','f1'),mk('r2','第2電気室','電気室','f1'),mk('r3','第3電気室','電気室','f2'),mk('pd','直結盤','盤','f1')];
 for(let i=1;i<=25;i++)L.push(mk('p1_'+i,'動力盤-'+i,'盤','r1'));L.push(mk('p2_1','電灯盤-1','盤','r2'),mk('p2_2','電灯盤-2','盤','r2'));
 await p.evaluate(L=>{S.locs=L;const ym=TODAY.slice(0,7);S.banChk={[ym]:{p1_1:['済','済','済'],p1_2:['延','',''],p2_1:['○','','']}};V.banB='bA';go('ban')},L);await p.waitForTimeout(300);
 const t=await p.evaluate(()=>document.querySelector('#app').innerText);
 if(!/A棟 › 1階/.test(t))bad.push('階の見出しが「A棟 › 1階」の形でない');
 const rows=await p.evaluate(()=>[...document.querySelectorAll('.banrow:not(.bh)')].map(e=>e.id.slice(4)));
 if(rows.length!==28||new Set(rows).size!==28)bad.push('盤が全部・1回ずつ出ない '+rows.length);
 const r1=await p.evaluate(()=>{const e=document.querySelector('[data-room="r1"]');return e?{n:e.querySelectorAll('.banrow:not(.bh)').length,t:e.querySelector('h3').textContent}:null});
 if(!r1||r1.n!==25||!/3\/75（1\/25面）/.test(r1.t.replace(/\s/g,'')))bad.push('第1電気室の盤・済み件数が違う '+JSON.stringify(r1));
 if(!/3項目を ● にする|この電気室を全部 ●/.test(t))bad.push('「この電気室を全部 ●」が無い');
 if(!/この階にはまだ電気室・盤がありません|この電気室にはまだ盤がありません/.test(t))bad.push('盤の無い電気室の案内が無い');
 const small=await p.evaluate(()=>[...document.querySelectorAll('#app button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<44||r.height<44)}).length);if(small)bad.push('44px 未満のボタン '+small);
 await wide('4段');await shot('ban1-rooms');
 // 盤ごとの3項目：第2電気室の 電灯盤-2 の「端子および碍子」を押すと ◯ → ●。値は '○'→'済'
 await p.click('[aria-label="電灯盤-2 端子および碍子"]');await p.click('[aria-label="電灯盤-2 端子および碍子"]');await p.waitForTimeout(100);
 if(await p.evaluate(()=>JSON.stringify(S.banChk[TODAY.slice(0,7)].p2_2))!=='["","済",""]')bad.push('盤ごとの3項目が押せない');
 // この電気室を全部 ●：件数を出して確かめる。やめると変わらない
 const before=await p.evaluate(()=>JSON.stringify(S.banChk));
 await p.click('[data-room="r2"] button:has-text("この電気室を全部 ●")');await p.waitForSelector('#modal button:has-text("● にする")');
 const mt=await p.evaluate(()=>document.querySelector('#modal').innerText);if(!/5項目/.test(mt)||!/第2電気室/.test(mt))bad.push('確かめに件数・場所が出ない '+mt.slice(0,120));
 await shot('ban2-ask');
 await p.click('#modal button:has-text("やめる")');await p.waitForTimeout(100);
 if(await p.evaluate(()=>JSON.stringify(S.banChk))!==before)bad.push('やめても変わった');
 await p.click('[data-room="r2"] button:has-text("この電気室を全部 ●")');await p.click('#modal button:has-text("● にする")');await p.waitForTimeout(150);
 const r2=await p.evaluate(()=>{const m=S.banChk[TODAY.slice(0,7)];return [m.p2_1,m.p2_2,m.p1_3].map(x=>JSON.stringify(x||null)).join()});
 if(r2!=='["済","済","済"],["済","済","済"],null')bad.push('この電気室を全部 ● が違う（ほかの電気室まで変わる？） '+r2);
 await p.click('#undobar button');await p.waitForTimeout(150);
 if(await p.evaluate(()=>JSON.stringify(S.banChk[TODAY.slice(0,7)].p2_2))!=='["","済",""]')bad.push('元に戻せない');
 // この階を全部 ●：直結の盤と電気室の盤の全部。延期は残る
 await p.click('[data-floor="f1"] button:has-text("この階を全部 ●")');await p.click('#modal button:has-text("● にする")');await p.waitForTimeout(150);
 const f1=await p.evaluate(()=>{const m=S.banChk[TODAY.slice(0,7)];return {d:JSON.stringify(m.pd),k:JSON.stringify(m.p1_2),n:Object.values(m).filter(a=>a.every(x=>x==='済')).length}});
 if(f1.d!=='["済","済","済"]'||f1.k!=='["延","済","済"]'||f1.n!==27)bad.push('この階を全部 ● が違う '+JSON.stringify(f1));
 const shape=await p.evaluate(()=>Object.values(S.banChk).every(m=>Object.values(m).every(a=>Array.isArray(a)&&a.length===3&&a.every(x=>['','○','済','延'].includes(x)))));if(!shape)bad.push('保存の値の形が変わった');
 // 古い形・棟の無い形
 const olds={
  '棟→階→盤':{L:[mk('b','A棟','建屋',''),mk('f1','1F','階','b'),mk('x1','盤1','盤','f1'),mk('x2','盤2','盤','f1')],want:['A棟 › 1F'],n:2},
  '棟→電気室→盤':{L:[mk('b','A棟','建屋',''),mk('r','第1電気室','電気室','b'),mk('x1','動力盤','盤','r'),mk('x2','電灯盤','盤','b')],want:['第1電気室','階なし'],n:2},
  '施設→建屋→電気室→盤':{L:[mk('l','○○総合病院','施設',''),mk('b','本館','建屋','l'),mk('r','第1電気室','電気室','b'),mk('x1','動力盤','盤','r')],want:['第1電気室'],n:1},
  '電気室→盤（棟なし）':{L:[mk('r','第1電気室','電気室',''),mk('x1','動力盤','盤','r'),mk('x2','電灯盤','盤','r')],want:['棟なし','第1電気室'],n:2}};
 for(const [k,o] of Object.entries(olds)){
  await p.evaluate(L=>{S.locs=L;S.banChk={};V.banB='';go('ban')},o.L);await p.waitForTimeout(150);
  const g=await p.evaluate(()=>({t:document.querySelector('#app').innerText,ids:[...document.querySelectorAll('.banrow:not(.bh)')].map(e=>e.id)}));
  if(g.ids.length!==o.n||new Set(g.ids).size!==o.n)bad.push(k+'：盤の数が違う '+g.ids.join());
  o.want.forEach(w=>{if(!g.t.includes(w))bad.push(k+'：「'+w+'」が出ない')});
  if(await p.evaluate(L=>JSON.stringify(S.locs)!==JSON.stringify(L),o.L))bad.push(k+'：場所の形が勝手に変わった');
  await wide(k);if(k==='棟→電気室→盤')await shot('ban3-old');
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
