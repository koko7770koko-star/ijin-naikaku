// 図面の探す欄の確認（hz-dwg-search）：20枚で探す欄が出て絞れる・0件のとき「条件を外す」（44px以上）で全部に戻る・390pxではみ出さない・保存データは変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.drawings=Array.from({length:20},(_,i)=>({id:'d'+i,name:(i%2?'単線結線図':'配置図')+'-'+i,kind:i%2?'単線結線図':'配置図',locId:'',vers:[],pins:[]}));V.dwgQ='';go('dwgs')});await p.waitForTimeout(300);
 const before=await p.evaluate(()=>JSON.stringify(S.drawings));
 const cnt=()=>p.evaluate(()=>document.querySelectorAll('#app .item').length);
 if(!await p.evaluate(()=>!!document.querySelector('#dwgQ')))bad.push('探す欄が出ない');
 if(await cnt()!==20)bad.push('初めに20件出ない');
 await p.evaluate(()=>{V.dwgQ='配置図';render()});await p.waitForTimeout(150);if(await cnt()!==10)bad.push('絞れない：'+await cnt());
 await p.evaluate(()=>{V.dwgQ='ありえない言葉';render()});await p.waitForTimeout(150);
 const bh=await p.evaluate(()=>{const e=document.querySelector('#dwgQClr');return e?e.getBoundingClientRect().height:0});
 if(!bh)bad.push('0件で「条件を外す」が出ない');else if(bh<44)bad.push('条件を外すが44px未満');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 if(bh){await p.click('#dwgQClr');await p.waitForTimeout(200);if(await cnt()!==20)bad.push('条件を外しても全部に戻らない');if(await p.evaluate(()=>document.querySelector('#dwgQ').value))bad.push('探す欄が空にならない')}
 if(await p.evaluate(()=>JSON.stringify(S.drawings))!==before)bad.push('保存データが変わった');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
