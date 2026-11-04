// 資格の有効期限（hz-staff-qual-exp）：資格の窓で資格ごとに期限を入れて保存すると S.qualExp に残り、読み直しても残る・60 日以内／期限切れは人員の一覧に ⚠ が出る・
// 外した資格の期限は残らない・CSV に有効期限の列が出る・qualExp の無い古い記録やおかしな値でも開けて quals は変わらない・バックアップの復元で qualExp が戻る・390px ではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const ready=()=>p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 // ① 古い記録（qualExp なし）とおかしな値
 await p.goto('file://'+FILE);await ready();
 await p.evaluate(k=>{const o=JSON.parse(localStorage.getItem(k)||'{}');o.settings=o.settings||{};o.quals={'職員A':['第三種電気主任技術者','第一種電気工事士'],'職員B':['第二種電気工事士']};delete o.qualExp;localStorage.setItem(k,JSON.stringify(o))},KEY);
 await p.reload();await ready();
 let r=await p.evaluate(()=>({qe:JSON.stringify(S.qualExp),q:JSON.stringify(S.quals)}));
 ok(r.qe==='{}','古い記録で qualExp が {} にならない '+r.qe);ok(/職員A/.test(r.q)&&/第一種電気工事士/.test(r.q),'古い記録の quals が変わった '+r.q);
 await p.evaluate(k=>{const o=JSON.parse(localStorage.getItem(k));o.qualExp={'職員A':{'第三種電気主任技術者':'2026-13-40','第一種電気工事士':5},'職員B':'abc'};localStorage.setItem(k,JSON.stringify(o))},KEY);
 await p.reload();await ready();
 r=await p.evaluate(()=>({qe:JSON.stringify(S.qualExp),q:JSON.stringify(S.quals)}));
 ok(r.qe==='{}','おかしな期限が残る '+r.qe);ok(/職員A/.test(r.q),'おかしな qualExp で quals が消えた');
 // ② 窓で期限を入れる
 await p.evaluate(()=>{go('staff');editQual('職員A')});await p.waitForSelector('#qlexp');
 const rows=await p.evaluate(()=>[...document.querySelectorAll('#qlexp .qlx')].filter(e=>e.style.display!=='none').map(e=>e.dataset.q));
 ok(rows.includes('第三種電気主任技術者')&&rows.includes('第一種電気工事士')&&!rows.includes('第二種電気工事士'),'持っている資格だけ期限の欄が出ない '+rows.join(','));
 const sz=await p.evaluate(()=>{const e=document.querySelector('#qlexp .qlx input');const x=e.getBoundingClientRect();return {h:x.height,sw:document.documentElement.scrollWidth}});
 ok(sz.h>=40,'期限の欄が小さい '+sz.h);ok(sz.sw<=390,'390pxではみ出す '+sz.sw);
 await p.evaluate(()=>{const set=(q,v)=>{const r=[...document.querySelectorAll('#qlexp .qlx')].find(e=>e.dataset.q===q);r.querySelector('input').value=v};set('第三種電気主任技術者',addD(TODAY,30));set('第一種電気工事士',addD(TODAY,400));saveQual('職員A')});
 await p.waitForTimeout(300);
 r=await p.evaluate(()=>({qe:S.qualExp['職員A'],t:document.querySelector('#app').innerText,td:TODAY}));
 ok(r.qe&&r.qe['第三種電気主任技術者']&&r.qe['第一種電気工事士'],'期限が保存されない '+JSON.stringify(r.qe));
 ok(/⚠ 第三種電気主任技術者 あと30日/.test(r.t),'60日以内の ⚠ が出ない');
 // ③ 読み直しても残る
 await p.reload();await ready();await p.evaluate(()=>go('staff'));await p.waitForTimeout(200);
 r=await p.evaluate(()=>({qe:S.qualExp['職員A'],sw:document.documentElement.scrollWidth}));ok(r.qe&&Object.keys(r.qe).length===2,'読み直すと期限が消える');ok(r.sw<=390,'一覧が390pxではみ出す');
 // ④ 期限切れ・資格を外すと期限も消える
 await p.evaluate(()=>{editQual('職員A')});await p.waitForSelector('#qlexp');
 await p.evaluate(()=>{const cb=[...document.querySelectorAll('#ql input')].find(e=>e.value==='第一種電気工事士');cb.checked=false;qlToggle(cb);const r=[...document.querySelectorAll('#qlexp .qlx')].find(e=>e.dataset.q==='第三種電気主任技術者');r.querySelector('input').value=addD(TODAY,-3);saveQual('職員A')});await p.waitForTimeout(300);
 r=await p.evaluate(()=>({qe:S.qualExp['職員A'],q:S.quals['職員A'],t:document.querySelector('#app').innerText}));
 ok(r.qe&&!r.qe['第一種電気工事士']&&Object.keys(r.qe).length===1,'外した資格の期限が残る '+JSON.stringify(r.qe));
 ok(/期限切れ/.test(r.t),'期限切れの ⚠ が出ない');
 // ⑤ CSV の列
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:5000}).catch(()=>null),p.evaluate(()=>exportStaffCsv())]);
 if(dl){const t=require('fs').readFileSync(await dl.path(),'utf8');ok(t.includes('"名前","資格名","有効期限"'),'CSV に有効期限の列が無い');ok(t.includes('"第三種電気主任技術者"')&&/"\d{4}-\d\d-\d\d"/.test(t),'CSV に期限が出ない')}else bad.push('CSV が書き出されない');
 // ⑥ 復元で戻る（バックアップの形をそのまま validateData に通す）
 r=await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(S));const v=validateData(d);return v.ok?JSON.stringify(v.data.qualExp):'NG '+v.fatal});
 ok(/第三種電気主任技術者/.test(r),'復元の検証で qualExp が落ちる '+r);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
