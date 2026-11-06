// 初めて開いた（記録なし）ホームの確認：何から始めるかの案内が出て、「棟を足す」「点検項目を足す」に1回で進める。
// 空の設備・履歴・年間計画の画面にも足す窓へ進むボタンがある。ボタンは44px以上・横にはみ出さない・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const info=async()=>p.evaluate(()=>({t:document.getElementById('app').innerText,btn:[...document.querySelectorAll('#app button')].map(x=>({t:x.textContent.trim(),h:x.getBoundingClientRect().height})),sw:document.documentElement.scrollWidth}));
 const h=await info();
 if(!/はじめに|最初に|まず/.test(h.t))bad.push('ホームに「まず何をするか」の案内が出ない');
 const ban=h.btn.find(x=>/棟を足す|棟を登録|場所を登録|棟を追加/.test(x.t)),koumoku=h.btn.find(x=>/点検項目を(足す|追加|登録)/.test(x.t));
 if(!ban)bad.push('ホームに「棟を足す」ボタンが無い');else if(ban.h<44)bad.push('棟を足すボタンが小さい '+ban.h);
 if(!koumoku)bad.push('ホームに「点検項目を足す」ボタンが無い');else if(koumoku.h<44)bad.push('点検項目を足すボタンが小さい '+koumoku.h);
 if(h.sw>392)bad.push('ホームが横にはみ出す '+h.sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // 設備だけ登録してある端末（場所・予定・日常点検はまだ）では「はじめに」は出さない（S.equipment を見る）
 await p.evaluate(()=>{S.equipment.push({id:'eqHF',name:'設備1',repairs:[]});go('home')});await p.waitForTimeout(200);
 if(await p.evaluate(()=>!!document.getElementById('startGuide')))bad.push('設備が登録してあるのに「はじめに」が出る（S.equipment を見ていない）');
 await p.evaluate(()=>{S.equipment=S.equipment.filter(e=>e.id!=='eqHF');go('home')});await p.waitForTimeout(150);
 for(const [name,open] of [['設備',"go('equip')"],['履歴',"go('hist')"],['年間計画',"go('year')"]]){
  await p.evaluate(open);await p.waitForTimeout(300);const r=await info();
  const bt=r.btn.filter(x=>/足す|追加|登録|点検/.test(x.t));
  if(!bt.length)bad.push(name+'の空の画面に足すボタンが無い');else if(Math.min(...bt.map(x=>x.h))<44&&!bt.some(x=>x.h>=44))bad.push(name+'の足すボタンが小さい');
  if(r.sw>392)bad.push(name+'が横にはみ出す '+r.sw);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
