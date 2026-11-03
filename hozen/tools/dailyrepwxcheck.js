// 日報：天気につながらない（通信なし・天気の設定は入っている・保存した天気も無い）ときでも、日報の画面と印刷に「読み込み中」「取得中」「undefined」「NaN」が出ず、
// 空の天気の欄も出ない。天気や特記は「特記事項」に手で入れられ、紙（PDF）に載る。390pxで横にはみ出さない。通信は止める（すべて失敗にする）。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.settings.wx={on:true,lat:35,lng:135,pref:'',label:'○○総合病院'};localStorage.removeItem(WX_KEY);save();go('dailyRep',{day:TODAY})});await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>({t:document.querySelector('#app').innerText,sw:document.documentElement.scrollWidth,iw:innerWidth,ta:!!document.querySelector('#app textarea')}));
 ok(!/読み込み中|取得中|undefined|NaN|null/.test(r.t),'日報に読み込み中・未定義の表示が出る '+(r.t.match(/読み込み中|取得中|undefined|NaN|null/)||[''])[0]);ok(r.sw<=r.iw,'横にはみ出す');ok(r.ta,'特記事項の入力欄が無い');
 // 手で天気を入れる → 保存され、日報（紙）に載る
 await p.evaluate(()=>{setDnote(TODAY,'天気：雨。風 強め')});await p.waitForTimeout(300);
 const rep=await p.evaluate(()=>[...document.querySelectorAll('.rep .sec')].filter(x=>/特記事項/.test(x.textContent)).map(x=>x.nextElementSibling&&x.nextElementSibling.innerText)[0]||'');
 ok(/天気：雨/.test(rep),'手で入れた天気が日報に載らない '+rep);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;ok(pages>=1&&pages<=2,'PDFのページ数 '+pages);
 // 天気の取得を直接呼んでも落ちない（通信なしは失敗として扱う）
 const fe=await p.evaluate(async()=>{try{await wxFetch(true);return 'ok'}catch(e){return 'throw '+e.message}});ok(fe==='ok','天気の取得が通信なしで例外になる '+fe);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
