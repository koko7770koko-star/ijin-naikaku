// 作業標準の検索欄：Enter や「探す」を押さなくても、打つと絞れる（350ms 後）。入力が消えない・フォーカスが外れない・
// 日本語の変換中は描画しない・空にすると全部に戻る・Enter でもすぐ絞れる。記録は変えない。通信は止める。（hz-stds-live-search）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{S.stds=[...Array(12)].map((_,i)=>({id:'sd'+i,name:(i<3?'停電手順':'点検手順')+(i+1),docNo:'DOC-'+String(i+1).padStart(3,'0'),ver:'1',kinds:['点検'],pre:[{text:'確認',req:true}],post:[{text:'確認',req:true}],note:'',approvedBy:'',approvedDate:'',hist:[]}));save();V.stdQ='';go('stds');return JSON.stringify(S.stds)});
 await p.waitForTimeout(300);
 const st=()=>p.evaluate(()=>{const i=document.getElementById('std_q');return {items:document.querySelectorAll('#app .item').length,val:i&&i.value,foc:document.activeElement===i,q:V.stdQ||'',sw:document.documentElement.scrollWidth}});
 const all=(await st()).items;ok(all===12,'初めの件数が 12 でない '+all);
 // 打つだけで絞れる
 await p.click('#std_q');await p.keyboard.type('停電');
 await p.waitForFunction(()=>(V.stdQ||'')==='停電',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(100);
 let r=await st();ok(r.items===3,'打っても絞れない '+r.items);ok(r.val==='停電','入力が消えた '+r.val);ok(r.foc,'描画の後に欄からフォーカスが外れた');ok(r.sw<=392,'はみ出す '+r.sw);
 // 続けて打っても欄が消えない（カーソルが末尾）
 await p.keyboard.type('手順1');await p.waitForFunction(()=>(V.stdQ||'')==='停電手順1',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(100);
 r=await st();ok(r.items===1,'続けて打つと絞れない '+r.items);ok(r.val==='停電手順1','続けて打つと入力が崩れる '+r.val);
 // 空にすると全部に戻る
 await p.fill('#std_q','');await p.waitForFunction(()=>(V.stdQ||'')==='',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(450);
 r=await st();ok(r.items===12,'空にしても全部に戻らない '+r.items);ok(r.foc,'空にした後フォーカスが外れた');
 // 変換中は描画しない
 await p.evaluate(()=>{const i=document.getElementById('std_q');i.dispatchEvent(new CompositionEvent('compositionstart'));i.value='てい';i.dispatchEvent(new Event('input'))});
 await p.waitForTimeout(600);r=await st();ok(r.q==='','変換中に描画された '+r.q);ok(r.val==='てい','変換中の入力が消えた '+r.val);
 await p.evaluate(()=>{const i=document.getElementById('std_q');i.value='停電';i.dispatchEvent(new CompositionEvent('compositionend'))});
 await p.waitForFunction(()=>(V.stdQ||'')==='停電',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(100);r=await st();ok(r.items===3,'変換の後に絞れない '+r.items);
 // Enter ですぐ絞れる
 await p.fill('#std_q','点検手順12');await p.press('#std_q','Enter');await p.waitForTimeout(50);r=await st();ok(r.q==='点検手順12'&&r.items===1,'Enter ですぐ絞れない '+r.q+' '+r.items);
 await p.waitForTimeout(500);
 ok(await p.evaluate(()=>JSON.stringify(S.stds))===before,'記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
