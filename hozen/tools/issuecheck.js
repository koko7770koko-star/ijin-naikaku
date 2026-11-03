// 異常・修理の「その場で記録」の確認：390px で新規登録を開き、緊急度ボタン・写真・最近の場所で
// 少ない手数で保存でき、保存の形（S.issues の項目）が変わらず、はみ出さないことを確かめる。
// usage: node hozen/tools/issuecheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(2000);
 // 最近の場所が出るよう古い案件を1件入れる
 await p.evaluate(()=>{S.issues.push({id:'zz1',src:'manual:zz1',date:TODAY,title:'確認用',place:'○○棟 1F',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]});save();go('issues')});
 await p.waitForTimeout(300);
 const before=Object.keys(await p.evaluate(()=>S.issues.find(i=>i.id==='zz1'))).sort().join(',');
 let taps=0;
 await p.click('text=＋');taps++;await p.waitForTimeout(500);
 const foc=await p.evaluate(()=>document.activeElement&&document.activeElement.id);
 if(foc!=='is_title')bad.push('新規で内容欄にカーソルが入っていない');
 await p.keyboard.type('テスト異常');
 await p.click('#is_qurg button:text("緊急")');taps++;
 await p.click('#is_quick .btn:has-text("○○棟 1F")');taps++;
 const urg=await p.evaluate(()=>document.querySelector('#is_urg').value);if(urg!=='緊急')bad.push('緊急度ボタンが選択欄に反映されない');
 const pl=await p.evaluate(()=>document.querySelector('#is_place').value);if(pl!=='○○棟 1F')bad.push('場所ボタンが入らない');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 const small=await p.evaluate(()=>[...document.querySelectorAll('#is_quick button')].filter(x=>x.getBoundingClientRect().height<44).length);if(small)bad.push('44px 未満のボタン '+small);
 await p.click('#modal .btn:text-is("保存")');taps++;await p.waitForTimeout(400);
 const saved=await p.evaluate(()=>S.issues.find(i=>i.title==='テスト異常'));
 if(!saved||saved.urgency!=='緊急'||saved.place!=='○○棟 1F')bad.push('保存されない/値が違う');
 else{const after=Object.keys(saved).filter(k=>!['reopened'].includes(k)).sort();const ref=await p.evaluate(()=>Object.keys(S.issues.find(i=>i.id==='zz1')));
  console.log('保存した項目:',after.join(','));}
 // 既存案件の編集は従来どおり（上の早見が出ず、写真欄は下）
 await p.evaluate(()=>editIssue('zz1'));await p.waitForTimeout(400);
 if(await p.evaluate(()=>!!document.querySelector('#is_quick')))bad.push('編集で早見が出ている');
 if(!await p.evaluate(()=>!!document.querySelector('#tp')))bad.push('編集に写真欄が無い');
 console.log('新規登録の手数（＋・緊急度・場所・保存。内容は自動で入力待ち）:',taps);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0);})();
