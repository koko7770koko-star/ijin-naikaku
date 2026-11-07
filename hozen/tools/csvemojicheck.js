// 設備台帳 CSV の書き出し→読み込み（絵文字・異体字版。hz-v-csv-emoji）：名前などの絵文字（🔥）・異体字（𠮷・葉＋異体字の印）・丸数字・タブ・全角空白が元の字のまま戻るか。
// 元の csvquotecheck（記号・改行）と同じ作り。：名前・設置場所・メーカー・備考に「,」「"」「""」改行（LF・CRLF）・先頭の「=」が入っていても同じ値に戻る（前後の空白は取り込みで削る決まり）。
// 件数が変わらない・読み飛ばしが出ない・BOM を付けても同じ（hz-v-csv-quote）
// usage: node hozen/tools/csvemojicheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext();const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 const r=await p.evaluate(async()=>{const N=['🔥変圧器','𠮷野の盤','葉\u{E0100}室','①号機\tタブ','全角　空白','ﾊﾝｶｸ ｶﾅ','👨‍🔧作業'];
  S.equipment=N.map((n,i)=>({id:'e'+i,code:'E-'+i,name:n,place:n,maker:n,model:'',serial:'',installed:'',cycle:'',note:n,photos:[],docs:[],repairs:[]}));
  let t='';const orig=window.download;window.download=async(n,bl)=>{t=await bl.text();return true};try{download=window.download}catch(e){}
  exportEquipCsv();await new Promise(r=>setTimeout(r,300));try{download=orig}catch(e){}
  const diff=[];for(const [label,txt] of [['BOMあり',t],['BOMなし',t.replace(/^﻿/,'')]]){const P=planEquipCsv(txt);
   if(P.eqs.length!==N.length)diff.push(label+'：件数 '+P.eqs.length+'≠'+N.length);if(P.skip.length)diff.push(label+'：読み飛ばし '+P.skip.join('|'));
   P.eqs.forEach((x,i)=>['name','place','maker','note'].forEach(k=>{if(x.o[k]!==N[i])diff.push(label+'：'+k+' '+JSON.stringify(x.o[k])+'≠'+JSON.stringify(N[i]))}))}
  return {len:t.length,diff}});
 if(!r.len)errs.push('書き出しが空');r.diff.forEach(x=>errs.push(x));
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
