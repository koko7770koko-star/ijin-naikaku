// 異常の記録：設備を選ぶと、その設備の未完了の異常（押すと開く）と過去1年の件数が1行出る／設備なしでは出ない／記録が無ければ「まだありません」／
// 自分自身（編集中の案件）は数えない／390pxではみ出さない。表示だけで保存の形は変えない。
// usage: node hozen/tools/issuerecurcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=(id,eq,date,status,title)=>({id,date,title,place:'',detail:'',status,action:'',closed:status==='完了'?date:'',photos:[],equipId:eq,log:[]});
  S.equipment=[{id:'e1',code:'E-1',name:'分電盤A',kind:'',status:'稼働',photos:[],docs:[],repairs:[],health:[]},{id:'e2',code:'E-2',name:'分電盤B',kind:'',status:'稼働',photos:[],docs:[],repairs:[],health:[]}];
  S.issues=[mk('i1','e1',addD(TODAY,-5),'対応中','球切れ'),mk('i2','e1',addD(TODAY,-100),'完了','異音'),mk('i3','e1',addD(TODAY,-500),'完了','古い件')];save();editIssue()});await p.waitForTimeout(500);
 const txt=()=>p.evaluate(()=>document.getElementById('is_recur')?document.getElementById('is_recur').textContent.replace(/\s+/g,' ').trim():null);
 if(await txt()!=='')bad.push('設備なしで出ている '+await txt());
 const pick=v=>p.evaluate(v=>{const s=document.getElementById('is_equip');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))},v);
 await pick('e1');let t=await txt();if(!t.includes('未完了 1件：球切れ')||!t.includes('過去1年の異常：2件'))bad.push('e1 '+t);
 await pick('e2');t=await txt();if(!t.includes('まだありません'))bad.push('e2 '+t);
 await pick('e1');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 const h=await p.evaluate(()=>document.querySelector('#is_recur a').getBoundingClientRect().height);if(h<44)bad.push('リンクの高さ '+h);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>document.querySelector('#is_recur a').click());await p.waitForTimeout(500);
 const opened=await p.evaluate(()=>({t:document.getElementById('is_title')&&document.getElementById('is_title').value,h:document.querySelector('#modal h3').textContent}));
 if(opened.t!=='球切れ'||!opened.h.includes('異常案件'))bad.push('押しても開かない '+JSON.stringify(opened));
 // 編集中の案件自身は数えない：i1 を開くと e1 の未完了は他に無い
 const t2=await txt();if(t2&&t2.includes('未完了'))bad.push('自分を数えている '+t2);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
