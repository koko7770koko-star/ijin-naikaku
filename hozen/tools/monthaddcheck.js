// カレンダー：日を押す→「＋ 追加」の2タップで、その日が入った状態で予定の窓が開く・ボタンが44px以上・押した日の予定の欄が画面に見える・はみ出さない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{go('month')});await p.waitForTimeout(300);
 const target=await p.evaluate(()=>{const y=V.y,m=V.m;const s=y+'-'+String(m).padStart(2,'0')+'-17';return s});
 const dayIdx=await p.evaluate(t=>{const ds=[...document.querySelectorAll('.cal .d')];return ds.findIndex(d=>(d.getAttribute('onclick')||'').includes(t))},target);
 if(dayIdx<0)bad.push('17日のマスが無い');
 else{
  await p.locator('.cal .d').nth(dayIdx).click();await p.waitForTimeout(400);
  const info=await p.evaluate(()=>{const x=[...document.querySelectorAll('#app .hd-row button')].find(b=>b.textContent.trim()==='＋ 追加');if(!x)return null;const r=x.getBoundingClientRect();return{h:r.height,w:r.width,top:r.top,bottom:r.bottom,vh:innerHeight,sw:document.documentElement.scrollWidth}});
  if(!info)bad.push('「＋ 追加」が無い');
  else{
   if(info.h<44)bad.push('追加ボタンが小さい '+info.h);
   if(info.sw>392)bad.push('横にはみ出す '+info.sw);
   if(info.top<0||info.bottom>info.vh)bad.push('日を押したあと「＋ 追加」が画面の外（top '+Math.round(info.top)+' / 高さ '+info.vh+'）');
  }
  await p.click('#app .hd-row button:has-text("＋ 追加")');await p.waitForTimeout(300);
  const dv=await p.evaluate(()=>{const e=document.querySelector('#t_date,input[type=date]');return e?e.value:null});
  if(dv!==target)bad.push('窓に押した日が入らない '+dv+' / '+target);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
