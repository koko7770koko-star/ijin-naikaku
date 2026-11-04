// カレンダー（month）：文字「大」「特大」・360px で、日のマスの中に切れた文字（overflow で scrollWidth>clientWidth）が無いか。日を押すとその日の勤務者の名前が出るか。
// usage: node hozen/tools/calcrewxlcheck.js [--list]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'xl']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);await p.waitForTimeout(200);
 await p.evaluate(()=>go('month'));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const o=[];let crew=0;document.querySelectorAll('.cal .d *').forEach(e=>{const cs=getComputedStyle(e);if(!e.offsetParent)return;if(e.matches('.w'))crew++;
   if(cs.overflow!=='visible'&&e.scrollWidth>e.clientWidth+1)o.push(e.className+' 「'+e.textContent.trim().slice(0,8)+'」 '+e.scrollWidth+'>'+e.clientWidth)});return {o:[...new Set(o)],crew}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 if(!r.crew)errs.push(tag+'：勤務者の札が見つからない');
 if(r.o.length)errs.push(tag+'：日のマスで切れた文字 '+r.o.length+' 種 '+(process.argv.includes('--list')?r.o.join(' | '):r.o.slice(0,3).join(' | ')));
 // 日を押すと名前が出る
 const nm=await p.evaluate(async()=>{const d=[...document.querySelectorAll('.cal .d')].find(x=>x.querySelector('.w.a'));if(!d)return null;const want=d.querySelector('.w.a').getAttribute('title')||d.querySelector('.w.a').textContent;d.click();await new Promise(r=>setTimeout(r,300));return {want,txt:document.body.innerText}});
 if(!nm)errs.push(tag+'：A 夜勤の札がある日が無い');else if(!/職員\d/.test(nm.txt))errs.push(tag+'：日を押しても勤務者の名前が出ない');
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
