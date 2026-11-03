// 場所の「⋯」から設備を結びつける確認：盤の「⋯」→「設備を結びつける」で設備台帳の設備を選ぶと equipment.locId だけが変わる。
//  「＋ 新しい設備をここに登録」で場所が入った状態の設備の追加が開く。ほかの場所にある物は「今：…」と出て、移すときは確かめが出る（やめると何も変わらない）。外すと「場所未設定」。元に戻せる。390px ではみ出さない。
// usage: node hozen/tools/locequipcheck.js [スクリーンショットの出力先フォルダ]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let accept=false;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>(accept?d.accept():d.dismiss()).catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
 const eq=(id,code,name,locId)=>({id,code,name,locId,status:'稼働',place:'',kind:'',importance:''});
 await p.evaluate(([L,E])=>{S.locs=L;S.equipment=E;go('locs');locFold(true)},[[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r')],
  [eq('e1','G-1','非常用発電機','') ,eq('e2','T-2','変圧器','y'),eq('e3','B-3','遮断器','x')]]);await p.waitForTimeout(150);
 const loc=()=>p.evaluate(()=>S.equipment.map(e=>e.id+':'+e.locId).join());
 await p.click('[aria-label="動力盤-1の操作"]');await p.click('#modal button:has-text("設備を結びつける")');await p.waitForSelector('#le_list');
 const t=await p.evaluate(()=>document.querySelector('#le_list').innerText);
 if(!/今：A棟 › 1階 › 第1電気室 › 動力盤-2/.test(t)||!/場所未設定/.test(t)||!/ここ/.test(t))bad.push('今の場所が出ない '+t.replace(/\n/g,' '));
 await p.check('#le_list input[value="e1"]');await p.check('#le_list input[value="e2"]');await p.uncheck('#le_list input[value="e3"]');
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'eq1-pick.png')})}
 // ほかの場所から移す確かめで「やめる」→ 何も変わらない
 const l0=await loc();await p.click('#modal button:has-text("決める")');await p.waitForTimeout(150);
 if(await loc()!==l0)bad.push('確かめで やめても変わった');
 accept=true;await p.click('#modal button:has-text("決める")');await p.waitForTimeout(150);
 if(await loc()!=='e1:x,e2:x,e3:')bad.push('結びつけ・外すが違う '+(await loc()));
 const m=await p.evaluate(()=>[...document.querySelectorAll('.locn[data-loc="x"] .meta')][0].textContent);if(!/設備 2台/.test(m))bad.push('木の台数が変わらない '+m);
 await p.click('#undobar button');await p.waitForTimeout(150);
 if(await loc()!==l0)bad.push('元に戻せない '+(await loc()));
 // ここに新しい設備を登録：場所（階層）と設置場所の文字が最初から入っている
 await p.evaluate(()=>{closeModal(true);go('locs');locEquip('y')});await p.waitForSelector('#le_list');
 await p.click('#modal button:has-text("新しい設備をここに登録")');await p.waitForSelector('#e_name');await p.waitForTimeout(150);
 const pre=await p.evaluate(()=>({loc:document.querySelector('#e_loc').value,place:document.querySelector('#e_place').value}));
 if(pre.loc!=='y'||pre.place!=='A棟 › 1階 › 第1電気室 › 動力盤-2')bad.push('新しい設備に場所が入らない '+JSON.stringify(pre));
 await p.fill('#e_name','確認用分電盤');await p.click('#modal button:text-is("保存")');await p.waitForTimeout(200);
 const ne=await p.evaluate(()=>{const e=S.equipment.find(x=>x.name==='確認用分電盤');return e?e.locId:'なし'});if(ne!=='y')bad.push('新しい設備がここに結びつかない '+ne);
 // 次に開く「設備の追加」には場所が残らない
 await p.evaluate(()=>{closeModal(true);editEquip()});await p.waitForSelector('#e_name');await p.waitForTimeout(150);
 if(await p.evaluate(()=>document.querySelector('#e_loc').value))bad.push('次の「設備の追加」に前の場所が残る');
 await p.evaluate(()=>closeModal(true));
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
