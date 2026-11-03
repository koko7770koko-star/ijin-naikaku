// 設備台帳の並べ替えの確認：「場所順」「最後の点検が古い順」が選べて順が変わり、保存データ（S.equipment の並び・eqSort）は変わらず、390pxではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const names=()=>p.evaluate(()=>[...document.querySelectorAll('#app .item .ti')].map(e=>e.firstChild.textContent.trim()));
 await p.evaluate(()=>{
  S.equipment=[{id:'q1',code:'E-1',name:'設備ア',place:'C棟',kind:'',status:'稼働',repairs:[]},{id:'q2',code:'E-2',name:'設備イ',place:'A棟',kind:'',status:'稼働',repairs:[]},{id:'q3',code:'E-3',name:'設備ウ',place:'',kind:'',status:'稼働',repairs:[]},{id:'q4',code:'E-4',name:'設備エ',place:'B棟',kind:'',status:'稼働',repairs:[]}];
  S.tasks=(S.tasks||[]).filter(t=>!/^q/.test(t.equipId||''));
  S.tasks.push({id:'qt1',title:'点検ア',date:'2026-05-01',status:'完了',equipId:'q1'},{id:'qt2',title:'点検イ',date:'2026-09-01',status:'完了',equipId:'q2'},{id:'qt4',title:'点検エ',date:'2026-01-10',status:'完了',equipId:'q4'});
  window.__before=JSON.stringify(S.equipment);V.eqSort=undefined;V.eqQ='';V.eqLoc='';go('equip')});await p.waitForTimeout(300);
 const opts=await p.evaluate(()=>[...document.querySelectorAll('select[aria-label="並び順"] option')].map(o=>o.textContent));
 for(const t of ['場所順','最後の点検が古い順'])if(!opts.includes(t))bad.push('並び順に「'+t+'」がない：'+opts.join(','));
 const sel='select[aria-label="並び順"]';
 await p.selectOption(sel,'loc');await p.waitForTimeout(200);
 let n=(await names()).join(',');if(n!=='設備イ,設備エ,設備ア,設備ウ')bad.push('場所順が違う：'+n);
 await p.selectOption(sel,'last');await p.waitForTimeout(200);
 n=(await names()).join(',');if(n!=='設備ウ,設備エ,設備ア,設備イ')bad.push('最後の点検が古い順が違う：'+n);
 const pl=await p.evaluate(()=>[...document.querySelectorAll('#app .item .pill')].map(e=>e.textContent).filter(t=>t.startsWith('最後の点検')).join('|'));if(pl!=='最後の点検 記録なし|最後の点検 2026/01/10|最後の点検 2026/05/01|最後の点検 2026/09/01')bad.push('最後の点検日の表示が違う：'+pl);
 const h=await p.evaluate(s=>document.querySelector(s).getBoundingClientRect().height,sel);if(h<40)bad.push('並び順の選択が小さい：'+h);
 if(await p.evaluate(()=>JSON.stringify(S.equipment)!==window.__before||JSON.stringify(S).includes('eqSort')))bad.push('保存データが変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('はみ出す');
 await p.selectOption(sel,'code');await p.waitForTimeout(200);
 n=(await names()).join(',');if(n!=='設備ア,設備イ,設備ウ,設備エ')bad.push('ID順に戻らない：'+n);
 if(process.argv[2]){await p.selectOption(sel,'last');await p.waitForTimeout(200);await p.screenshot({path:process.argv[2]})}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
