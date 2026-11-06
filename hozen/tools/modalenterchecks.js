// 異常・作業指示・予定・設備・点検項目・修理の記録・場所・棟と階・作業標準・図面・入出庫・校正・貸出の窓：1 行の欄で Enter を押すと次の欄へ移り、最後の欄・複数行の欄では保存しない。入れた値は残り、390px で横にはみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 for(const [name,open,pre,first,one] of [['異常','editIssue(null)','is_','is_title'],['作業指示','editWork(null)','wk_','wk_title'],['予定','editTask(null,TODAY)','t_','t_title'],['設備','editEquip()','e_','e_name'],['保全計画','editPlan()','pl_','pl_title'],['予備品','editPart()','pt_','pt_name'],['工具','editTool()','tl_','tl_name'],['予算','editBudget(null,2026)','bg_','bg_name'],['技術資料','editLib()','lb_','lb_title'],['点検項目','editItem()','i_','i_name'],['場所','editLoc()','lo_','lo_name'],['棟と階','bldgWizard()','bw_','bw_names'],['修理の記録','((S.equipment||[]).length||S.equipment.push({id:\'eqMEN\',name:\'確認用\',repairs:[]}),editRepair(S.equipment[0].id))','r_','r_vendor'],
   ['作業標準','editStd()','sd_','sd_name'],['図面','editDwg()','dw_','dw_name'],
   ['入出庫','((S.parts||[]).length||S.parts.push({id:\'ptMEN\',name:\'確認用\',code:\'\',spec:\'\',place:\'\',unit:\'個\',qty:5,min:\'\',equipIds:[],moves:[]}),stockMove(S.parts[0].id,\'出庫\'))','sm_','sm_n'],
   ['校正','((S.tools||[]).length||S.tools.push({id:\'tlMEN\',name:\'確認用\',loans:[],calHist:[],calDue:\'\',calCycleM:\'\'}),toolCal(S.tools[0].id))','tc_','tc_by'],
   ['貸出','((S.tools||[]).length||S.tools.push({id:\'tlMEN\',name:\'確認用\',loans:[],calHist:[],calDue:\'\',calCycleM:\'\'}),toolLoan(S.tools[0].id))','tn_','tn_to',1]]){
  await p.evaluate(open);await p.waitForSelector('#'+first,{timeout:5000});await p.waitForTimeout(300);
  const n0=await p.evaluate(()=>[S.issues.length,(S.works||[]).length,S.tasks.length,(S.equipment||[]).length,(S.plans||[]).length,(S.parts||[]).length,(S.tools||[]).length,S.items.length,(S.equipment||[]).reduce((n,e)=>n+((e.repairs||[]).length),0),(S.locs||[]).length,(S.budget||[]).length,(S.library||[]).length].join());
  const isNum=await p.evaluate(f=>document.getElementById(f).type==='number',first),word=isNum?'3':'テスト';await p.focus('#'+first);await p.keyboard.type(word);
  const seq=[first];
  for(let i=0;i<30;i++){await p.keyboard.press('Enter');await p.waitForTimeout(40);
   const cur=await p.evaluate(()=>{const e=document.activeElement;return e&&e.id||''});
   if(!cur||cur===seq[seq.length-1]||/^(textarea)$/i.test(cur))break;seq.push(cur);
   const hid=await p.evaluate(()=>{const e=document.activeElement,f=document.querySelector('#modal .mfoot');if(!e||!f)return 0;const r=e.getBoundingClientRect(),q=f.getBoundingClientRect();return r.bottom>q.top+1&&r.top<q.bottom?Math.round(r.bottom-q.top):0});if(hid)bad.push(name+'：Enter で移った欄 '+cur+' が下の固定の帯に隠れる '+hid+'px');
   const tag=await p.evaluate(()=>document.activeElement.tagName);if(tag==='TEXTAREA')break;}
  if(seq.length<2&&!one)bad.push(name+'：Enter で次の欄に進まない');
  if(one&&await p.evaluate(f=>document.getElementById(f).getAttribute('enterkeyhint'),first)!=='done')bad.push(name+'：1つだけの欄に enterkeyhint=done が無い（Enter の扱いが入っていない）');
  const tag=await p.evaluate(()=>document.activeElement.tagName);
  if(tag==='INPUT')bad.push(name+'：最後の見える 1 行の欄の Enter で止まる（たたんだ欄へ移ろうとして焦点が外れない）');
  if(!await p.evaluate(()=>!!document.querySelector('#modal.on,#mask.on')))bad.push(name+'：Enter で窓が閉じた（保存した？）');
  const n1=await p.evaluate(()=>[S.issues.length,(S.works||[]).length,S.tasks.length,(S.equipment||[]).length,(S.plans||[]).length,(S.parts||[]).length,(S.tools||[]).length,S.items.length,(S.equipment||[]).reduce((n,e)=>n+((e.repairs||[]).length),0),(S.locs||[]).length,(S.budget||[]).length,(S.library||[]).length].join());if(n0!==n1)bad.push(name+'：Enter で保存された');
  const v=await p.evaluate(f=>document.getElementById(f).value,first);if(v!==word)bad.push(name+'：入れた値が残らない');
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(name+'：横にはみ出す '+sw);
  console.log(name,seq.join('>'),tag);
  await p.evaluate(()=>{try{closeModal(true)}catch(e){}});await p.waitForTimeout(200);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
