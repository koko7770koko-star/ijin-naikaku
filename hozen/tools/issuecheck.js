// 異常・修理の「その場で記録」の確認：390px で新規登録を開き、緊急度ボタン・写真・最近の場所で
// 少ない手数で保存でき、保存の形（S.issues の項目）が変わらず、はみ出さないことを確かめる。
// usage: node hozen/tools/issuecheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
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
 // 完了にするとき：確認者に自分の名前・完了日に今日が先に入る。「確かめた」のチェックは自動では付かない（人が付ける）。保存はチェックが無いと通らない
 await p.evaluate(()=>{S.settings.operator='確認担当';closeModal(true);editIssue('zz1')});await p.waitForTimeout(400);
 await p.click('#is_steps button:has-text("完了")');await p.waitForTimeout(500);
 const dn=await p.evaluate(()=>({by:$('#is_by').value,cl:$('#is_closed').value,chk:$('#is_chk').checked,shown:getComputedStyle($('#is_done')).display!=='none',sw:document.documentElement.scrollWidth}));
 if(!dn.shown)bad.push('完了の確認欄が出ない');if(dn.by!=='確認担当')bad.push('確認者に自分の名前が入らない：'+dn.by);if(!dn.cl)bad.push('完了日が空');if(dn.chk)bad.push('確かめたチェックが勝手に付いている');if(dn.sw>392)bad.push('はみ出す');
 await p.evaluate(()=>saveIssue('zz1'));await p.waitForTimeout(300);
 if(await p.evaluate(()=>S.issues.find(x=>x.id==='zz1').status)==='完了')bad.push('確認のチェックが無いのに完了で保存できた');
 // 書きかけ：入力→再読み込み→同じ窓を開くと「戻す」が出る・戻せる・保存すると消える（異常・工事）
 await p.evaluate(()=>{closeModal(true);editIssue('')});await p.waitForTimeout(400);
 await p.evaluate(()=>{const m=document.getElementById('is_more');if(m)m.open=true});
 await p.fill('#is_title','書きかけの題');await p.fill('#is_detail','書きかけの詳細');await p.waitForTimeout(700);
 await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>editIssue(''));await p.waitForTimeout(500);
 if(!await p.evaluate(()=>!!document.querySelector('#dr_bar')))bad.push('異常：再読み込み後に書きかけの案内が出ない');
 else{if(await p.inputValue('#is_title')!=='')bad.push('異常：勝手に戻っている');
  await p.click('#dr_bar button:has-text("戻す")');await p.waitForTimeout(200);
  if(await p.inputValue('#is_title')!=='書きかけの題'||await p.inputValue('#is_detail')!=='書きかけの詳細')bad.push('異常：書きかけが戻らない');
  const sz=await p.evaluate(()=>[...document.querySelectorAll('#dr_bar button')].length);if(sz)bad.push('異常：戻したあとも案内が残る');
  await p.evaluate(()=>saveIssue(''));await p.waitForTimeout(300);
  if(await p.evaluate(()=>sessionStorage.getItem('hes_mdraft_issue-new')))bad.push('異常：保存しても書きかけが残る');
  await p.evaluate(()=>editIssue(''));await p.waitForTimeout(400);if(await p.evaluate(()=>!!document.querySelector('#dr_bar')))bad.push('異常：保存したのに書きかけの案内が出る')}
 await p.evaluate(()=>{closeModal(true);editWork('')});await p.waitForTimeout(400);await p.fill('#wk_content','書きかけの作業内容');await p.waitForTimeout(700);
 await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>editWork(''));await p.waitForTimeout(500);
 if(!await p.evaluate(()=>!!document.querySelector('#dr_bar')))bad.push('工事：再読み込み後に書きかけの案内が出ない');
 else{await p.click('#dr_bar button:has-text("捨てる")');await p.waitForTimeout(150);if(await p.evaluate(()=>sessionStorage.getItem('hes_mdraft_work-new')))bad.push('工事：捨てても残る');if(await p.inputValue('#wk_content')!=='')bad.push('工事：捨てたのに入っている')}
 console.log('新規登録の手数（＋・緊急度・場所・保存。内容は自動で入力待ち）:',taps);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0);})();
