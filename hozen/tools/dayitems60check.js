// 日常点検：項目 60（数字30・確認30、長い名前、数字の欄は単位つき）の日で、390px の標準・特大とも、入力欄と ○×－ のボタンが重ならず・横にはみ出さず、
// 最後の項目まで入れて保存し、読み直しても残ることを確かめる。保存の形は変えない。hz-v-day-many-items
// usage: node hozen/tools/dayitems60check.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const load=async()=>{await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150)};
 await load();
 await p.evaluate(()=>{S.settings.dnums=[...Array(30)].map((_,i)=>({id:'n'+i,name:'第'+i+'受電盤 主変圧器二次側 線間電圧（長い名前の測定項目）',short:'',unit:'kV',min:0,max:99999,chg:'',equip:'',req:false}));
  S.settings.dchecks=[...Array(30)].map((_,i)=>({id:'c'+i,name:'第'+i+'受電盤 遮断器まわりの異音・におい・発熱・表示灯の点灯状態の確認（長い名前）',req:false,equip:''}));save();go('day',{day:TODAY})});
 await p.waitForTimeout(400);
 const geo=tag=>p.evaluate(()=>{const R=e=>e.getBoundingClientRect(),W=document.documentElement.clientWidth,o=[];
  const ov=(a,b)=>{const x=R(a),y=R(b);return x.width&&y.width&&x.left<y.right-1&&y.left<x.right-1&&x.top<y.bottom-1&&y.top<x.bottom-1};
  const rows=[...document.querySelectorAll('#app .chk')];let cutL=0,small=0,over=0;
  rows.forEach(r=>{const bt=[...r.querySelectorAll('button')],l=r.querySelector('.l');
   for(let i=0;i<bt.length;i++){if(R(bt[i]).height<40||R(bt[i]).width<36)small++;if(R(bt[i]).right>W+1)cutL++;for(let j=i+1;j<bt.length;j++)if(ov(bt[i],bt[j]))over++;if(l&&ov(l,bt[i]))over++}});
  const ns=[...document.querySelectorAll('#app .num')];let nover=0,nsmall=0,ncut=0;
  ns.forEach(n=>{const i=n.querySelector('input'),l=n.querySelector('label');if(!i)return;if(R(i).height<44)nsmall++;if(R(i).right>W+1||R(n).right>W+1)ncut++;if(l&&ov(l,i))nover++});
  return {rows:rows.length,ns:ns.length,cutL,small,over,nover,nsmall,ncut,sw:document.documentElement.scrollWidth,W}});
 for(const fs of ['','xl']){
  await p.evaluate(f=>{S.settings.fscale=f||'m';save();applyFScale();render()},fs);await p.waitForTimeout(400);
  const g=await geo(),tag=fs?'特大':'標準';
  if(g.rows!==30)errs.push(tag+'：確認の行が '+g.rows);if(g.ns!==30)errs.push(tag+'：数字の欄が '+g.ns);
  if(g.cutL||g.ncut)errs.push(tag+'：画面の右にはみ出す');if(g.small)errs.push(tag+'：○×－ が小さい '+g.small);if(g.nsmall)errs.push(tag+'：入力欄が44px未満 '+g.nsmall);
  if(g.over||g.nover)errs.push(tag+'：文字とボタン／欄が重なる '+(g.over+g.nover));if(g.sw>g.W+2)errs.push(tag+'：横にはみ出す '+g.sw+'>'+g.W);
  if(fs&&process.argv[2])await p.screenshot({path:process.argv[2]})}
 // 最後の項目まで入れて保存し、読み直しても残る
 await p.locator('#n_n29').scrollIntoViewIfNeeded();await p.focus('#n_n29');await p.keyboard.type('6.6');await p.waitForTimeout(100);
 await p.evaluate(()=>{document.activeElement&&document.activeElement.blur()});
 const lastBtn=p.locator('.chk[data-ck="c29"] button').first();await lastBtn.scrollIntoViewIfNeeded();await lastBtn.click();await p.waitForTimeout(200);
 const v=await p.evaluate(()=>({n:S.daily[TODAY].n29,c:(S.daily[TODAY].c||{}).c29}));
 if(String(v.n)!=='6.6')errs.push('最後の数字が入らない '+v.n);if(v.c!=='○')errs.push('最後の確認が入らない '+v.c);
 await p.waitForTimeout(500);await load();
 const w=await p.evaluate(()=>({n:S.daily[TODAY]&&S.daily[TODAY].n29,c:S.daily[TODAY]&&(S.daily[TODAY].c||{}).c29,len:S.settings.dnums.length+S.settings.dchecks.length}));
 if(String(w.n)!=='6.6'||w.c!=='○')errs.push('読み直すと残らない '+JSON.stringify(w));if(w.len!==60)errs.push('項目の数が変わった '+w.len);
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
