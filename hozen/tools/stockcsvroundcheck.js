// 予備品CSVの往復の確認：書き出したCSVを（UTF-8 BOM付き・Excel で保存し直した Shift_JIS の両方で）そのまま読み込んでも、
// 品目が二重に増えない（品番なし・名前に「〜」「−」「㎾」がある品目も同じ物と見る）・在庫の数・保管場所・最低在庫・使用設備が変わらない。
// Shift_JIS では「〜」→「～」、「−」→「－」、表せない字（㎾）→「?」になる。保存の形・保存キーは変えない。
// usage: node hozen/tools/stockcsvroundcheck.js
const {chromium}=require('playwright');const path=require('path');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const toSjis=t=>execFileSync('python3',['-I','-c','import sys;sys.stdout.buffer.write(sys.stdin.buffer.read().decode("utf-8").encode("cp932","replace"))'],{input:Buffer.from(t,'utf-8')});
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const setup=()=>p.evaluate(()=>{
  S.equipment=[{id:'e1',code:'',name:'動力盤−2（3㎾）',place:'',photos:[],docs:[],repairs:[]}];
  S.parts=[{id:'p1',code:'F-10',name:'ヒューズ 10A',spec:'ガラス管',maker:'甲',place:'棚1',unit:'本',qty:12,min:5,price:80,equipIds:['e1'],note:''},
   {id:'p2',code:'',name:'端子台 10〜20A',spec:'',maker:'',place:'棚2',unit:'個',qty:3,min:1,price:'',equipIds:[],note:''},
   {id:'p3',code:'',name:'電磁接触器 0.4㎾',spec:'',maker:'',place:'',unit:'個',qty:0,min:'',price:'',equipIds:['e1'],note:''},
   {id:'p4',code:'',name:'ケーブル −10m',spec:'',maker:'',place:'倉庫',unit:'本',qty:2,min:'',price:'',equipIds:[],note:''}];
  S.moves=[];save();go('stock')});
 const snap=()=>p.evaluate(()=>JSON.stringify(S.parts.map(x=>[x.id,x.code,x.name,x.place,x.qty,x.min,x.unit,(x.equipIds||[]).join()])));
 const exportCsv=()=>p.evaluate(()=>{let t='';window.download=async(n,b)=>{t=await b.text();return true};try{download=window.download}catch(e){}exportStockCsv();return new Promise(r=>setTimeout(()=>r(t),300))});
 const run=async(label,bytesOf)=>{
  await setup();await p.waitForTimeout(200);const before=await snap();const csv=await exportCsv();if(!csv){bad.push(label+'：書き出しが空');return}
  const buf=bytesOf(csv);
  const P=await p.evaluate(a=>{const P=planStockCsv(csvDecode(new Uint8Array(a).buffer));return {n:P.items.length,nNew:P.items.filter(x=>!x.ex).length,s:P.skip,eq:P.items.map(x=>x.o.equipIds.join())}},[...buf]);
  if(P.n!==4||P.nNew!==0||P.s.length)bad.push(label+'：読み込みの計画 '+JSON.stringify(P));
  if(P.eq&&(P.eq[0]!=='e1'||P.eq[2]!=='e1'))bad.push(label+'：使用設備が結びつかない '+JSON.stringify(P.eq));
  await p.evaluate(a=>{PENDING_STOCKCSV=planStockCsv(csvDecode(new Uint8Array(a).buffer));return applyStockCsv()},[...buf]);await p.waitForTimeout(500);
  const after=await snap();
  const ls=await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).parts.length);
  if(ls!==4)bad.push(label+'：保存された品目数 '+ls);
  // 名前は CSV の文字（～ や ?）に書き換えない＝上書きでも名前の列は入れ替えるので、元の名前が残るかを見る
  const A=JSON.parse(after),B=JSON.parse(before);
  if(A.length!==B.length)bad.push(label+'：品目数 '+A.length+'（'+B.length+' のはず）');
  else A.forEach((x,i)=>{const y=B[i];if(x[0]!==y[0]||x[2]!==y[2]||x[4]!==y[4]||x[3]!==y[3]||x[5]!==y[5]||x[7]!==y[7])bad.push(label+'：'+y[2]+' が変わった '+JSON.stringify(x))});
  await p.evaluate(()=>{document.querySelector('#undobar button').click()});await p.waitForTimeout(200);
  if(await snap()!==before)bad.push(label+'：元に戻しても同じにならない');
 };
 await run('UTF-8',t=>Buffer.from(t.startsWith('﻿')?t:'﻿'+t,'utf-8'));
 await run('Shift_JIS',t=>toSjis(t.replace(/^﻿/,'')));
 // 照合の部品：別の名前は同じにしない
 const sm=await p.evaluate(()=>[csvSame('端子台 10～20A','端子台 10〜20A'),csvSame('電磁接触器 0.4?','電磁接触器 0.4㎾'),csvSame('端子台 10A','端子台 20A'),csvSame('ab?','abcd')]);
 if(JSON.stringify(sm)!=='[true,true,false,false]')bad.push('csvSame '+JSON.stringify(sm));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
