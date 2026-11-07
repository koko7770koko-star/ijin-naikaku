// 過去の故障・修理・作業の検索（histCorpus・aiSearchHist）：異常 2000・修理 3000・作業 700（本文 1000 字）で、検索が 0.3 秒以内、
// 半角カナ（ﾊﾞｯﾃﾘｰ）・全角英数（ＶＣＢ）・小文字（vcb）でも同じ件数が見つかり、窓が 390px・特大で横にはみ出さないか（hz-v-search-global-big）。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/histcorpusbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const T=TODAY,body='う'.repeat(990);
  S.equipment=[...Array(300)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',status:'稼働',photos:[],docs:[],health:[],repairs:[...Array(10)].map((_,k)=>({id:'r'+i+'-'+k,date:addD(T,-k),kind:'修理',content:(k%3?'VCB 交換 ':'バッテリー 交換 ')+body,vendor:'',cost:'',photos:[]}))}));
  S.issues=[...Array(2000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%700)),title:i%2?'VCB 異音':'バッテリー 膨張',place:'',detail:body,action:'',status:'完了',urgency:'中',equipId:'e'+(i%300),photos:[],log:[]}));
  S.works=[...Array(700)].map((_,i)=>({id:'w'+i,date:addD(T,-(i%700)),title:'VCB 点検',content:body,result:'',status:'完了',equipIds:[],staff:[],pre:[],post:[],approvals:[],ky:[],parts:[],needQuals:[],photos:[]}));
  const R={};const t=q=>{const s=performance.now();const n=histCorpus(q).length;R[q]={n,ms:Math.round(performance.now()-s)}};
  ['VCB','vcb','ＶＣＢ','ｖｃｂ','バッテリー','ﾊﾞｯﾃﾘｰ','vcb 異音'].forEach(t);return R});
 console.log(JSON.stringify(r));
 for(const [q,x] of Object.entries(r))if(x.ms>300)bad.push('「'+q+'」の検索が遅い '+x.ms+'ms');
 for(const q of ['vcb','ＶＣＢ','ｖｃｂ'])if(r[q].n!==r['VCB'].n)bad.push('「'+q+'」の件数が VCB と違う '+r[q].n+'/'+r['VCB'].n);
 if(r['ﾊﾞｯﾃﾘｰ'].n!==r['バッテリー'].n)bad.push('半角カナ「ﾊﾞｯﾃﾘｰ」の件数が違う '+r['ﾊﾞｯﾃﾘｰ'].n+'/'+r['バッテリー'].n);
 if(!r['VCB'].n||!r['バッテリー'].n)bad.push('見つからない');
 const sw=await p.evaluate(()=>{S.settings.fscale='xl';applyScale&&applyScale();aiSearchHist('ｖｃｂ 異音');const m=document.querySelector('#modal');return {m:m.scrollWidth-m.clientWidth,d:document.documentElement.scrollWidth,n:document.querySelectorAll('#modal .item').length}}).catch(async()=>p.evaluate(()=>{aiSearchHist('ｖｃｂ 異音');const m=document.querySelector('#modal');return {m:m.scrollWidth-m.clientWidth,d:document.documentElement.scrollWidth,n:document.querySelectorAll('#modal .item').length}}));
 if(sw.m>1||sw.d>392)bad.push('検索の窓が横にはみ出す '+JSON.stringify(sw));if(!sw.n)bad.push('全角で探すと窓に何も出ない');
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
