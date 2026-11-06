// 窓に入れかけてから「キャンセル」・窓の外・スマホの戻るで閉じたとき、「入力中の内容を保存せずに閉じますか？」が出る（何も入れていなければ出ない）。
// 保存の形は変えない。usage: node hozen/tools/modaldirtycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const PARTS="((S.parts||[]).length||S.parts.push({id:'ptMEN',name:'確認用',code:'',spec:'',place:'',unit:'個',qty:5,min:'',equipIds:[],moves:[]}),";
const TOOLS="((S.tools||[]).length||S.tools.push({id:'tlMEN',name:'確認用',loans:[],calHist:[],calDue:'',calCycleM:''}),";
const WINS=[['異常','editIssue(null)','is_title'],['作業指示','editWork(null)','wk_title'],['予定','editTask(null,TODAY)','t_title'],['設備','editEquip()','e_name'],['作業標準','editStd()','sd_name'],['図面','editDwg()','dw_name'],
 ['入出庫',PARTS+"stockMove(S.parts[0].id,'出庫'))",'sm_n'],['校正',TOOLS+"toolCal(S.tools[0].id))",'tc_by'],['貸出',TOOLS+"toolLoan(S.tools[0].id))",'tn_to']];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 let asked=0;p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>{asked++;d.dismiss().catch(()=>{})});
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const isOpen=()=>p.evaluate(()=>document.querySelector('#mask').classList.contains('on'));
 const ways=[['外側',async()=>{await p.evaluate(()=>document.querySelector('#mask').click())}],['戻る',async()=>{await p.evaluate(()=>history.back());await p.waitForTimeout(250)}],
  ['キャンセル',async()=>{await p.evaluate(()=>{const b=[...document.querySelectorAll('#modal button')].find(x=>/キャンセル|閉じる/.test(x.textContent));if(b)b.click();else closeModal()})}]];
 for(const [name,open,first] of WINS){
  for(const [wn,fn] of ways){
   for(const dirty of [false,true]){
    await p.evaluate(open);await p.waitForSelector('#'+first,{timeout:5000});await p.waitForTimeout(150);
    if(dirty){const isNum=await p.evaluate(f=>document.getElementById(f).type==='number',first);await p.fill('#'+first,isNum?'3':'入力途中')}
    asked=0;await fn();await p.waitForTimeout(150);
    const open2=await isOpen();
    if(dirty&&!(asked===1&&open2))bad.push(`${name}：入れた後に${wn}で閉じる→確かめ ${asked} 回・窓 ${open2?'残る':'閉じた'}（確かめを出して窓は残るはず）`);
    if(!dirty&&!(asked===0&&!open2))bad.push(`${name}：何も入れずに${wn}で閉じる→確かめ ${asked} 回・窓 ${open2?'残る':'閉じていない'}（確かめ無しで閉じるはず）`);
    await p.evaluate(()=>{try{closeModal(true)}catch(e){}});await p.waitForTimeout(100);
   }}
  console.log(name,'済');
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
