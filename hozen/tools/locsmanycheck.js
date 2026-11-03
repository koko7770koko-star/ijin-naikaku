// 設備の階層の確認：A〜F棟×各階10（階の下に電気室・盤）で場所が多いとき、最初は施設だけが開いて6棟がすぐ見え、
// 棟を押すと階が出て、階を押すと下が出る・押した状態は覚える・ぜんぶ ひらく で全部出る・390pxではみ出さない・場所の id と数は変わらないことを確かめる。
// usage: node hozen/tools/locsmanycheck.js [スクリーンショットの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const ids=await p.evaluate(()=>{const L=[{id:'l1',name:'○○総合病院',type:'施設',parent:'',note:'',pos:{}}];['A','B','C','D','E','F'].forEach((x,i)=>{L.push({id:'b'+i,name:x+'棟',type:'建屋',parent:'l1',note:'',pos:{}});for(let f=1;f<=10;f++){L.push({id:'f'+i+'_'+f,name:f+'F',type:'階',parent:'b'+i,note:'',pos:{}});if(f<=2)L.push({id:'r'+i+'_'+f,name:'電気室'+f,type:'電気室',parent:'f'+i+'_'+f,note:'',pos:{}})}});
  S.locs=L;go('locs');return L.map(l=>l.id).join()});await p.waitForTimeout(400);
 const rows=()=>p.evaluate(()=>[...document.querySelectorAll('.locn .ti')].map(x=>x.textContent.replace(/[▾▸\s]/g,'')));
 let r=await rows();if(r.length!==7)bad.push('最初に出る場所が '+r.length+'（施設+6棟=7のはず）: '+r.slice(0,10).join());
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>{[...document.querySelectorAll('.locn .bd')].find(e=>/B棟/.test(e.textContent)).click()});await p.waitForTimeout(200);
 r=await rows();if(r.length!==17)bad.push('B棟を押しても階が出ない '+r.length);
 await p.evaluate(()=>{[...document.querySelectorAll('.locn .bd')].find(e=>/^▸?\s*1F/.test(e.textContent.trim())).click()});await p.waitForTimeout(200);
 r=await rows();if(r.length!==18)bad.push('1Fを押しても電気室が出ない '+r.length);
 await p.evaluate(()=>{[...document.querySelectorAll('.locn .bd')].find(e=>/F棟/.test(e.textContent)).click()});await p.waitForTimeout(200);
 r=await rows();if(r.length!==28)bad.push('F棟を押しても階が出ない '+r.length);
 await p.click('button:has-text("ぜんぶ ひらく")');await p.waitForTimeout(200);r=await rows();if(r.length!==79)bad.push('ぜんぶ ひらくで全部出ない '+r.length);
 await p.click('button:has-text("ぜんぶ たたむ")');await p.waitForTimeout(200);r=await rows();if(r.length!==1)bad.push('ぜんぶ たたむで1行にならない '+r.length);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 if(await p.evaluate(()=>S.locs.map(l=>l.id).join())!==ids)bad.push('場所の id が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
