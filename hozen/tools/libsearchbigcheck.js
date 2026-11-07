// 技術資料の検索：資料 200 件（1 件 3 万字）で、資料の画面の検索・AI に送る資料の取り出しが速く（0.3 秒以内）、
// 語が本文の最後にだけある・題とタグにだけある場合も 1 秒以内で、見つけた位置（前後の文）が前のやり方（全文をたたむ）と同じか。
// 半角カナ（ﾊﾞｯﾃﾘｰ）・全角英数（ＶＣＢ）・大文字小文字も同じに見つかるか（hz-v-ai-lib-big）。保存の形は変えない。usage: node hozen/tools/libsearchbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{
  // 前のやり方（全文をたたむ）：見つけた位置を比べるための写し
  const oldMap=t=>{t=String(t==null?'':t);let f='';const st=[],en=[];for(let i=0;i<t.length;){let j=i+1;if(/[ﾞﾟ]/.test(t[j]||''))j++;const g=sFold(t.slice(i,j));for(let k=0;k<g.length;k++){f+=g[k];st.push(i);en.push(j)}i=j}return {f,st,en}};
  const oldPos=(d,q)=>{const w=sFold(q.split(/[\s　]+/)[0]),fm=oldMap(d.text),k=fm.f.indexOf(w);return k<0?-1:fm.st[k]};
  const para='受変電設備の点検手順。開閉操作の前に負荷を確認する。異臭があれば記録する。';const body=para.repeat(800).slice(0,29900);
  const R={};
  const t=(name,fn)=>{const s=performance.now();const x=fn();R[name]=Math.round(performance.now()-s);return x};
  // ① 語が本文の前の方にある 200 件
  S.library=[...Array(200)].map((_,i)=>({id:'lb'+i,title:'資料'+i,tags:'点検',text:body.slice(0,500)+'ＶＣＢの異音。ﾊﾞｯﾃﾘｰ'+body.slice(500),equipIds:[],file:'',type:''}));
  V.libQ='vcb 異音';t('画面（前の方）',()=>go('lib'));const h1=t('AI に送る 6 件',()=>libSearch('vcb 異音',6));
  // ② 語が本文の最後にだけある 200 件
  S.library.forEach(d=>d.text=body+'ＶＣＢの異音。');t('画面（最後だけ）',()=>libSearch('VCB'));
  // ③ 題とタグにだけある 200 件
  S.library.forEach(d=>{d.text=body;d.title='VCB 資料'});t('画面（題だけ）',()=>libSearch('vcb'));
  // 位置が前のやり方と同じか（いろいろな文）
  const docs=[{text:'ああﾊﾞｯﾃﾘｰ交換。バッテリー点検'},{text:'x'.repeat(100)+'ＶＣＢ と vcb と VCB'},{text:'ｶﾞｲｼ（碍子）の汚れ。ガイシ'},{text:'㍻元年の記録。平成'},{text:'無し'}].map((d,i)=>({id:'q'+i,title:'題'+i,tags:'',equipIds:[],file:'',type:'',...d}));
  S.library=docs;const qs=['バッテリー','ﾊﾞｯﾃﾘｰ','vcb','ガイシ','ｶﾞｲｼ','平成','題'];const diff=[];
  qs.forEach(q=>libSearch(q).forEach(h=>{const o=oldPos(h.d,q);if(o!==h.pos)diff.push(q+' '+h.d.id+' 新'+h.pos+' 旧'+o)}));
  const vcb=libSearch('ｖｃｂ').map(h=>h.mid);
  return {R,n1:h1.length,diff,vcb}});
 console.log(JSON.stringify(r.R));
 for(const [k,v] of Object.entries(r.R)){const lim=/最後|題/.test(k)?1000:300;if(v>lim)bad.push(k+' が遅い '+v+'ms（'+lim+'）')}
 if(r.n1!==6)bad.push('AI に送る資料が 6 件でない '+r.n1);
 if(r.diff.length)bad.push('見つけた位置が前のやり方と違う：'+r.diff.join('／'));
 if(r.vcb[0]!=='ＶＣＢ')bad.push('全角の ｖｃｂ で ＶＣＢ が見つからない '+JSON.stringify(r.vcb));
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('資料の画面が横にはみ出す');
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
