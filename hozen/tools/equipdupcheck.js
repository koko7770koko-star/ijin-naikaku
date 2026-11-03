// 設備台帳の「複製」の確認：複製の窓が元の内容（場所・種別・仕様）を引き継ぎ、名前に番号が付き、設備ID・製造番号は空、
// 保存すると新しい id で1台増える・元の設備は変わらない・390px で窓がはみ出さない。保存の形は変えない。
// usage: node hozen/tools/equipdupcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.equipment=[{id:'e0',code:'E-001',name:'分電盤',place:'○○棟 1F',maker:'甲',model:'M1',serial:'S1',installed:'2015-04',cycle:'年1回',note:'',kind:'',status:'稼働',importance:'B',spec:{'定格電圧':'200V'},photos:[],docs:[],repairs:[{id:'r1',date:TODAY,kind:'修理',content:'x',vendor:'',cost:'',photos:[]}],health:[]}];save();go('equipDetail',{eq:'e0'})});
 await p.waitForTimeout(300);
 const btn=await p.evaluate(()=>[...document.querySelectorAll('#app button')].filter(x=>x.textContent.trim()==='複製').map(x=>{const r=x.getBoundingClientRect();return {w:r.width,h:r.height}}));
 if(btn.length!==1)bad.push('複製ボタンが '+btn.length+' 個');else if(btn[0].h<30)bad.push('複製ボタンが低い '+btn[0].h);
 await p.evaluate(()=>editEquip('','e0'));await p.waitForSelector('#e_name');
 const f=await p.evaluate(()=>({n:$('#e_name').value,code:$('#e_code').value,ser:$('#e_serial').value,pl:$('#e_place').value,mk:$('#e_maker').value,imp:$('#e_imp').value,sp:[...document.querySelectorAll('#e_spec input,#e_specx input')].map(i=>i.value).join('|'),sw:document.documentElement.scrollWidth,h:document.querySelector('.modal h3,#modal h3,h3')?.textContent}));
 if(f.n!=='分電盤（2）')bad.push('名前 '+f.n);if(f.code||f.ser)bad.push('設備IDか製造番号が空でない');if(f.pl!=='○○棟 1F'||f.mk!=='甲'||f.imp!=='B')bad.push('場所・メーカー・重要度を引き継いでいない');if(!f.sp.includes('200V'))bad.push('仕様を引き継いでいない');if(f.sw>392)bad.push('横にはみ出す '+f.sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>{$('#e_code').value='E-002';saveEquip('')});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({n:S.equipment.length,a:S.equipment[0],b:S.equipment[1],l:JSON.parse(localStorage.getItem('hospElecSched_v1')).equipment.length}));
 if(r.n!==2||r.l!==2)bad.push('保存後の台数 '+r.n+'/'+r.l);if(r.a.name!=='分電盤'||r.a.repairs.length!==1)bad.push('元の設備が変わった');if(r.b.id===r.a.id||r.b.name!=='分電盤（2）'||(r.b.repairs||[]).length!==0||r.b.spec['定格電圧']!=='200V')bad.push('複製された設備が正しくない');
 await p.evaluate(()=>editEquip('','e0'));await p.waitForSelector('#e_name');const n3=await p.evaluate(()=>$('#e_name').value);if(n3!=='分電盤（3）')bad.push('2回目の名前 '+n3);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
