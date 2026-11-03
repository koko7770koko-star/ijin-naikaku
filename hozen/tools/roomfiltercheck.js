// 棟→階→電気室の4段：(1) 日常点検の場所の絞り込みが 棟→階→電気室 の順に選べる（選んだ段の下だけ次の欄が出る・「すべて」で1段戻る・電気室で止まる）
// (2) 非常用発電機の一覧の見出しが「棟 › 階 › 電気室」 (3) 古い形（棟→電気室＝階なし／棟→階＝電気室なし／施設→建屋→電気室）でも開く
// (4) 390px ではみ出さない・44px以上。保存の形は変えない（V.dayLoc は画面だけの状態）。
// usage: node hozen/tools/roomfiltercheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const setup=(locs,eqs)=>p.evaluate(([locs,eqs])=>{S.locs=locs.map(([id,type,parent,name])=>({id,type,parent,name,note:'',pos:{floor:'',x:'',y:'',z:''}}));
  S.equipment=eqs.map(([id,name,locId,kind])=>({id,code:id,name,kind,locId,status:'稼働',photos:[],docs:[],repairs:[],health:[]}));
  const n=S.settings.dnums;n[0].equip=eqs[0][0];if(n[1]&&eqs[1])n[1].equip=eqs[1][0];S.meas=S.meas||[];V.dayLoc='';save();go('day',{day:TODAY})},[locs,eqs]);
 const sels=()=>p.evaluate(()=>[...document.querySelectorAll('select[aria-label*="絞り込む"]')].map(x=>({l:x.getAttribute('aria-label'),first:x.options[0].text,n:x.options.length,sel:x.value,h:x.getBoundingClientRect().height,r:x.getBoundingClientRect().right})));
 // 4段
 await setup([['bA','建屋','','A棟'],['bB','建屋','','B棟'],['f1','階','bA','1階'],['f3','階','bA','3階'],['r1','電気室','f3','第1電気室'],['r2','電気室','f3','第2電気室'],['ban1','盤','r1','動力盤-1']],[['eg1','発電機1','r1','発電機'],['eg2','発電機2','r2','発電機'],['eg3','発電機3','f1','発電機']]);
 await p.waitForTimeout(300);
 let S1=await sels();if(S1.length!==1||S1[0].n!==3||!S1[0].first.includes('場所'))bad.push('最初は棟だけ '+JSON.stringify(S1));
 await p.evaluate(()=>{V.dayLoc='bA';render()});await p.waitForTimeout(200);S1=await sels();
 if(S1.length!==2||S1[1].first!=='階：すべて'||S1[1].n!==3)bad.push('棟を選ぶと階が出る '+JSON.stringify(S1));
 await p.evaluate(()=>{V.dayLoc='f3';render()});await p.waitForTimeout(200);S1=await sels();
 if(S1.length!==3||S1[2].first!=='電気室：すべて'||S1[2].n!==3)bad.push('階を選ぶと電気室が出る '+JSON.stringify(S1));
 if(S1[0].sel!=='bA'||S1[1].sel!=='f3')bad.push('上の段の選択が保たれない '+JSON.stringify(S1.map(x=>x.sel)));
 await p.evaluate(()=>{V.dayLoc='r1';render()});await p.waitForTimeout(200);S1=await sels();
 if(S1.length!==3||S1[2].sel!=='r1')bad.push('電気室で止まる（盤の欄は出ない） '+JSON.stringify(S1));
 S1.forEach(x=>{if(x.h<40||x.r>390)bad.push('大きさ/位置 '+JSON.stringify(x))});
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('日常点検が横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // 「すべて」で1段戻る
 await p.evaluate(()=>{const s=document.querySelectorAll('select[aria-label*="絞り込む"]')[2];s.value='';s.dispatchEvent(new Event('change'))});await p.waitForTimeout(200);
 if(await p.evaluate(()=>V.dayLoc)!=='f3')bad.push('電気室のすべてで階に戻らない '+await p.evaluate(()=>V.dayLoc));
 await p.evaluate(()=>{const s=document.querySelectorAll('select[aria-label*="絞り込む"]')[0];s.value='';s.dispatchEvent(new Event('change'))});await p.waitForTimeout(200);
 if(await p.evaluate(()=>V.dayLoc)!=='')bad.push('棟のすべてで解除されない');
 // 発電機の見出し
 await p.evaluate(()=>{go('diag',{dgTab:'meas'})});await p.waitForTimeout(300);
 const hd=await p.evaluate(()=>[...document.querySelectorAll('#genCard .grp > b')].map(x=>x.textContent));
 if(!hd.includes('A棟 › 3階 › 第1電気室')||!hd.includes('A棟 › 3階 › 第2電気室')||!hd.includes('A棟 › 1階'))bad.push('発電機の見出し '+JSON.stringify(hd));
 // 古い形：棟→電気室（階なし）
 await setup([['bA','建屋','','A棟'],['r1','電気室','bA','第1電気室'],['ban1','盤','r1','盤-1']],[['eg1','発電機1','r1','発電機']]);await p.waitForTimeout(200);
 await p.evaluate(()=>{V.dayLoc='bA';render()});await p.waitForTimeout(200);S1=await sels();
 if(S1.length!==2||S1[1].first!=='電気室：すべて')bad.push('階なしの形 '+JSON.stringify(S1));
 await p.evaluate(()=>{go('diag',{dgTab:'meas'})});await p.waitForTimeout(300);
 const hd2=await p.evaluate(()=>[...document.querySelectorAll('#genCard .grp > b')].map(x=>x.textContent));if(!hd2.includes('A棟 › 第1電気室'))bad.push('階なしの見出し '+JSON.stringify(hd2));
 // 古い形：棟→階（電気室なし）
 await setup([['bA','建屋','','A棟'],['f1','階','bA','2階'],['ban1','盤','f1','盤-1']],[['eg1','発電機1','f1','発電機']]);await p.waitForTimeout(200);
 await p.evaluate(()=>{V.dayLoc='f1';render()});await p.waitForTimeout(200);S1=await sels();if(S1.length!==2||S1[1].sel!=='f1')bad.push('電気室なしの形 '+JSON.stringify(S1));
 await p.evaluate(()=>{go('diag',{dgTab:'meas'})});await p.waitForTimeout(300);
 const hd3=await p.evaluate(()=>[...document.querySelectorAll('#genCard .grp > b')].map(x=>x.textContent));if(!hd3.includes('A棟 › 2階'))bad.push('電気室なしの見出し '+JSON.stringify(hd3));
 // 古い形：施設→建屋→電気室
 await setup([['fa','施設','','○○総合病院'],['bA','建屋','fa','A棟'],['r1','電気室','bA','第1電気室']],[['eg1','発電機1','r1','発電機']]);await p.waitForTimeout(200);
 await p.evaluate(()=>{V.dayLoc='r1';render()});await p.waitForTimeout(200);S1=await sels();
 if(S1.length!==2||S1[0].n!==2||S1[1].sel!=='r1')bad.push('施設→建屋の形 '+JSON.stringify(S1));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
