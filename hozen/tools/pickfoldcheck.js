// 設備を選ぶ欄の絞り込み（不具合の入力欄 equipPickFilter・場所の設備 le_q）で全角/半角・大小・カタカナ/ひらがなの違いを無視する（選んだ値・保存の形は変えない）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.equipment=[];for(let i=0;i<40;i++)S.equipment.push({id:'e'+i,code:'X'+i,name:(i===7?'VCB 主遮断器':i===9?'トランス 1号':'設備')+i,kind:'その他'});
  S.locs=[{id:'a',name:'A棟',type:'建屋',parent:'',note:'',pos:{}}];go('issues');editIssue(null,{})});
 await p.waitForTimeout(400);await p.evaluate(()=>{const m=document.querySelector('#is_more');if(m)m.open=true});
 const opts=async v=>{await p.fill('.eqfind',v);await p.waitForTimeout(150);return p.evaluate(()=>[...document.querySelectorAll('#is_equip option')].map(o=>o.textContent).join('|'))};
 for(const [q,t] of [['ｖｃｂ','VCB 主遮断器'],['vcb','VCB 主遮断器'],['とらんす','トランス 1号'],['ﾄﾗﾝｽ','トランス 1号']]){const s=await opts(q);if(!s.includes(t))bad.push('不具合の設備選び：'+q+' で「'+t+'」が候補に出ない');}
 await p.fill('.eqfind','とらんす');await p.waitForTimeout(150);await p.evaluate(()=>{const s=document.querySelector('#is_equip');if([...s.options].some(o=>o.value==='e9'))s.value='e9'});await p.fill('.eqfind','ｖｃｂ');await p.waitForTimeout(150);
 if(await p.evaluate(()=>document.querySelector('#is_equip').value)!=='e9')bad.push('選んだ設備が絞り込みで外れた');
 await p.evaluate(()=>{closeModal&&closeModal();locEquip('a')});await p.waitForTimeout(300);
 if(!await p.$('#le_q'))bad.push('場所の設備：探す欄が出ない');else{
  const vis=async v=>{await p.fill('#le_q',v);await p.waitForTimeout(100);return p.evaluate(()=>[...document.querySelectorAll('#le_list label')].filter(x=>x.style.display!=='none').map(x=>x.textContent).join('|'))};
  for(const [q,t] of [['ＶＣＢ','VCB 主遮断器'],['とらんす','トランス 1号']]){const s=await vis(q);if(!s.includes(t))bad.push('場所の設備：'+q+' で「'+t+'」が出ない');}
  if((await vis('とらんす')).includes('VCB'))bad.push('場所の設備：関係ない設備まで出る');}
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
