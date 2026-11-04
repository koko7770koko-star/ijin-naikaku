// 測定のひな形の複製：既存のひな形の編集窓に「複製して新しく作る」（44px 以上）があり、押すと新しい id・名前に「（写し）」・行と管理値そのままの 2 つ目ができ、
// 元は変わらず、写しの編集窓が開く。写しの名前を変えて保存でき、測定の入力で両方選べる。ボタンが無い（新規）ときは出ない。390px で横にはみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const orig=await p.evaluate(()=>{S.mtpl=[{id:'mtx',type:'絶縁抵抗',name:'変圧器',cycleM:12,kind:'',cond:'',rows:[{name:'R相',unit:'MΩ',min:1,max:'',ck:false},{name:'外観',unit:'',min:'',max:'',ck:true}]}];save();go('mtpl');return JSON.stringify(S.mtpl[0])});
 await p.waitForTimeout(200);
 await p.evaluate(()=>editMtpl());await p.waitForTimeout(150);
 ok(await p.evaluate(()=>![...document.querySelectorAll('#modal button')].some(x=>/複製/.test(x.textContent))),'新規の窓に複製ボタンが出ている');await p.evaluate(()=>closeModal(true));
 await p.evaluate(()=>editMtpl('mtx'));await p.waitForTimeout(150);
 const bt=await p.evaluate(()=>{const e=[...document.querySelectorAll('#modal button')].find(x=>/複製/.test(x.textContent));if(!e)return null;const r=e.getBoundingClientRect();return {h:r.height,right:r.right,sw:document.documentElement.scrollWidth}});
 ok(bt,'複製ボタンが無い');if(bt){ok(bt.h>=44,'44px 未満 '+bt.h);ok(bt.right<=390&&bt.sw<=390,'はみ出す')}
 await p.evaluate(()=>{[...document.querySelectorAll('#modal button')].find(x=>/複製/.test(x.textContent)).click()});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({n:S.mtpl.length,o:JSON.stringify(S.mtpl[0]),c:JSON.parse(JSON.stringify(S.mtpl[1]||{})),nm:(document.querySelector('#mt_name')||{}).value}));
 ok(r.n===2,'2 つにならない '+r.n);ok(r.o===orig,'元が変わった');
 ok(r.c.id&&r.c.id!=='mtx','新しい id でない');ok(r.c.name==='変圧器（写し）','名前が違う '+r.c.name);
 ok(JSON.stringify(r.c.rows)===JSON.stringify(JSON.parse(orig).rows)&&r.c.cycleM===12&&r.c.type==='絶縁抵抗','行・周期・種類が写っていない');
 ok(r.nm==='変圧器（写し）','写しの編集窓が開かない');
 await p.evaluate(()=>{document.querySelector('#mt_name').value='変圧器B';saveMtpl(S.mtpl[1].id)});await p.waitForTimeout(200);
 const f=await p.evaluate(()=>({names:S.mtpl.map(t=>t.name),o:JSON.stringify(S.mtpl[0])}));
 ok(f.names.join()==='変圧器,変圧器B','名前を変えて保存できない '+f.names);ok(f.o===orig,'元が変わった（保存後）');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
