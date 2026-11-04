// 検索の表記ゆれ：設備・予備品・不具合・点検履歴の検索で全角/半角・大小・カタカナ/ひらがなの違いでも見つかる（保存する値は変えない）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const r=await p.evaluate(()=>{const out={};
  S.equipment=[{id:'e1',code:'VCB-1',name:'真空遮断器',kind:'VCB',status:'稼働'},{id:'e2',code:'TR-1',name:'トランス',kind:'変圧器',status:'稼働'}];
  S.parts=[{id:'p1',name:'ヒューズ',qty:3,min:'',equipIds:[]}];
  S.issues=[{id:'i1',title:'トランス異音',status:'未対応',urgency:'中',date:'2026-11-01',equipIds:[]}];
  const eq=q=>(S.equipment||[]).filter(e=>sFold([e.code,e.name,e.kind].join(' ')).includes(sFold(q))).length;
  out.f=[sFold('ＶＣＢ'),sFold('ﾄﾗﾝｽ'),sFold('トランス')];
  V.eqQ='ｖｃｂ';go('equip');out.eq1=document.querySelectorAll('#app .eq,#app .card').length;out.eqText=document.body.textContent.includes('真空遮断器');
  V.eqQ='とらんす';go('equip');out.eq2=document.body.textContent.includes('トランス')&&!document.body.textContent.includes('真空遮断器');
  V.eqQ='ＶＣＢ';go('equip');out.eq3=document.body.textContent.includes('真空遮断器');
  V.eqQ='';return out});await p.waitForTimeout(200);
 if(r.f[0]!=='vcb')bad.push('sFold が全角を直さない '+r.f[0]);
 if(r.f[1]!==r.f[2]||r.f[1]!=='とらんす')bad.push('sFold が半角ｶﾅ・カタカナをひらがなに揃えない '+r.f.join());
 if(!r.eqText)bad.push('設備：ｖｃｂ で見つからない');if(!r.eq2)bad.push('設備：とらんす で トランス だけが出ない');if(!r.eq3)bad.push('設備：ＶＣＢ で見つからない');
 // 不具合・予備品・点検履歴：画面を開いて検索語を入れても落ちず、該当が出る
 const txt=async(fn)=>{await p.evaluate(fn);await p.waitForTimeout(250);return p.evaluate(()=>document.body.textContent)};
 let t=await txt(()=>{V.isQ='ﾄﾗﾝｽ';V.isF='all';go('issues')});if(!/トランス異音/.test(t))bad.push('不具合：ﾄﾗﾝｽ で見つからない');
 t=await txt(()=>{V.isQ='とらんす';go('issues')});if(!/トランス異音/.test(t))bad.push('不具合：とらんす で見つからない');
 t=await txt(()=>{V.stTab='parts';V.ptQ='ﾋｭｰｽﾞ';go('stock')});if(!/ヒューズ/.test(t))bad.push('予備品：ﾋｭｰｽﾞ で見つからない');
 t=await txt(()=>{V.ptQ='ひゅーず';go('stock')});if(!/ヒューズ/.test(t))bad.push('予備品：ひゅーず で見つからない');
 t=await txt(()=>{V.ptQ='';S.daily={'2026-11-01':{c:{x1:'○'},note:'ブレーカー確認',by:'担当者'}};V.hKw='ﾌﾞﾚｰｶｰ';V.hRange='all';go('hist')});if(!/ブレーカー確認/.test(t))bad.push('点検履歴：ﾌﾞﾚｰｶｰ で見つからない');
 const keys=await p.evaluate(()=>Object.keys(S).sort().join());
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
