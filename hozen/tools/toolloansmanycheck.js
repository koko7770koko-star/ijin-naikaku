// 工具・測定器：貸出の記録 2000 件・校正履歴 300 件の工具が 10 点（保存の上限の近く）あっても、工具のタブと工具の窓が 1 秒以内に開き、
// 貸出中の表示（最後の未返却）と返却の記録が正しく、窓の履歴は返却済みの最近 5 件だけ、印刷（A4）が作れるか。390px（hz-v-tool-loans-many）。
// 保存の形は変えない。usage: node hozen/tools/toolloansmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=1000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY;S.tools=[...Array(10)].map((_,k)=>({id:'t'+k,code:'T'+k,name:'測定器'+k,kind:'測定器',maker:'',model:'',serial:'',place:'',calDue:addD(T,k),calCycleM:12,note:'',
   calHist:[...Array(300)].map((_,i)=>({date:addD(T,-i*30),by:'係',result:'合格',next:addD(T,-i*30+365)})),
   loans:[...Array(2000)].map((_,i)=>({out:addD(T,-2000+i),to:'借りた人'+i,due:'',back:i===1999&&k%2===0?'':addD(T,-2000+i)}))}));save()});await p.waitForTimeout(400);
 const tm={};let s=Date.now();await p.evaluate(()=>go('stock',{stTab:'tools'}));tm.tab=Date.now()-s;
 const loanPills=await p.evaluate(()=>[...document.querySelectorAll('.pill')].filter(x=>/貸出中/.test(x.textContent)).length);if(loanPills!==5)bad.push('一覧の貸出中 '+loanPills);
 s=Date.now();await p.evaluate(()=>editTool('t0'));await p.waitForSelector('#tl_name');tm.modal=Date.now()-s;
 let txt=await p.evaluate(()=>document.querySelector('.grp').textContent);if(!/貸出中：借りた人1999/.test(txt))bad.push('貸出中の表示 '+txt.slice(0,60));
 const metas=await p.evaluate(()=>document.querySelector('.grp').querySelectorAll('.meta').length);if(metas!==5)bad.push('返却済みの履歴 '+metas);
 s=Date.now();await p.evaluate(()=>toolReturn('t0'));await p.waitForSelector('#tl_name');tm.ret=Date.now()-s;
 txt=await p.evaluate(()=>document.querySelector('.grp').textContent);if(/貸出中/.test(txt))bad.push('返却の後も貸出中');
 const top=await p.evaluate(()=>document.querySelector('.grp .meta').textContent);if(!/借りた人1999/.test(top))bad.push('返却が履歴の先頭に無い '+top);
 await p.evaluate(()=>closeModal(true));await p.waitForTimeout(400);
 const sv=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));const t=o.tools[0];return {n:t.loans.length,back:!!t.loans[1999].back,k:Object.keys(t.loans[0]).sort().join(',')}});
 if(sv.n!==2000||!sv.back)bad.push('返却が保存されない '+JSON.stringify(sv));if(sv.k!=='back,due,out,to')bad.push('貸出の形 '+sv.k);
 s=Date.now();const buf=await p.pdf({format:'A4',printBackground:true}).catch(e=>{bad.push('印刷 '+e.message);return null});tm.pdf=Date.now()-s;if(buf&&buf.length<5000)bad.push('印刷が空');
 for(const k of ['tab','modal','ret'])if(tm[k]>LIM)bad.push(k+' '+tm[k]+'ms');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
