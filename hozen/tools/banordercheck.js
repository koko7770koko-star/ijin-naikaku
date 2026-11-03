// 盤の並びが画面・月報・手書きの空の表でそろうか（自分で使って見つけた）：階・電気室の順は「設備の場所」の並び（並べ替えた ord も効く）。
//  階の並びを 2階 → 3階 → 1階 に並べ替えると、盤の点検の画面・月報の 6の2／6の3・手書きの空の表がどれもその順。棟の順も同じ。
//  月報の盤の表の見出しは「盤内発熱・端子・碍子・その他異常」で、言葉の途中で折れない。記録は変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(()=>{const mk=(id,name,type,parent,ord)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''},...(ord!==undefined?{ord}:{})});
  const L=[mk('bb','B棟','建屋','',0),mk('ba','A棟','建屋','',1)];
  [['f1','1階',2],['f2','2階',0],['f3','3階',1]].forEach(([id,n,o])=>{L.push(mk(id,n,'階','ba',o));L.push(mk('r'+id,'第1電気室','電気室',id));L.push(mk('p'+id,'動力盤-'+n,'盤','r'+id))});
  L.push(mk('fb','1階','階','bb'));L.push(mk('pb','電灯盤','盤','fb'));S.locs=L;S.banChk={[TODAY.slice(0,7)]:{pf2:['済','済','済']}};return JSON.stringify({l:S.locs,c:S.banChk})});
 const want='2階,3階,1階';
 const scr=await p.evaluate(()=>{V.banB='ba';go('ban');[...document.querySelectorAll('.banfl[data-floor]')].forEach(e=>{});return {tabs:[...document.querySelectorAll('.seg.tabs button')].map(x=>x.firstChild.textContent.trim()).join(),fl:[...document.querySelectorAll('.banfl[data-floor] h2')].map(h=>(h.textContent.match(/\d+階/)||[''])[0]).join()}});
 if(scr.tabs!=='B棟,A棟')bad.push('盤の点検の棟の順 '+scr.tabs);if(scr.fl!==want)bad.push('盤の点検の階の順 '+scr.fl);
 const blank=await p.evaluate(()=>[...document.querySelectorAll('.banprint')].map(e=>e.querySelector('h2').textContent.match(/[AB]棟/)[0]+':'+[...e.querySelectorAll('tbody tr td:first-child')].map(t=>t.textContent).filter(Boolean).map(t=>t.split(' › ')[0]).join('/')).join('|'));
 if(blank!=='B棟:1階|A棟:2階/3階/1階')bad.push('手書きの空の表の順 '+blank);
 const rep=await p.evaluate(()=>{const d=new Date();V.ry=d.getFullYear();V.rm=d.getMonth()+1;go('report');const secs=[...document.querySelectorAll('.sec')];
   const t2=secs.find(x=>/6の2/.test(x.textContent)),t3=secs.find(x=>/6の3/.test(x.textContent));
   const rows2=t2?[...t2.nextElementSibling.querySelectorAll('tr')].map(r=>[...r.cells].map(c=>c.textContent)).filter(r=>r[0]==='A棟'&&r[1]!=='棟の合計').map(r=>r[1].split(' › ')[0]):[];
   const tb3=t3?t3.nextElementSibling:null,rows3=tb3?[...tb3.querySelectorAll('tr')].map(r=>r.textContent).filter(t=>/^A棟 › /.test(t)).map(t=>t.split(' › ')[1]):[];
   const th=tb3?[...tb3.querySelectorAll('th')].slice(1,4).map(x=>({t:x.textContent,h:x.getBoundingClientRect().height,lh:parseFloat(getComputedStyle(x).lineHeight)||13})):[];
   const b2=t2?[...new Set([...t2.nextElementSibling.querySelectorAll('tr')].map(r=>r.cells[0]&&r.cells[0].textContent).filter(x=>/^.+棟$/.test(x||'')&&x!=='棟'))].join():'';
   return {rows2:rows2.join(),rows3:rows3.join(),th,b2}});
 if(rep.rows2!==want)bad.push('月報 6の2 の階の順 '+rep.rows2);if(rep.rows3!==want)bad.push('月報 6の3 の階の順 '+rep.rows3);if(rep.b2!=='B棟,A棟')bad.push('月報の棟の順 '+rep.b2);
 if(rep.th.map(x=>x.t).join()!=='盤内発熱,端子・碍子,その他異常')bad.push('月報の盤の見出し '+rep.th.map(x=>x.t).join());
 if(await p.evaluate(()=>JSON.stringify({l:S.locs,c:S.banChk}))!==before)bad.push('記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
