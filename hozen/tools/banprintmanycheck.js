// 盤の点検表の印刷：盤 3000 面（棟 6×階 10×電気室 5×盤 10）・今月の印 1500 個で、印を入れた点検表（banPrintBlank(true) と同じ形）を
// 作るのが 3 秒以内・A4 の PDF が 30 秒以内に作れ、行が 3000 そろい、どの行も左の「階・電気室」が空でなく、棟ごとに見出しがあり、
// 行が割れない指定が効き、紙の幅からはみ出さないか（hz-v-ban-print-many）。usage: node hozen/tools/banprintmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:794,height:1123}});const p=await ctx.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const ms=await p.evaluate(()=>{const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'動力盤-'+pi,'盤',rid)}}}
  S.locs=L;S.banChk={};save();V.banYm=TODAY.slice(0,7);V.banB='';go('ban');
  const pans=L.filter(x=>x.type==='盤');pans.slice(0,1500).forEach((x,i)=>{const ym=TODAY.slice(0,7);S.banChk[ym]=S.banChk[ym]||{};S.banChk[ym][x.id]=[i%2?'済':'○','済','']});
  window.print=()=>{};document.body.classList.add('bbp');const s=performance.now();V.banPrintMk=true;render();return performance.now()-s});
 if(ms>3000)bad.push('印を入れた点検表を作るのに '+Math.round(ms)+'ms');
 await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const T=[...document.querySelectorAll('.banprint')];const rows=[...document.querySelectorAll('.banprint table.bpt tbody tr')];
  const emptyLab=rows.filter(tr=>!tr.children[0].textContent.trim()).length;const marks=rows.filter(tr=>/●|◯/.test(tr.textContent)).length;
  const wide=T.filter(t=>t.querySelector('table').getBoundingClientRect().right>t.getBoundingClientRect().right+1).length;
  return {sheets:T.length,rows:rows.length,emptyLab,marks,wide,avoid:rows[0]?getComputedStyle(rows[0]).breakInside:'',sw:document.documentElement.scrollWidth}});
 if(r.sheets!==6)bad.push('棟ごとの見出しが '+r.sheets+'（6 のはず）');if(r.rows!==3000)bad.push('行が '+r.rows+'/3000');if(r.emptyLab)bad.push('左の「階・電気室」が空の行 '+r.emptyLab);
 if(r.marks!==1500)bad.push('印の入った行が '+r.marks+'/1500');if(r.wide)bad.push('表が紙の幅からはみ出す '+r.wide);if(r.avoid!=='avoid')bad.push('行が割れない指定が無い '+r.avoid);
 const s=Date.now();const buf=await p.pdf({format:'A4'}).catch(e=>{bad.push('PDF が作れない '+e.message);return null});const pm=Date.now()-s;if(pm>30000)bad.push('PDF に '+pm+'ms');if(buf&&buf.length<20000)bad.push('PDF が小さすぎる');
 const kept=await p.evaluate(()=>{V.banPrintMk=false;document.body.classList.remove('bbp');render();return Object.keys(S.banChk[TODAY.slice(0,7)]).length});if(kept!==1500)bad.push('印刷で記録が変わった '+kept);
 console.log('表 '+Math.round(ms)+'ms・PDF '+pm+'ms・'+(buf?Math.round(buf.length/1024)+'KB':''));
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
