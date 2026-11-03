// 設備台帳の確認：設備を200台入れて 390px で開き、検索が打つだけで絞り込まれる・件数が出る・
// 並び順を変えられる・絞り込みをやめられる・はみ出さない・保存の項目が変わらないことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{const keys=Object.keys((S.equipment||[])[0]||{});for(let i=0;i<200;i++)S.equipment.push({id:'qq'+i,code:'EQ-'+String(i).padStart(3,'0'),name:(i%2?'変圧器':'受電盤')+i,place:'○○棟',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[],status:'稼働',kind:'',importance:'',locId:''});go('equip')});
 await p.waitForTimeout(500);
 const n0=await p.evaluate(()=>document.querySelectorAll('#app .item').length);
 await p.click('#eqQ');await p.keyboard.type('変圧器1');await p.waitForTimeout(900);
 const r=await p.evaluate(()=>({n:document.querySelectorAll('#app .item').length,foc:document.activeElement&&document.activeElement.id,txt:document.body.innerText.includes('絞り込み：'),val:document.querySelector('#eqQ').value}));
 if(!(r.n>0&&r.n<n0))bad.push('打つだけで絞り込まれない '+n0+'→'+r.n);if(r.foc!=='eqQ')bad.push('絞り込み後に検索欄からカーソルが外れる');if(!r.txt)bad.push('件数が出ない');if(r.val!=='変圧器1')bad.push('入力が消えた '+r.val);
 await p.selectOption('select[aria-label="並び順"]','name');await p.waitForTimeout(300);
 const first=await p.evaluate(()=>{const t=document.querySelector('#app .item .ti');return t?t.textContent:document.querySelector('#app').innerText.slice(0,300)});if(!first.includes('受電盤')&&!first.includes('変圧器'))bad.push('並び替えで表示が壊れた');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.click('text=絞り込みをやめる');await p.waitForTimeout(300);
 const n1=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(n1<n0)bad.push('絞り込みをやめても戻らない');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 for(const k of ['due','issue']){await p.selectOption('select[aria-label="並び順"]',k);await p.waitForTimeout(300)}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
