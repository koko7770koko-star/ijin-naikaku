// 「探す」の欄（設備台帳・異常の一覧・作業管理・在庫・工具・作業標準・メニュー・設備を選ぶ欄）：半角カナ（ﾊﾞｯﾃﾘｰ）・全角英数（ＶＣＢ）・小文字（vcb）で
// 同じ件数が見つかり、空白で区切った2語（「Ａ棟 vcb」）は両方を含む物だけが見つかるか（hz-v-equip-search-fold）。前は2語だと 0 件だった。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/searchwordscheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const T=TODAY,nm=i=>(i%2?'VCB ':'バッテリー ')+(i%3?'A棟':'B棟');
  S.equipment=[...Array(60)].map((_,i)=>({id:'e'+i,code:'E'+i,name:nm(i),place:'',kind:'変圧器',status:'稼働',photos:[],docs:[],health:[],repairs:[]}));
  S.issues=[...Array(60)].map((_,i)=>({id:'i'+i,date:addD(T,-i),title:nm(i),place:'',detail:'',action:'',status:'対応中',urgency:'中',equipId:'',photos:[],log:[]}));
  S.works=[...Array(60)].map((_,i)=>({id:'w'+i,date:addD(T,i),title:nm(i),content:'',result:'',status:'予定',equipIds:[],staff:[],pre:[],post:[],approvals:[],ky:[],parts:[],needQuals:[],photos:[],outage:{on:false}}));
  S.parts=[...Array(60)].map((_,i)=>({id:'p'+i,name:nm(i),code:'',spec:'',maker:'',place:'',qty:5,min:''}));
  S.tools=[...Array(60)].map((_,i)=>({id:'t'+i,name:nm(i),code:'',model:'',serial:'',maker:'',place:'',kind:'',calDue:''}));
  {const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['issues','equipment','works','parts','tools'])if(m[x])S[x]=m[x]}}
  const want={'VCB':30,'vcb':30,'ＶＣＢ':30,'ｖｃｂ':30,'バッテリー':30,'ﾊﾞｯﾃﾘｰ':30,'Ａ棟 vcb':20,'b棟　ﾊﾞｯﾃﾘｰ':10,'vcb 無い語':0};
  const scr=[['設備台帳',()=>{V.eqAll=1;go('equip')},'eqQ',q=>{V.eqQ=q},()=>(S.equipment).filter(e=>document.querySelector('#app').textContent.includes(e.code+' ')||0).length],
   ['異常の一覧',()=>{V.isF='all';go('issues')},'isQ',q=>{V.isQ=q}],['作業管理',()=>{V.wkF='all';go('works')},'wkQ',q=>{V.wkQ=q}],
   ['在庫（予備品）',()=>{V.stTab='parts';go('stock')},'ptQ',q=>{V.ptQ=q}],['工具・測定器',()=>{V.stTab='tools';go('stock')},'tlQ',q=>{V.tlQ=q}]];
  const R={};
  const cnt=(lab)=>{const t=document.querySelector('#app').innerText;return (t.match(/VCB [AB]棟|バッテリー [AB]棟/g)||[]).length};
  for(const [lab,open,,setq] of scr){R[lab]={};for(const q of Object.keys(want)){setq(q);open();R[lab][q]=cnt(lab)}setq('')}
  /* 2語の判定そのもの */
  R.sHit=typeof sHit==='undefined'?{}:{a:sHit('VCB A棟','ｖｃｂ　ａ棟'),b:sHit('VCB A棟','vcb b棟'),c:sHit('x',''),d:sHit('ﾊﾞｯﾃﾘｰ','バッテリー')};
  return {R,want}});
 const {R,want}=r;
 for(const [lab,o] of Object.entries(R)){if(lab==='sHit')continue;
  const base=o['VCB'];if(!base)bad.push(lab+'：VCB が見つからない');
  for(const q of ['vcb','ＶＣＢ','ｖｃｂ'])if(o[q]!==base)bad.push(lab+'：「'+q+'」の件数が VCB と違う '+o[q]+'/'+base);
  if(o['ﾊﾞｯﾃﾘｰ']!==o['バッテリー'])bad.push(lab+'：半角カナの件数が違う '+o['ﾊﾞｯﾃﾘｰ']+'/'+o['バッテリー']);
  if(!(o['Ａ棟 vcb']>0&&o['Ａ棟 vcb']<base))bad.push(lab+'：2語「Ａ棟 vcb」で絞れない '+o['Ａ棟 vcb']+'/'+base);
  if(!(o['b棟　ﾊﾞｯﾃﾘｰ']>0&&o['b棟　ﾊﾞｯﾃﾘｰ']<o['バッテリー']))bad.push(lab+'：全角空白の2語で絞れない '+o['b棟　ﾊﾞｯﾃﾘｰ']);
  if(o['vcb 無い語']!==0)bad.push(lab+'：無い語を含む2語で見つかる '+o['vcb 無い語'])}
 const h=R.sHit;if(!(h.a&&!h.b&&h.c&&h.d))bad.push('sHit の判定が違う '+JSON.stringify(h));
 console.log(JSON.stringify(R));
 /* メニューの検索・設備を選ぶ欄（2語） */
 const m=await p.evaluate(()=>{go('menu');const tiles=[...document.querySelectorAll('.mtile')];if(!tiles.length)return {skip:1};const t0=tiles[0].dataset.q||'';const w=t0.split(/\s+/).filter(Boolean);menuFilter(w[0]);const n1=tiles.filter(t=>t.style.display!=='none').length;menuFilter(w[0]+' 無い語ｘｙｚ');const n2=tiles.filter(t=>t.style.display!=='none').length;menuFilter('');return {n1,n2}});
 if(!m.skip&&!(m.n1>0&&m.n2===0))bad.push('メニューの2語の検索 '+JSON.stringify(m));
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
