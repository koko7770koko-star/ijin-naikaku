// 非常用発電機の一覧：棟→階でまとまり、棟のボタンで絞れ、今月の点検済み（●）が出る。古い記録（階なし・場所なし）も開けることを確かめる。
// usage: node hozen/tools/genfloorcheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const today=new Date();const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const old={settings:{name:'確認'},locs:[{id:'l1',name:'本館',type:'施設',parent:'',note:'',pos:{}},{id:'l2',name:'A棟',type:'建屋',parent:'l1',note:'',pos:{}},{id:'l3',name:'1F',type:'階',parent:'l2',note:'',pos:{floor:'1F'}},{id:'l4',name:'B棟',type:'建屋',parent:'l1',note:'',pos:{}},{id:'l5',name:'第1電気室',type:'電気室',parent:'l4',note:'',pos:{}}],
  equipment:[{id:'e1',code:'G-1',name:'発電機1',kind:'発電機',locId:'l3',status:'稼働',place:''},{id:'e2',code:'G-2',name:'発電機2',kind:'発電機',locId:'l5',status:'稼働',place:''},{id:'e3',code:'G-3',name:'発電機3',kind:'発電機',locId:'',status:'稼働',place:''}],
  meas:[{id:'m1',date:ymd(today),equipId:'e1',tplId:'mt_gen',type:'電圧・電流・電力',name:'月次',rows:[{name:'電圧',unit:'V',v:'200'}],cond:{},note:''}]};
 await p.addInitScript(([k,v])=>{if(sessionStorage.getItem('__gc'))return;sessionStorage.setItem('__gc','1');localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(old)]);
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>go('diag',{dgTab:'meas'}));await p.waitForTimeout(300);
 const t=await p.$eval('#genCard',e=>e.innerText);
 if(!/A棟 › 1F/.test(t))errs.push('A棟 › 1F のまとまりが無い');
 if(!/B棟/.test(t)||!/場所未設定/.test(t))errs.push('B棟・場所未設定のまとまりが無い');
 if(!/今月 ● 1\/3/.test(t))errs.push('今月 ● 1/3 が出ない: '+t.slice(0,80));
 await p.locator('#genCard button',{hasText:'A棟'}).click();await p.waitForTimeout(200);
 const t2=await p.$eval('#genCard',e=>e.innerText);if(/発電機2/.test(t2)||!/発電機1/.test(t2))errs.push('A棟で絞れない: '+t2.replace(/\n/g,' '));
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w);
 await p.screenshot({path:process.argv[2]||require('path').join(require('os').tmpdir(),'gencheck.png')});
 const n=await p.evaluate(()=>S.meas.length+'/'+S.equipment.length);if(n!=='1/3')errs.push('記録が変わった '+n);
 await p.evaluate(()=>go('menu'));await p.waitForTimeout(200);
 await p.locator('.mtile',{hasText:'非常用発電機'}).click();await p.waitForTimeout(400);
 if(!(await p.$('#genCard')))errs.push('メニューから発電機に着かない');
 console.log(errs.length?'NG\n  '+errs.join('\n  '):'OK 発電機の一覧（棟→階）');await b.close();process.exit(errs.length?1:0)})();
