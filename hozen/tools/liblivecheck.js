// 技術資料（lib）の検索欄：Enter や「検索」を押さなくても、打つと絞れる（350ms 後）。入力が消えない・フォーカスが外れない・
// 日本語の変換中は描画しない・空にすると全部に戻る・Enter でもすぐ絞れる。記録は変えない。通信は止める。（hz-lib-live-search）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>{S.library=[{id:'l1',title:'取扱説明書',tags:'VCB',text:'開閉回数の目安は vcb の仕様による',file:'',type:'',equipIds:[]},{id:'l2',title:'保安規程',tags:'',text:'停電の連絡の順番',file:'',type:'',equipIds:[]}];save();V.libQ='';go('lib');return JSON.stringify(S.library)});
 await p.waitForTimeout(300);
 const st=()=>p.evaluate(()=>{const i=document.getElementById('lib_q');const t=document.querySelector('#app').innerText;const m=t.match(/(\d+)件見つかりました/);return {hit:m?+m[1]:null,val:i&&i.value,foc:document.activeElement===i,q:V.libQ||'',sw:document.documentElement.scrollWidth}});
 ok((await st()).hit===null,'初めから絞られている');
 await p.click('#lib_q');await p.keyboard.type('VCB');
 await p.waitForFunction(()=>(V.libQ||'')==='VCB',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(100);
 let r=await st();ok(r.hit===1,'打っても絞れない '+r.hit);ok(r.val==='VCB','入力が消えた '+r.val);ok(r.foc,'描画の後に欄からフォーカスが外れた');ok(r.sw<=392,'はみ出す '+r.sw);
 await p.keyboard.type(' 開閉');await p.waitForFunction(()=>(V.libQ||'')==='VCB 開閉',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(100);
 r=await st();ok(r.val==='VCB 開閉','続けて打つと入力が崩れる '+r.val);ok(r.foc,'続けて打つとフォーカスが外れる');
 await p.fill('#lib_q','');await p.waitForFunction(()=>(V.libQ||'')==='',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(450);
 r=await st();ok(r.hit===null,'空にしても全部に戻らない '+r.hit);ok(r.foc,'空にした後フォーカスが外れた');
 await p.evaluate(()=>{const i=document.getElementById('lib_q');i.dispatchEvent(new CompositionEvent('compositionstart'));i.value='ていで';i.dispatchEvent(new Event('input'))});
 await p.waitForTimeout(600);r=await st();ok(r.q==='','変換中に描画された '+r.q);ok(r.val==='ていで','変換中の入力が消えた '+r.val);
 await p.evaluate(()=>{const i=document.getElementById('lib_q');i.value='停電';i.dispatchEvent(new CompositionEvent('compositionend'))});
 await p.waitForFunction(()=>(V.libQ||'')==='停電',null,{timeout:3000}).catch(()=>{});await p.waitForTimeout(100);r=await st();ok(r.hit===1,'変換の後に絞れない '+r.hit);
 await p.fill('#lib_q','保安');await p.press('#lib_q','Enter');await p.waitForTimeout(50);r=await st();ok(r.q==='保安','Enter ですぐ絞れない '+r.q);
 await p.waitForTimeout(500);
 ok(await p.evaluate(()=>JSON.stringify(S.library))===before,'記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
