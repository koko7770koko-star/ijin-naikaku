// 技術資料の確認：名前の長い資料が25件（空白なしの長い英数字を含む）あっても、390px で行が切れず・重ならず・横にはみ出さず、検索で絞れることを確かめる。
// usage: node hozen/tools/libmanycheck.js [スクリーンショットの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.library=[...Array(25)].map((_,i)=>({id:'l'+i,title:i%2?'高圧受電設備 真空遮断器 取扱説明書 保守点検要領 第'+i+'版（メーカー提出資料の写し）':'VCB-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ-'+i,tags:'真空遮断器 取扱説明書 保安規程 点検要領 メーカー名 型式 '+'タグ'.repeat(10),text:i%3?'開閉回数の目安 VCB 仕様':'',file:i%4?'':'f'+i,type:'application/pdf',equipIds:[]}));go('lib')});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')];const w=document.documentElement.clientWidth;
  return {n:it.length,sw:document.documentElement.scrollWidth,cut:it.filter(e=>e.scrollWidth>e.clientWidth+1||e.getBoundingClientRect().right>w+1).length,small:it.filter(e=>e.getBoundingClientRect().height<44).length,ov:it.some((e,i)=>i&&e.getBoundingClientRect().top<it[i-1].getBoundingClientRect().bottom-1)}});
 if(r.n<25)bad.push('一覧が '+r.n+' 件しか出ない');if(r.sw>392)bad.push('横にはみ出す '+r.sw);if(r.cut)bad.push('行が切れる '+r.cut);if(r.small)bad.push('44px未満の行 '+r.small);if(r.ov)bad.push('行が重なる');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>{V.libQ='取扱説明書';render()});await p.waitForTimeout(200);
 const s=await p.evaluate(()=>({t:document.querySelector('#app').innerText,sw:document.documentElement.scrollWidth}));
 if(!/件見つかりました/.test(s.t))bad.push('検索の件数が出ない');if(s.sw>392)bad.push('検索結果がはみ出す '+s.sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
