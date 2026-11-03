// 場所を選ぶ欄：A〜F棟×各階10×盤のとき、棟ごとの見出し（optgroup）で並び、選んだ場所が「最近使った場所」として先頭に出る。
// 選んだ値は今までどおり locId。選択中の印は本体の1つだけ。保存の形は変えない。設備の編集窓が 390px ではみ出さない。
// usage: node hozen/tools/locpickcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});const L=[];'ABCDEF'.split('').forEach(x=>{L.push(mk('b'+x,x+'棟','建屋',''));for(let f=1;f<=10;f++){L.push(mk('f'+x+f,f+'F','階','b'+x));L.push(mk('p'+x+f,'盤'+f,'盤','f'+x+f))}});S.locs=L;
  S.equipment=[{id:'e1',code:'E-1',name:'設備1',kind:'',status:'稼働',locId:'fC3',photos:[],docs:[],repairs:[],health:[]}];save();go('equip')});
 const r=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML='<select>'+locOptions('fC3')+'</select>';const s=d.firstChild;return {groups:[...s.querySelectorAll('optgroup')].map(g=>g.label),n:s.querySelectorAll('option').length,sel:s.querySelectorAll('option[selected]').length}});
 if(r.groups.join()!=='A棟,B棟,C棟,D棟,E棟,F棟')bad.push('棟の見出し '+r.groups.join());if(r.n!==1+6*21)bad.push('選択肢の数 '+r.n);if(r.sel!==1)bad.push('選択中の印が '+r.sel);
 // 設備の編集窓で選ぶ → 次に開いた窓の先頭に「最近使った場所」
 await p.evaluate(()=>editEquip('e1'));await p.waitForSelector('#e_loc');await p.selectOption('#e_loc','fE4');await p.evaluate(()=>closeModal(true));
 await p.evaluate(()=>editEquip());await p.waitForSelector('#e_loc');
 const g=await p.evaluate(()=>{const gs=[...document.querySelectorAll('#e_loc optgroup')];return {first:gs[0]&&gs[0].label,opts:gs[0]?[...gs[0].querySelectorAll('option')].map(o=>o.textContent):[],sw:document.documentElement.scrollWidth}});
 if(g.first!=='最近使った場所')bad.push('先頭が「最近使った場所」でない '+g.first);if(!g.opts[0]||!g.opts[0].startsWith('E棟 › 4F'))bad.push('最近の中身 '+g.opts.join('|'));if(g.sw>392)bad.push('はみ出す '+g.sw);
 // 値は locId のまま
 await p.selectOption('#e_loc','fB2');await p.fill('#e_name','新設備');await p.evaluate(()=>saveEquip(''));await p.waitForTimeout(200);
 const v=await p.evaluate(()=>S.equipment.at(-1).locId);if(v!=='fB2')bad.push('保存された locId '+v);
 // 最近のグループから選んでも locId
 await p.evaluate(()=>editEquip());await p.waitForSelector('#e_loc');await p.selectOption('#e_loc',{index:1});const v2=await p.evaluate(()=>document.querySelector('#e_loc').value);if(!/^f[A-F]\d+$/.test(v2))bad.push('最近から選んだ値 '+v2);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
