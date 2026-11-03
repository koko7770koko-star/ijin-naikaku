// 盤の点検の見やすさ（hz-ban-head-wrap・hz-ban-fold・hz-ban-carry）：
//  ① 列見出しが 390px で 2 行以内・言葉の途中で折れない（短い言葉と <wbr>。印刷の空の表も同じ言葉）
//  ② 全部済み（● か延期）の階・電気室は最初から畳んで「済 11/12（開く）」、見出しを押すと畳む・開く（V に覚えるだけ）、
//     「次の未点検へ」は畳んだ階の盤にも届く（開いて光らせる）、畳む・開くで記録は変わらない
//  ③ 今月を開くと「先月のやり残し ○面（押すと先月へ）」（先月 ◯ のまま・3つとも空）。押すと先月へ移り、その盤が光る。今月の記録は変わらない。先月の記録が無ければ出ない
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const OUT=process.argv[2]||'';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const ym=await p.evaluate(()=>TODAY.slice(0,7)),pv=await p.evaluate(ym=>banPrevYm(ym),ym);
 await p.evaluate(([ym,pv])=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});const L=[mk('b','A棟','建屋','')];
  for(let f=1;f<=4;f++){L.push(mk('f'+f,f+'階','階','b'));for(let k=1;k<=4;k++)L.push(mk('p'+f+k,'盤'+f+'-'+k,'盤','f'+f))}S.locs=L;
  const cur={};for(let k=1;k<=4;k++)cur['p1'+k]=['済','済',k===4?'延':'済'];cur['p21']=['済','',''];
  const prev={};L.filter(l=>l.type==='盤').forEach(l=>prev[l.id]=['済','済','済']);prev['p32']=['済','○',''];delete prev['p43'];
  S.banChk={[ym]:cur,[pv]:prev};V.banB='b';V.banYm=ym;go('ban')},[ym,pv]);await p.waitForTimeout(250);
 const chk0=await p.evaluate(()=>JSON.stringify(S.banChk));
 // ①
 const hd=await p.evaluate(()=>[...document.querySelector('.banrow.bh').querySelectorAll('.bi')].slice(0,3).map(e=>({t:e.textContent,h:e.getBoundingClientRect().height,lh:parseFloat(getComputedStyle(e).lineHeight)||14.4,o:e.scrollWidth>e.clientWidth+1})));
 if(hd.map(x=>x.t).join()!=='盤内発熱,端子・碍子,その他異常')bad.push('見出しの言葉 '+hd.map(x=>x.t).join());
 hd.forEach(x=>{if(x.h>x.lh*2+2)bad.push('見出しが2行を超える '+x.t+' '+x.h);if(x.o)bad.push('見出しがはみ出す '+x.t)});
 const bh=await p.evaluate(()=>[...document.querySelectorAll('.banprint .bpt th')].slice(2,5).map(e=>e.textContent).join());if(bh!=='盤内発熱,端子・碍子,その他異常')bad.push('印刷の表の見出しが違う '+bh);
 // ②
 const st=()=>p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.banfl[data-floor]')].map(e=>[e.dataset.floor,e.classList.contains('folded')])));
 let s=await st();if(!(s.f1===true&&s.f2===false&&s.f3===false))bad.push('全部済みの階だけ最初から畳まれていない '+JSON.stringify(s));
 if(!/済 11\/12（開く）/.test(await p.evaluate(()=>document.querySelector('.banfl[data-floor="f1"]').innerText)))bad.push('畳んだ階に「済 11/12（開く）」が無い（延期1つ）');
 if(OUT){fs.mkdirSync(OUT,{recursive:true});await p.screenshot({path:path.join(OUT,'banux1.png')})}
 await p.click('.banfl[data-floor="f3"] h2');await p.waitForTimeout(80);s=await st();if(!s.f3)bad.push('見出しを押しても畳めない');
 if(await p.$('#ban-p31'))bad.push('畳んだ階の盤が出ている');
 await p.click('.banfl[data-floor="f1"] button:has-text("開く")');await p.waitForTimeout(80);s=await st();if(s.f1)bad.push('「開く」で開かない');
 await p.click('.banfl[data-floor="f1"] h2');await p.waitForTimeout(80);s=await st();if(!s.f1)bad.push('開いた階を見出しで畳めない');
 // 次の未点検へ：2階を全部済みにして 3階（畳んである）の盤へ届く
 await p.evaluate(ym=>{for(let k=1;k<=4;k++)S.banChk[ym]['p2'+k]=['済','済','済'];V['bf_f2']=true;render()},ym);
 await p.click('button:has-text("次の未点検へ")');await p.waitForTimeout(400);
 const nx=await p.evaluate(()=>({f:document.querySelector('.banrow.flash')?.id||'',f3:document.querySelector('.banfl[data-floor="f3"]').classList.contains('folded')}));
 if(nx.f!=='ban-p31'||nx.f3)bad.push('次の未点検へ が畳んだ階の盤に届かない '+JSON.stringify(nx));
 await p.evaluate(ym=>{for(let k=1;k<=4;k++)delete S.banChk[ym]['p2'+k];S.banChk[ym]['p21']=['済','',''];render()},ym);
 if(await p.evaluate(()=>JSON.stringify(S.banChk))!==chk0)bad.push('畳む・開くで記録が変わった');
 // ③
 const ct=await p.evaluate(()=>{const e=[...document.querySelectorAll('#app button')].find(x=>/先月のやり残し/.test(x.textContent));return e?e.textContent:''});
 if(!/先月のやり残し 2面/.test(ct))bad.push('先月のやり残しが 2面と出ない '+ct);
 await p.click('button:has-text("先月のやり残し")');await p.waitForTimeout(300);
 const cg=await p.evaluate(()=>({ym:V.banYm,f:document.querySelector('.banrow.flash')?.id||''}));if(cg.ym!==pv||cg.f!=='ban-p32')bad.push('押しても先月のその盤へ移らない '+JSON.stringify(cg));
 if(await p.evaluate(()=>[...document.querySelectorAll('#app button')].some(x=>/先月のやり残し/.test(x.textContent))))bad.push('先月を見ているのに やり残し が出る');
 if(await p.evaluate(()=>JSON.stringify(S.banChk))!==chk0)bad.push('やり残しで記録が変わった');
 await p.evaluate(([ym,pv])=>{delete S.banChk[pv];V.banYm=ym;render()},[ym,pv]);
 if(await p.evaluate(()=>[...document.querySelectorAll('#app button')].some(x=>/先月のやり残し/.test(x.textContent))))bad.push('先月の記録が無いのに やり残し が出る');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 const small=await p.evaluate(()=>[...document.querySelectorAll('#app button,#app [role=button]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44}).length);if(small)bad.push('44px 未満 '+small);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
