// 作業標準：40件あるとき、探す欄（名称・文書番号・種別）で絞れる・件数が「n/40件」になる・Enter でも押しても動く・解除で全部に戻る・0件のとき案内が出る。
// 探す欄とボタンは44px以上・390pxで横にはみ出さない。記録は変えない。名前は「作業標準１」の形だけ。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{S.stds=[...Array(40)].map((_,i)=>({id:'sd'+i,name:'作業標準'+(i+1),docNo:'DOC-'+String(i+1).padStart(3,'0'),ver:'1',kinds:[i%2?'停電作業':'点検'],pre:[{text:'確認',req:true}],post:[{text:'確認',req:true}],note:'',approvedBy:'',approvedDate:'',hist:[]}));save();V.stdQ='';go('stds');return JSON.stringify(S.stds)});
 await p.waitForTimeout(300);
 const n=()=>p.evaluate(()=>({items:document.querySelectorAll('#app .item').length,head:(document.querySelector('#app h2')||{}).innerText||'',txt:document.querySelector('#app').innerText,sw:document.documentElement.scrollWidth,iw:innerWidth}));
 const g=await p.evaluate(()=>{const i=document.getElementById('std_q');if(!i)return null;const bt=[...i.parentElement.querySelectorAll('button')].map(x=>x.getBoundingClientRect().height);return {ih:i.getBoundingClientRect().height,bt}});
 ok(!!g,'探す欄が出ない');if(g){ok(g.ih>=44,'探す欄が小さい '+g.ih);ok(g.bt.every(h=>h>=44),'探すボタンが小さい '+g.bt)}
 let r=await n();ok(r.items===40&&/40件/.test(r.head),'最初に40件出ない '+r.items+r.head);
 await p.fill('#std_q','DOC-007');await p.click('#std_q ~ button');await p.waitForTimeout(250);r=await n();ok(r.items===1&&/1\/40件/.test(r.head),'文書番号で絞れない '+r.items+r.head);
 await p.fill('#std_q','停電');await p.press('#std_q','Enter');await p.waitForTimeout(250);r=await n();ok(r.items===20&&/20\/40件/.test(r.head),'種別（Enter）で絞れない '+r.items+r.head);
 await p.fill('#std_q','存在しない言葉');await p.press('#std_q','Enter');await p.waitForTimeout(250);r=await n();ok(r.items===0&&/作業標準はありません/.test(r.txt),'0件の案内が出ない');ok(r.sw<=r.iw,'横にはみ出す');
 const clr=await p.evaluate(()=>{const bt=[...document.querySelectorAll('#app button')].find(x=>/解除|クリア|全部|消す/.test(x.textContent));return bt?{t:bt.textContent,h:bt.getBoundingClientRect().height}:null});
 ok(!!clr,'絞りを解除するボタンが無い');if(clr){ok(clr.h>=44,'解除ボタンが小さい '+clr.h);await p.evaluate(()=>[...document.querySelectorAll('#app button')].find(x=>/解除|クリア|全部|消す/.test(x.textContent)).click());await p.waitForTimeout(250);r=await n();ok(r.items===40,'解除で全部に戻らない '+r.items)}
 ok(await p.evaluate(()=>JSON.stringify(S.stds))===before,'記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
