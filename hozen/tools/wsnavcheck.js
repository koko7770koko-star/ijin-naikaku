// 作業表：前の2週・次の2週・今日で期間が動く。予定が無いとき入口が出る。390px ではみ出さず44px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.works=[];V.wsFrom=null;go('workSheet')});await p.waitForTimeout(300);
 const h=()=>p.evaluate(()=>document.querySelector('#app h1').textContent);
 const h0=await h();
 await p.click('#app button:has-text("次の2週")');await p.waitForTimeout(200);const h1=await h();if(h1===h0)bad.push('次の2週で動かない');
 await p.click('#app button:has-text("前の2週")');await p.waitForTimeout(200);if(await h()!==h0)bad.push('前の2週で戻らない');
 await p.click('#app button:has-text("次の2週")');await p.click('#app button:has-text("今日")');await p.waitForTimeout(200);if(await h()!==h0)bad.push('今日で戻らない');
 const r=await p.evaluate(()=>{const bt=[...document.querySelectorAll('#app button')].filter(x=>/前の2週|次の2週|今日|カレンダーで予定を足す|作業指示書を作る/.test(x.textContent));return{n:bt.length,min:Math.min(...bt.map(x=>x.getBoundingClientRect().height)),sw:document.documentElement.scrollWidth}});
 if(r.n<5)bad.push('ボタンが足りない '+r.n);if(r.min<44)bad.push('ボタンが小さい '+r.min);if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 await p.click('#app button:has-text("カレンダーで予定を足す")');await p.waitForTimeout(300);if(!await p.evaluate(()=>!!document.querySelector('.cal')))bad.push('カレンダーへ行けない');
 await p.screenshot({path:process.env.SHOT||'/tmp/ws.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
