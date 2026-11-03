// 発電機の月次の数字（hz-gen-next-unit）：1台を保存すると「次の未入力の発電機へ ›」が出て、押すと次の台の入力が開く。
//  3台の見本（A棟 1階・A棟 2階・B棟 1階）で順に進めて 3 回で終わり、最後は「すべて入力済み」。管理値外で異常の記録へ進んだときは出さない。
//  順は一覧と同じ 棟→階→電気室。保存の形は変えない。390px・44px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let accept=false;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>(accept?d.accept():d.dismiss()).catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('ba','A棟','建屋',''),mk('bb','B棟','建屋',''),mk('a1','1階','階','ba'),mk('a2','2階','階','ba'),mk('b1','1階','階','bb')];
  const g=(id,loc)=>({id,code:id.toUpperCase(),name:'非常用発電機 '+id,kind:'発電機',status:'稼働',locId:loc,place:'',importance:'',spec:{}});
  S.equipment=[g('g3','b1'),g('g2','a2'),g('g1','a1')];S.meas=[];go('equip')});
 const saveNow=async()=>{await p.waitForSelector('#ms_rows input[data-mv]');await p.waitForTimeout(150);await p.locator('#ms_rows input[data-mv]').first().fill('200');await p.fill('#ms_by','確認者');await p.click('#modal button:text-is("保存")');await p.waitForTimeout(300)};
 await p.evaluate(()=>genStart('g1'));await saveNow();
 const order=[];for(let i=0;i<3;i++){const nb=await p.$('#genNextBtn');if(!nb)break;const t=await p.evaluate(()=>document.querySelector('#modal .item .ti').textContent);order.push(t);
  const h=await p.evaluate(()=>document.querySelector('#genNextBtn').getBoundingClientRect().height);if(h<44)bad.push('次へのボタンが44px未満');await p.click('#genNextBtn');await saveNow()}
 if(order.join('|')!=='G2 非常用発電機 g2|G3 非常用発電機 g3')bad.push('次の発電機の順が違う '+order.join('|'));
 if(await p.$('#genNextBtn'))bad.push('全部入れたのに次へが出る');
 const n=await p.evaluate(()=>S.meas.filter(m=>m.tplId==='mt_gen').length);if(n!==3)bad.push('3台で終わらない '+n);
 if(!/すべて入力済み/.test(await p.evaluate(()=>new Promise(r=>setTimeout(()=>r((document.querySelector('.toast,#toast')||{}).textContent||''),1000))))) bad.push('すべて入力済みの知らせが出ない');
 // 管理値外で異常の記録へ進んだときは「次へ」を出さない
 await p.evaluate(()=>{S.meas=[];const t=tplById('mt_gen');t.rows[0].max=210;render()});accept=true;
 await p.evaluate(()=>genStart('g1'));await p.waitForSelector('#ms_rows input[data-mv]');await p.waitForTimeout(150);await p.locator('#ms_rows input[data-mv]').first().fill('250');await p.fill('#ms_by','確認者');await p.click('#modal button:text-is("保存")');await p.waitForTimeout(300);
 if(await p.$('#genNextBtn'))bad.push('異常の記録へ進んだのに次へが出る');if(!(await p.$('#is_title')))bad.push('異常の記録が開かない');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
