// ホーム：今月まだ数字を入れていない非常用発電機がお知らせに出て、押すとその台の入力（1台のとき）か一覧（複数のとき）へ行ける・入れたら消える・保存の形は変わらない
// usage: node hozen/tools/genduecheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const al=()=>p.evaluate(()=>[...document.querySelectorAll('#app .al')].map(e=>e.innerText).filter(t=>/発電機/.test(t)));
 await p.evaluate(()=>{go('home')});await p.waitForTimeout(300);if((await al()).length)bad.push('発電機が無いのにお知らせが出る');
 await p.evaluate(()=>{addGenTpl();for(let i=1;i<=6;i++)S.equipment.push({id:'g'+i,name:'発電機'+i,kind:'発電機',status:'稼働',locId:'',place:''});
  const t=tplById('mt_gen');for(const id of ['g1','g2','g3'])S.meas.push({id:'m'+id,date:TODAY,equipId:id,tplId:'mt_gen',type:t.type,name:t.name,rows:[],cond:{temp:'',hum:'',weather:'',tool:'',toolName:'',method:''},by:'x',note:'',photos:[]});
  save();go('home')});await p.waitForTimeout(300);
 let a=await al();if(a.length!==1||!/3台/.test(a[0])||!/発電機4/.test(a[0]))bad.push('残り3台のお知らせが違う '+JSON.stringify(a));
 const top=await p.evaluate(()=>{const e=[...document.querySelectorAll('#app .al')].find(x=>/発電機/.test(x.innerText));return e?e.getBoundingClientRect().top:-1});if(top<0||top>700)bad.push('お知らせが最初の画面に無い '+top);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>{[...document.querySelectorAll('#app .al')].find(x=>/発電機/.test(x.innerText)).click()});await p.waitForTimeout(500);
 if(!await p.evaluate(()=>!!document.querySelector('#genCard')))bad.push('押しても発電機の一覧に行かない');
 // 1台だけ残る → 押すとその台の入力
 await p.evaluate(()=>{const t=tplById('mt_gen');for(const id of ['g4','g5'])S.meas.push({id:'m'+id,date:TODAY,equipId:id,tplId:'mt_gen',type:t.type,name:t.name,rows:[],cond:{temp:'',hum:'',weather:'',tool:'',toolName:'',method:''},by:'x',note:'',photos:[]});save();go('home')});await p.waitForTimeout(300);
 a=await al();if(a.length!==1||!/1台：発電機6/.test(a[0]))bad.push('残り1台のお知らせが違う '+JSON.stringify(a));
 await p.evaluate(()=>{[...document.querySelectorAll('#app .al')].find(x=>/発電機/.test(x.innerText)).click()});await p.waitForTimeout(400);
 if(!await p.evaluate(()=>!!document.querySelector('#ms_rows')))bad.push('1台のとき入力の窓が開かない');
 await p.evaluate(()=>{closeModal(true);const t=tplById('mt_gen');S.meas.push({id:'mg6',date:TODAY,equipId:'g6',tplId:'mt_gen',type:t.type,name:t.name,rows:[],cond:{temp:'',hum:'',weather:'',tool:'',toolName:'',method:''},by:'x',note:'',photos:[]});save();go('home')});await p.waitForTimeout(300);
 if((await al()).length)bad.push('全部入れたのにお知らせが残る');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
