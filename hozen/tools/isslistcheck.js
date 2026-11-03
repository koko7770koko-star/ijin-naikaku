// 異常・修理の一覧の確認：長い題の案件を入れて 390px で開き、下のボタン列（CSV・故障分析・過去の検索）が
// 44px 以上で文字が切れず、画面の幅に収まり、エラーが無いことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.issues.push({id:'a1',src:'m:a1',date:addD(TODAY,-5),title:'○○棟3階 電灯盤の端子部に発熱の兆候があり温度が通常より高い状態が続いている',place:'○○棟 3F',detail:'',status:'対応中',action:'',closed:'',photos:[],equipId:'',urgency:'緊急',log:[]});save();go('issues')});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#app .row button')].filter(x=>/CSV|故障分析|過去の/.test(x.textContent));return {n:bs.length,minH:Math.min(...bs.map(x=>x.getBoundingClientRect().height)),cut:bs.some(x=>x.scrollWidth>x.clientWidth+1||x.getBoundingClientRect().right>390),sw:document.documentElement.scrollWidth}});
 if(r.n!==3)bad.push('ボタン列が3つでない '+r.n);if(r.minH<44)bad.push('ボタンが小さい '+r.minH);if(r.cut)bad.push('文字が切れる/はみ出す');if(r.sw>392)bad.push('横にはみ出す');
 // 「すべて」で見たとき、完了していない案件が先、完了済みは後ろ（緊急度より先に見る）
 await p.evaluate(()=>{S.issues.push({id:'d1',src:'m:d1',date:addD(TODAY,-1),title:'完了済みの緊急',place:'',detail:'',status:'完了',action:'',closed:TODAY,photos:[],equipId:'',urgency:'緊急'},{id:'o1',src:'m:o1',date:addD(TODAY,-9),title:'未完了の低',place:'',detail:'',status:'未対応',action:'',closed:'',photos:[],equipId:'',urgency:'低'});V.isF='all';V.isQ='';render()});await p.waitForTimeout(300);
 const ord=await p.evaluate(()=>{const t=[...document.querySelectorAll('#app .item')].map(x=>x.innerText);return {o:t.findIndex(x=>x.includes('未完了の低')),d:t.findIndex(x=>x.includes('完了済みの緊急'))}});if(!(ord.o>=0&&ord.d>=0&&ord.o<ord.d))bad.push('すべて表示で完了済みが未完了より先に出る '+JSON.stringify(ord));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
