// 予定の追加・編集：設備・場所に候補（過去の予定・年間計画の場所・場所の階層）が出る・古い記録（locs なし）でも開く・保存は文字列のまま・はみ出さない。
// usage: node hozen/tools/taskplacecheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const ready=()=>p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.tasks)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.goto('file://'+FILE);await ready();
 // 古い形：locs なし、予定に place だけ
 const old={settings:{name:'確認'},tasks:[{id:'t1',date:'2026-10-01',title:'月次点検',place:'B棟 受変電室',staff:'',status:'完了',photos:[]}]};
 await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(old)]);await p.reload();await ready();
 await p.evaluate(()=>editTask(null,TODAY));await p.waitForTimeout(400);
 let o=await p.evaluate(()=>{const i=document.querySelector('#t_place');const dl=i&&i.list;return dl?[...dl.options].map(x=>x.value):null});
 if(!o)errs.push('設備・場所に候補の一覧が付いていない');else if(!o.includes('B棟 受変電室'))errs.push('過去の予定の場所が候補に無い '+o.join('/'));
 await p.evaluate(()=>closeModal());
 // 場所の階層を足すと 棟 › 階 › 盤 が候補に出る
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('l1','A棟','建屋',''),mk('l2','1F','階','l1'),mk('b1','盤1','盤','l2')];save()});
 await p.evaluate(()=>editTask(null,TODAY));await p.waitForTimeout(400);
 o=await p.evaluate(()=>[...document.querySelector('#t_place').list.options].map(x=>x.value));
 if(!o.includes('A棟 › 1F › 盤1'))errs.push('場所の階層が候補に無い '+o.join('/'));
 await p.fill('#t_title','確認の予定');await p.fill('#t_place','A棟 › 1F › 盤1');
 await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='保存');b.click()});await p.waitForTimeout(400);
 const t=await p.evaluate(()=>S.tasks.find(x=>x.title==='確認の予定'));if(!t||t.place!=='A棟 › 1F › 盤1')errs.push('保存の値が違う '+JSON.stringify(t&&t.place));
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w);
 console.log(errs.length?'NG\n  '+errs.join('\n  '):'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
