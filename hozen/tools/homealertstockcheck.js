// ホームの知らせ：測定器の校正期限切れ・30 日以内・返却予定日を過ぎた貸出・在庫不足が出て、（「ほか n件を表示」の中も含め）押すと在庫（工具・予備品）の画面へ 1 回で進む。工具の知らせはその工具の窓が開く（hz-v-alert-open-item）（hz-v-tool-cal-home・hz-v-stock-low-home）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof go==='function');
 await p.evaluate(()=>{S.tools=S.tools||[];S.parts=S.parts||[];
  S.tools.push({id:'tA',kind:'測定器',code:'',name:'絶縁抵抗計A',maker:'',model:'',serial:'',place:'',calDue:addD(TODAY,-3),calCycleM:12,note:'',calHist:[],loans:[]});
  S.tools.push({id:'tB',kind:'測定器',code:'',name:'検電器B',maker:'',model:'',serial:'',place:'',calDue:addD(TODAY,10),calCycleM:12,note:'',calHist:[],loans:[{out:addD(TODAY,-5),due:addD(TODAY,-1),to:'職員1',back:''}]});
  S.parts.push({id:'pA',code:'',name:'ヒューズ30A',spec:'',maker:'',place:'',unit:'個',qty:1,min:3,price:'',equipIds:[],note:''});save();V.moreAl=true;go('home')});await p.waitForTimeout(500);
 const want=[['絶縁抵抗計A','校正期限切れ','tools'],['検電器B','校正期限まであと','tools'],['検電器B','返却予定日を過ぎ','tools'],['在庫不足','ヒューズ30A','parts']];
 for(const [a,k,tab] of want){
  const ok=await p.evaluate(([a,k])=>{const el=[...document.querySelectorAll('#app [onclick]')].reverse().find(e=>e.textContent.includes(a)&&e.textContent.includes(k));if(!el)return false;el.scrollIntoView();el.click();return true},[a,k]);
  if(!ok){bad.push(`ホームに「${a}…${k}」の知らせが無い`);continue}
  await p.waitForTimeout(300);const v=await p.evaluate(()=>[V.view,V.stTab]);
  if(v[0]!=='stock'||v[1]!==tab)bad.push(`「${a}…${k}」を押して在庫の ${tab} に行かない（${v}）`);
  if(tab==='tools'){const nm=await p.evaluate(()=>{const m=document.querySelector('#modal.on,#modal');const i=document.getElementById('tl_name');return i&&i.offsetParent!==null?i.value:''});if(nm!==a)bad.push(`「${a}…${k}」を押してもその工具の窓が開かない（${nm||'窓なし'}）`);await p.evaluate(()=>{try{closeModal(true)}catch(e){}})}
  await p.evaluate(()=>{V.moreAl=true;go('home')});await p.waitForTimeout(300);}
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('390px で横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
