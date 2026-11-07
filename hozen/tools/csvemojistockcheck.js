// 予備品の CSV の書き出し→読み込み：品名・仕様・メーカー・保管場所の絵文字（🔥）・異体字（𠮷・葉＋異体字の印）・丸数字・タブ・全角空白・半角カナが
// 元の字のまま戻り、件数が変わらず読み飛ばしが出ない・BOM のあり・なしでも同じか（hz-v-csv-emoji-stock）。保存の形は変えない。usage: node hozen/tools/csvemojistockcheck.js
// （書き出しは UTF-8。Shift_JIS のファイルにはもともと絵文字が入らないので、Shift_JIS は csvsjischeck のまま）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext();const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 const r=await p.evaluate(async()=>{const N=['🔥ヒューズ','𠮷野の部品','葉\u{E0100}製','①号\tタブ','全角　空白','ﾊﾝｶｸ ｶﾅ','👨‍🔧工具'];
  S.parts=N.map((n,i)=>({id:'p'+i,code:'P-'+i,name:n,spec:n,maker:n,place:n,qty:i,unit:'個',min:'',price:'',equipIds:[],note:''}));
  {const v=validateData(clone(S));if(v.ok)S.parts=migrate(v.data,true).parts}
  let t='';const orig=window.download;window.download=async(n,bl)=>{t=await bl.text();return true};try{download=window.download}catch(e){}
  exportStockCsv();await new Promise(r=>setTimeout(r,300));try{download=orig}catch(e){}
  const diff=[];for(const [label,txt] of [['BOMあり',t],['BOMなし',t.replace(/^﻿/,'')]]){const P=planStockCsv(txt);if(P.fatal){diff.push(label+'：'+P.fatal);continue}
   if(P.items.length!==N.length)diff.push(label+'：件数 '+P.items.length+'≠'+N.length);if((P.skip||[]).length)diff.push(label+'：読み飛ばし '+P.skip.join('|'));
   P.items.forEach((x,i)=>['name','spec','maker','place'].forEach(k=>{if(x.o[k]!==N[i])diff.push(label+'：'+k+' '+JSON.stringify(x.o[k])+'≠'+JSON.stringify(N[i]))}))}
  return {len:t.length,diff}});
 if(!r.len)errs.push('書き出しが空');r.diff.forEach(x=>errs.push(x));
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
