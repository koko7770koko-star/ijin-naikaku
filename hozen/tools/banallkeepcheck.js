// 盤の点検：階の「全部 ●」は延期（延）の印を上書きしない。取り消しで元に戻る。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(900);
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('l1','A棟','建屋',''),mk('l2','1F','階','l1'),mk('b1','盤1','盤','l2'),mk('b2','盤2','盤','l2')];
  const ym=TODAY.slice(0,7);S.banChk={[ym]:{b1:['延','',''],b2:['','○','']}};go('ban')});await p.waitForTimeout(300);
 await p.locator('button:has-text("全部 ●")').first().click();await p.waitForTimeout(200);
 let v=await p.evaluate(()=>{const ym=TODAY.slice(0,7);return JSON.stringify(S.banChk[ym])});
 if(JSON.parse(v).b1[0]!=='延')bad.push('延期の印が上書きされた '+v);
 if(JSON.parse(v).b1[1]!=='済'||JSON.parse(v).b2[0]!=='済')bad.push('● にならない '+v);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
