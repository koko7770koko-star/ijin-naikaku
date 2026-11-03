// 日常点検の確認：数値25・確認15の項目で名前が長くても、390px でラベルが2行まで読め（1行で「…」に切られない）、入力欄が44px以上・横にはみ出さず、
// 名前が短いときは今までどおり1行であること、Enter で次の欄へ進むことを確かめる。保存の形は変えない。usage: node hozen/tools/daymanycheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const mk=long=>p.evaluate(long=>{S.settings.dnums=[...Array(25)].map((_,i)=>({id:'n'+i,name:long?'測定項目'+i+'（名前の長い項目）':'電圧'+i,short:'',unit:'kV',min:10,max:20,chg:'',equip:'',req:i<5}));S.settings.dchecks=[...Array(15)].map((_,i)=>({id:'c'+i,name:'確認項目'+i,req:false,equip:''}));go('day',{day:TODAY})},long);
 const meas=()=>p.evaluate(()=>{const L=[...document.querySelectorAll('#app .num label')],I=[...document.querySelectorAll('#app .num input')];return {n:L.length,lh:Math.max(...L.map(e=>e.getBoundingClientRect().height)),ell:L.filter(e=>getComputedStyle(e).textOverflow==='ellipsis').length,ih:Math.min(...I.map(e=>e.getBoundingClientRect().height)),sw:document.documentElement.scrollWidth,cut:L.filter(e=>e.getBoundingClientRect().right>innerWidth+1).length}});
 await mk(true);await p.waitForTimeout(400);let r=await meas();
 if(r.n!==25)bad.push('数値の欄が '+r.n);if(r.ell)bad.push('長い名前が1行で「…」に切られる '+r.ell);if(r.lh<28)bad.push('長い名前が2行で出ない '+r.lh);if(r.ih<44)bad.push('入力欄が44px未満 '+r.ih);if(r.sw>392||r.cut)bad.push('横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await mk(false);await p.waitForTimeout(400);r=await meas();if(!r.ell)bad.push('短い名前でも1行表示でなくなった');if(r.lh>26)bad.push('短い名前で高さが増えた '+r.lh);
 await p.focus('#n_n0');await p.keyboard.type('12');await p.keyboard.press('Enter');await p.waitForTimeout(150);
 if(await p.evaluate(()=>document.activeElement&&document.activeElement.id)!=='n_n1')bad.push('Enter で次の欄へ進まない');
 if(await p.evaluate(()=>S.daily[TODAY]&&S.daily[TODAY].n0)!==12)bad.push('入れた値が保存されない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
