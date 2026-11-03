// 点検の印：保存する値は ○／済／延 のまま、画面は ◯（予定）・●（実施済み）で出ることを確かめる。
// usage: node hozen/tools/markcheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const fy=(()=>{const n=new Date();return n.getMonth()+1>=4?n.getFullYear():n.getFullYear()-1})();
 const old={settings:{name:'確認'},items:[{id:'it1',name:'確認項目',cat:'その他',cycle:'毎月'}],marks:{[fy]:{it1:['○','済','延','','','','','','','','','']}}};
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 // 古い記録は、起動のあとに入れて読み直す（起動前に差し込む方式は、読み直しでまれに二重に入って値が元に戻った）
 await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(old)]);await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>go('year'));await p.waitForTimeout(300);
 const cells=()=>p.$$eval('table.yr td.mk',a=>a.slice(0,4).map(x=>x.textContent));
 let c=await cells();if(c.join()!=='◯,●,延,')errs.push('古い記録の表示が違う: '+c.join());
 const saved=async()=>p.evaluate(([k,fy])=>JSON.parse(localStorage.getItem(k)).marks[fy].it1.slice(0,4),[KEY,fy]);
 // 空のマスを3回タップ：空→◯→●→空
 const cell=(i)=>p.locator('table.yr td.mk').nth(i);
 await cell(3).tap();await p.waitForTimeout(100);if((await cells())[3]!=='◯')errs.push('1回目で ◯ にならない');
 await cell(3).tap();await p.waitForTimeout(100);if((await cells())[3]!=='●')errs.push('2回目で ● にならない');
 let s=await saved();if(s[3]!=='済')errs.push('保存値が 済 でない: '+s[3]);
 await cell(3).tap();await p.waitForTimeout(100);if((await cells())[3]!=='')errs.push('3回目で空に戻らない');
 // 長押しで延期
 const bx=await cell(3).boundingBox();
 await p.evaluate(()=>markPress(S.items[0].id,3));await p.waitForTimeout(700);await p.evaluate(()=>markRelease());
 await p.waitForTimeout(100);s=await saved();if(s[3]!=='延')errs.push('長押しで 延 にならない: '+s[3]);
 if(bx.height<43)errs.push('マスの高さが44px未満: '+bx.height);
 // 延期モード：ボタンを押してマスをタップすると 延、もう一度で解除。モード外では ◯ ●
 await p.evaluate(()=>{S.marks[V.fy][S.items[0].id][3]='';save();render()});await p.waitForTimeout(100);
 await p.locator('#enjiBtn').tap();await p.waitForTimeout(100);
 await cell(3).tap();await p.waitForTimeout(100);s=await saved();if(s[3]!=='延')errs.push('延期モードで 延 にならない: '+s[3]);
 await cell(3).tap();await p.waitForTimeout(100);s=await saved();if(s[3]!=='')errs.push('延期モードで 延 が解除できない: '+s[3]);
 await p.locator('#enjiBtn').tap();await p.waitForTimeout(100);
 await cell(3).tap();await p.waitForTimeout(100);if((await cells())[3]!=='◯')errs.push('延期モードを終えても ◯ にならない');
 // 右クリック（マウス）で 延
 await p.evaluate(()=>{S.marks[V.fy][S.items[0].id][3]='';save();render()});await p.waitForTimeout(100);
 await p.evaluate(()=>{_mkTouchAt=0;_mkLong=false});
 await cell(3).click({button:'right'});await p.waitForTimeout(100);s=await saved();if(s[3]!=='延')errs.push('右クリックで 延 にならない: '+s[3]);
 await p.evaluate(()=>{_mkTouchAt=0;_mkLong=false});
 await cell(3).click({button:'right'});await p.waitForTimeout(100);s=await saved();if(s[3]!=='')errs.push('右クリックで 延 が解除できない: '+s[3]);
 await p.evaluate(()=>{S.marks[V.fy][S.items[0].id][3]='延';save();render()});await p.waitForTimeout(100);
 await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});s=await saved();if(s.join()!=='○,済,延,延')errs.push('読み直しで値が変わった: '+s.join());
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w);
 console.log(errs.length?'NG\n  '+errs.join('\n  '):'OK 印の表示と切り替え');await b.close();process.exit(errs.length?1:0)})();
