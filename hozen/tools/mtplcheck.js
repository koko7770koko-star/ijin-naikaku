// 測定のひな形・保全の設定の確認：390pxで項目名・単位・下限・上限が切れずに入る（入力欄の幅が十分）・数字の欄は数字キーボード・×ボタン44px・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{addGenTpl();go('mtpl');editMtpl('mt_gen')});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#mt_rows .mtrow')];const q=(row,l)=>row.querySelector(`[aria-label="${l}"]`).getBoundingClientRect();
  const r0=rows[0];return{n:rows.length,name:q(r0,'項目名').width,unit:q(r0,'単位').width,lo:q(r0,'下限').width,hi:q(r0,'上限').width,x:q(r0,'この項目を外す'),inm:r0.querySelector('[aria-label="下限"]').inputMode,sw:document.documentElement.scrollWidth}});
 if(!r.n)bad.push('項目が出ない');if(r.name<120)bad.push('項目名の欄が狭い '+r.name);if(r.lo<80||r.hi<80)bad.push('下限・上限の欄が狭い '+r.lo+'/'+r.hi);
 if(r.x.width<44||r.x.height<44)bad.push('×が小さい');if(r.inm!=='decimal')bad.push('下限が数字キーボードでない');if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 // 値を入れて保存すると、保存の形（rows の項目名）は今までどおり
 await p.fill('#mt_rows .mtrow:first-child [aria-label="下限"]','190');await p.fill('#mt_rows .mtrow:first-child [aria-label="上限"]','210');await p.press('#mt_rows .mtrow:first-child [aria-label="上限"]','Tab');await p.evaluate(()=>saveMtpl('mt_gen'));await p.waitForTimeout(200);
 const t=await p.evaluate(()=>tplById('mt_gen').rows[0]);if(t.min!==190||t.max!==210||Object.keys(t).sort().join()!=='ck,max,min,name,unit')bad.push('保存の形が変わった '+JSON.stringify(t));
 await p.evaluate(()=>go('mset'));await p.waitForTimeout(200);if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('保全の設定がはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
