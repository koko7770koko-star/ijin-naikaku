// 夜勤シフト表の印刷の確認：提出用（A4縦）を実際にPDFにして、人数が多い・交代の記録が多い月でも1か月1ページに収まる（2枚に分かれない）ことを確かめる。
// usage: node hozen/tools/shiftprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const WAIT=()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(WAIT);
 await p.addScriptTag({content:"window.NCH="+(process.env.NCH||60)+";window.MK=()=>{const L=[];for(let y=2026;y<=2027;y++)for(let m=1;m<=12;m++)for(let i=0;i<+(window.NCH||60);i++)L.push({name:'職員'+(1+i%8),date:y+'-'+String(m).padStart(2,'0')+'-'+String(1+Math.floor(i/2)%28).padStart(2,'0'),val:['A日夜勤','B日夜勤','明','公休','有給'][i%5]});return L}"});
 // 人が多く（10人）、交代の記録が多い（毎月30日分）状態を、古い記録の形のまま入れて読み直す
 await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('kinmuhyo_v1')||'null')||null;if(!o)return;});
 const seeded=await p.evaluate(()=>{try{const raw=localStorage.getItem('kinmuhyo_v1');const o=raw?JSON.parse(raw):null;if(!o)return false;
   o.members=[...Array(10)].map((_,i)=>({name:'職員'+(i+1),type:i<8?'夜勤':'日勤'}));
   o.changes=MK();
   o.sub={type:'cal',month:'2027-01'};o.view='2027-01';localStorage.setItem('kinmuhyo_v1',JSON.stringify(o));return true}catch(e){return false}});
 if(!seeded){ // 保存がまだ無い（初回起動）なら、一度シフト画面を開いて保存させてから入れる
  await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);await p.evaluate(()=>{try{window.SHIFT&&SHIFT.refresh&&SHIFT.refresh()}catch(e){}});}
 const seeded2=seeded||await p.evaluate(()=>!!localStorage.getItem('kinmuhyo_v1'));
 if(!seeded2){console.log('シフトの保存が見つからない（確認できません）');process.exit(1)}
 const o=await p.evaluate(()=>localStorage.getItem('kinmuhyo_v1'));
 if(!seeded){await p.evaluate(o=>{const x=JSON.parse(o);x.members=[...Array(10)].map((_,i)=>({name:'職員'+(i+1),type:i<8?'夜勤':'日勤'}));x.changes=MK();x.sub={type:'cal',month:'2027-01'};x.view='2027-01';localStorage.setItem('kinmuhyo_v1',JSON.stringify(x))},o)}
 await p.reload();await p.waitForFunction(WAIT);
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);await p.click('#tabs button[data-p="sub"]');await p.waitForTimeout(1000);
 const nM=await p.evaluate(()=>document.querySelectorAll('#subMonth option').length);
 for(const type of ['cal','p11']){
  await p.selectOption('#subType',type);await p.waitForTimeout(300);
  const months=await p.evaluate(()=>[...document.querySelectorAll('#subMonth option')].map(o=>o.value));
  for(const m of months.slice(0,12)){
   await p.selectOption('#subMonth',m);await p.waitForTimeout(150);
   const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});
   const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
   const cut=await p.evaluate(()=>{const sh=document.querySelector('#subSheets .sheet'),rc=sh&&sh.querySelector('.rec');if(!rc)return 'none';const a=sh.getBoundingClientRect(),b=rc.getBoundingClientRect();
     const last=[...rc.querySelectorAll('.ri')].pop();const lb=last?last.getBoundingClientRect().bottom:b.bottom;return lb>a.bottom-2?'cut':'ok'});
   if(cut==='cut')bad.push(`${type} ${m}：交代・有給の記録が枠の外に切れる`);
   if(pages!==1)bad.push(`${type} ${m}：印刷が ${pages} ページになる`);
   if(process.argv[2]&&type==='cal'&&m===months[1])require('fs').writeFileSync(process.argv[2],buf);
  }
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
