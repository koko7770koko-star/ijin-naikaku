// 空の画面の案内：予備品・工具・測定器・図面・技術資料が空のとき、「まだありません」だけでなく
// 登録すると何ができるかの案内と、その場の追加ボタン（44px以上）が出て、押すと入力の窓が開くことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 for(const [name,open,modalId] of [['予備品',"S.parts=[];go('stock',{stTab:'parts'})",'#pt_name'],['工具・測定器',"S.tools=[];go('stock',{stTab:'tools'})",'#tl_name'],['図面',"S.drawings=[];go('dwgs')",null],['技術資料',"S.library=[];go('lib')",null]]){
  await p.evaluate(open);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const e=document.querySelector('#app .emptyg');const bt=e&&e.querySelector('button');return e?{t:e.innerText,h:bt?bt.getBoundingClientRect().height:0,sw:document.documentElement.scrollWidth}:null});
  if(!r){bad.push(name+'：案内が出ない');continue}
  if(!/登録/.test(r.t)||r.t.length<20)bad.push(name+'：案内の言葉が短い '+r.t);if(r.h<44)bad.push(name+'：追加ボタンが小さい '+r.h);if(r.sw>392)bad.push(name+'：横にはみ出す');
  if(process.argv[2]&&name==='予備品')await p.screenshot({path:process.argv[2]});
  await p.click('#app .emptyg button');await p.waitForTimeout(400);
  const m=await p.evaluate(()=>document.querySelector('#modal').innerText.length);if(m<10)bad.push(name+'：ボタンで入力の窓が開かない');
  await p.evaluate(()=>closeModal(true));
 }
 // 1件あるときは案内を出さない
 await p.evaluate(()=>{S.parts=[{id:'p1',code:'',name:'ヒューズ',spec:'',maker:'',place:'',unit:'個',qty:3,min:'',price:'',equipIds:[],note:''}];save();go('stock',{stTab:'parts'})});await p.waitForTimeout(300);
 if(await p.evaluate(()=>!!document.querySelector('#app .emptyg')))bad.push('予備品がある のに案内が出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
