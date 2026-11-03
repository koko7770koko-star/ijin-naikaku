// 場所の4段（棟 → 階 → 電気室 → 盤）の登録画面の確認：
//  空から画面のボタンで 棟1・階2・電気室2・盤3 を足す（名前の初期値なし・例は「例：A棟」の形だけ）、
//  名前を変える・↑↓で並べ替え（ord）・別の親へ移す・中に物がある所を消す（盤の点検の記録は残る・元に戻せる）、
//  保存して読み直すと順番が残る、ord の無い古い記録（棟→階→盤・棟→電気室→盤・施設→建屋→電気室→盤）がそのまま開くこと、390px で横にはみ出さないこと。
// usage: node hozen/tools/roomregcheck.js [スクリーンショットの出力先フォルダ]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const ready=()=>p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const shot=async n=>{if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,n+'.png')})}};
 const wide=async w=>{const x=await p.evaluate(()=>document.documentElement.scrollWidth);if(x>392)bad.push(w+'：横にはみ出す '+x)};
 await p.goto('file://'+FILE);await ready();
 await p.evaluate(k=>{localStorage.clear();localStorage.setItem(k,JSON.stringify({settings:{name:'確認'}}))},KEY);await p.reload();await ready();
 await p.evaluate(()=>go('locs'));await p.waitForTimeout(200);
 if((await p.evaluate(()=>S.locs.length))!==0)bad.push('空から始まらない（初期値で場所が入っている）');
 await shot('room0-empty');
 const add=async(btn,name,cont)=>{await p.click(btn);await p.waitForSelector('#la_name');
   const ph=await p.getAttribute('#la_name','placeholder');if(!/^例：/.test(ph||''))bad.push('入力欄の例が「例：」の形でない '+ph);
   if(await p.inputValue('#la_name'))bad.push('名前に初期値が入っている');
   for(const n of name){await p.fill('#la_name',n);await p.click(cont&&n!==name[name.length-1]?'#modal button:has-text("足して続ける")':'#modal button:text-is("足す")');await p.waitForTimeout(120)}};
 // 棟 → 階2 → 電気室2（1つ目の階に）→ 盤3（1つ目の電気室に）
 await add('button:has-text("棟を足す")',['A棟']);
 const id=n=>p.evaluate(n=>(S.locs.find(l=>l.name===n)||{}).id,n);
 await add(`[aria-label="A棟に階を足す"]`,['1階','2階'],true);
 await add(`[aria-label="1階に電気室を足す"]`,['第1電気室','第2電気室'],true);
 await add(`[aria-label="第1電気室に盤を足す"]`,['動力盤-1','動力盤-2','電灯盤-1'],true);
 await p.evaluate(()=>closeModal(true));await p.waitForTimeout(150);
 const T=await p.evaluate(()=>S.locs.map(l=>l.type+':'+l.name+':'+((S.locs.find(x=>x.id===l.parent)||{}).name||'')).join('|'));
 if(T!=='建屋:A棟:|階:1階:A棟|階:2階:A棟|電気室:第1電気室:1階|電気室:第2電気室:1階|盤:動力盤-1:第1電気室|盤:動力盤-2:第1電気室|盤:電灯盤-1:第1電気室')bad.push('足した形が違う '+T);
 const pills=await p.evaluate(()=>[...document.querySelectorAll('.locn .pill')].map(x=>x.textContent).join());
 if(pills!=='棟,階,電気室,盤,盤,盤,電気室,階')bad.push('木の並び・段の名前が違う '+pills);
 const h=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('.locn .btn')].map(x=>x.getBoundingClientRect().height)));if(h<44)bad.push('ボタンが小さい '+h);
 await wide('登録後');await shot('room1-tree');
 // 盤を数でまとめて足す（名前の頭は使う人が入れる）
 await p.click('[aria-label="第2電気室に盤を足す"]');await p.waitForSelector('#la_name');await p.evaluate(()=>document.querySelector('#modal details').open=true);
 if(await p.inputValue('#la_pre'))bad.push('盤の名前の頭に初期値がある');
 await p.fill('#la_pre','分電盤-');await p.fill('#la_n','3');await shot('room2-bulk');await p.click('#modal button:has-text("まとめて足す")');await p.waitForTimeout(150);
 const r2=await p.evaluate(()=>{const r=S.locs.find(l=>l.name==='第2電気室');return S.locs.filter(l=>l.parent===r.id).map(l=>l.type+l.name).join()});
 if(r2!=='盤分電盤-1,盤分電盤-2,盤分電盤-3')bad.push('盤のまとめて足すが違う '+r2);
 // 階を範囲で
 await p.click('[aria-label="A棟に階を足す"]');await p.waitForSelector('#la_dn',{state:'attached'});await p.evaluate(()=>document.querySelector('#modal details').open=true);
 await p.fill('#la_dn','1');await p.fill('#la_up','3');await p.click('#modal button:has-text("範囲の階を足す")');await p.waitForTimeout(150);
 const fl=await p.evaluate(()=>{const a=S.locs.find(l=>l.name==='A棟');return locKids(a.id).map(l=>l.name).join()});
 if(fl!=='地下1階,1階,2階,3階')bad.push('階の範囲・並びが違う '+fl);
 // 名前を変える（⋯ から）
 const b1=await id('動力盤-1');
 await p.click('[aria-label="動力盤-1の操作"]');await p.waitForSelector('#lm_name');await shot('room3-menu');await p.fill('#lm_name','動力盤-1A');await p.click('#modal button:has-text("名前を保存")');await p.waitForTimeout(150);
 if(await p.evaluate(i=>locById(i).name,b1)!=='動力盤-1A')bad.push('名前を変えられない');
 // 並べ替え：電灯盤-1 を一番上へ（↑2回）。ほかの段には ord を振らない
 await p.click('button:has-text("並べ替え")');await p.waitForTimeout(100);
 const ord=()=>p.evaluate(()=>{const r=S.locs.find(l=>l.name==='第1電気室');return locKids(r.id).map(l=>l.name).join()});
 const o0=(await ord()).split(','),last=o0[2];
 await p.click(`[aria-label="${last}を上へ"]`);await p.waitForTimeout(100);await p.click(`[aria-label="${last}を上へ"]`);await p.waitForTimeout(100);
 await shot('room4-sort');await wide('並べ替え');
 if(await ord()!==[last,o0[0],o0[1]].join())bad.push('並べ替えが違う '+(await ord()));
 if(await p.evaluate(()=>S.locs.filter(l=>l.type==='階').some(l=>'ord' in l)))bad.push('並べ替えていない段に ord が付いた');
 await p.click('button:has-text("並べ替えを終える")');
 // 盤の点検の記録を付けてから、別の電気室へ移す・電気室ごと消す → 記録は残る・元に戻せる
 await p.evaluate(i=>{S.banChk={'2026-11':{[i]:['済','○','']}};save()},b1);
 await p.evaluate(i=>{locMenu(i)},b1);await p.waitForSelector('#lm_parent');
 const r2id=await id('第2電気室');await p.selectOption('#lm_parent',r2id);await p.click('#modal button:text-is("移す")');await p.waitForTimeout(150);
 if(await p.evaluate(i=>locById(i).parent,b1)!==r2id)bad.push('別の電気室へ移せない');
 const n0=await p.evaluate(()=>S.locs.length);
 await p.evaluate(i=>{locMenu(i)},r2id);await p.waitForSelector('#lm_name');await p.click('#modal button:has-text("消す")');await p.waitForTimeout(200);
 const d=await p.evaluate(([i,r])=>({n:S.locs.length,b:!!locById(i),r:!!locById(r),rec:JSON.stringify(((S.banChk||{})['2026-11']||{})[i])}),[b1,r2id]);
 if(d.n!==n0-5||d.b||d.r)bad.push('中に物がある電気室をまとめて消せない '+JSON.stringify(d)+' n0='+n0);
 if(d.rec!=='["済","○",""]')bad.push('消すと点検の記録まで消えた '+d.rec);
 await p.click('#undobar button');await p.waitForTimeout(200);
 if(await p.evaluate(()=>S.locs.length)!==n0)bad.push('元に戻せない');
 // 保存して読み直すと順番（ord）が残る
 const before=await ord();
 await p.evaluate(()=>{window.__t=Date.now();save()});await p.waitForFunction(()=>(MIRROR_AT.app||0)>=window.__t,null,{timeout:10000});await p.reload();await ready();
 if(await ord()!==before)bad.push('読み直すと順番が変わる '+before+' → '+(await ord()));
 if(await p.evaluate(()=>S.locs.length)!==n0)bad.push('読み直しで場所の数が変わった');
 // ord の無い古い形 3つ（施設が1つなら見出しに畳む）。勝手に変換しない
 const olds={
  '棟→階→盤':[['b','A棟','建屋',''],['f2','2F','階','b'],['f1','1F','階','b'],['p1','盤2','盤','f1'],['p2','盤1','盤','f1']],
  '棟→電気室→盤':[['b','A棟','建屋',''],['r','第1電気室','電気室','b'],['p1','動力盤','盤','r']],
  '施設→建屋→電気室→盤':[['l','○○総合病院','施設',''],['b','本館','建屋','l'],['r','第1電気室','電気室','b'],['p1','動力盤','盤','r']]};
 for(const [k,L] of Object.entries(olds)){
  const locs=L.map(([id,name,type,parent])=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}}));
  await p.evaluate(([key,v])=>{localStorage.setItem(key,v)},[KEY,JSON.stringify({settings:{name:'確認'},locs})]);await p.reload();await ready();
  await p.evaluate(()=>{go('locs');locFold(true)});await p.waitForTimeout(150);
  const g=await p.evaluate(()=>({n:S.locs.length,ord:S.locs.some(l=>'ord' in l),rows:[...document.querySelectorAll('.locn .ti')].map(x=>x.textContent.replace(/[▾▸\s]/g,'')).join(',')}));
  const want={'棟→階→盤':'A棟,1F,盤1,盤2,2F','棟→電気室→盤':'A棟,第1電気室,動力盤','施設→建屋→電気室→盤':'本館,第1電気室,動力盤'}[k];
  if(g.n!==L.length||g.ord||g.rows!==want)bad.push(k+'：古い形がそのまま開かない '+JSON.stringify(g));
  const kept=await p.evaluate(()=>JSON.stringify(S.locs.map(l=>[l.id,l.parent,l.type])));if(kept!==JSON.stringify(L.map(([id,,type,parent])=>[id,parent,type])))bad.push(k+'：形が勝手に変わった');
  await wide(k);if(k==='施設→建屋→電気室→盤')await shot('room5-old');
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
