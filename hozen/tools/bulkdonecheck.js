// まとめて ●：年間計画の「今月の ◯ を全部 ●」（延は触らない・絞り込み中は表示中の行だけ・元に戻せる）と、
// カレンダーの「この日の ◯ を全部 ●」（予定→完了・年間計画の印も付く・元に戻せる）。保存する値は 済 のまま。390px ではみ出さない。
// usage: node hozen/tools/bulkdonecheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const m=now.getMonth()+1,fy=fyOf(now.getFullYear(),m),ci=idxOf(m),row=v=>{const r=Array(12).fill('');r[ci]=v;return r};
  S.items=[{id:'a',name:'項目A',cat:S.settings.cats[0]},{id:'b',name:'項目B',cat:S.settings.cats[0]},{id:'c',name:'項目C',cat:S.settings.cats[1]||S.settings.cats[0]},{id:'d',name:'項目D',cat:S.settings.cats[0]},{id:'e',name:'項目E',cat:S.settings.cats[0]}];
  S.marks={[fy]:{a:row('○'),b:row('○'),c:row('○'),d:row('延'),e:row('済')}};
  S.tasks=[{id:'t1',date:TODAY,title:'項目A',status:'予定',kind:'点検',cat:'',time:'',place:'',staff:'',attend:'',result:'',note:''},{id:'t2',date:TODAY,title:'項目B',status:'予定',kind:'点検',cat:'',time:'',place:'',staff:'',attend:'',result:'',note:''},{id:'t3',date:TODAY,title:'項目C',status:'延期',kind:'点検',cat:'',time:'',place:'',staff:'',attend:'',result:'',note:''}];
  V.fy=fy;save();go('year')});await p.waitForTimeout(300);
 const btn=await p.evaluate(()=>{const x=document.querySelector('#yrAllDone');if(!x)return null;const r=x.getBoundingClientRect();return {t:x.textContent,h:r.height,r:r.right,sw:document.documentElement.scrollWidth}});
 if(!btn)bad.push('年間計画に一括ボタンが無い');else{if(!btn.t.includes('3件'))bad.push('件数 '+btn.t);if(btn.h<40||btn.r>390||btn.sw>392)bad.push('ボタンの大きさ・位置 '+JSON.stringify(btn))}
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 const cur=()=>p.evaluate(()=>{const m=now.getMonth()+1,fy=fyOf(now.getFullYear(),m),ci=idxOf(m);return ['a','b','c','d','e'].map(k=>S.marks[fy][k][ci]).join()});
 await p.evaluate(()=>yearAllDone());await p.waitForTimeout(200);
 if(await cur()!=='済,済,済,延,済')bad.push('年間計画の結果 '+await cur());
 const ls=await p.evaluate(()=>{const m=now.getMonth()+1,fy=fyOf(now.getFullYear(),m);return JSON.parse(localStorage.getItem('hospElecSched_v1')).marks[fy].a[idxOf(m)]});if(ls!=='済')bad.push('保存値 '+ls);
 if(await p.evaluate(()=>!!document.querySelector('#yrAllDone')))bad.push('◯ が無いのにボタンが残る');
 await p.evaluate(()=>document.querySelector('#undobar button').click());await p.waitForTimeout(200);
 if(await cur()!=='○,○,○,延,済')bad.push('元に戻した結果 '+await cur());
 // 分類で絞ると表示中の行だけ
 await p.evaluate(()=>{V.yrCat=S.items[0].cat;render()});await p.waitForTimeout(100);
 await p.evaluate(()=>yearAllDone());await p.waitForTimeout(200);
 const r2=await cur();
 if(r2!=='済,済,○,延,済')bad.push('絞り込み中の結果 '+r2);
 // カレンダー
 await p.evaluate(()=>{V.yrCat='';V.sel=TODAY;V.y=now.getFullYear();V.m=now.getMonth()+1;go('month')});await p.waitForTimeout(300);
 const d1=await p.evaluate(()=>{const x=document.querySelector('#dayAllDone');if(!x)return null;const r=x.getBoundingClientRect();return {t:x.textContent,h:r.height,r:r.right,sw:document.documentElement.scrollWidth}});
 if(!d1)bad.push('カレンダーに一括ボタンが無い');else{if(!d1.t.includes('2件'))bad.push('日の件数 '+d1.t);if(d1.h<40||d1.r>390||d1.sw>392)bad.push('日のボタン '+JSON.stringify(d1))}
 await p.evaluate(()=>dayAllDone(TODAY));await p.waitForTimeout(200);
 const t=await p.evaluate(()=>S.tasks.map(x=>x.status).join());if(t!=='完了,完了,延期')bad.push('日の結果 '+t);
 await p.evaluate(()=>document.querySelector('#undobar button').click());await p.waitForTimeout(200);
 const t2=await p.evaluate(()=>S.tasks.map(x=>x.status).join());if(t2!=='予定,予定,延期')bad.push('日を戻した結果 '+t2);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
