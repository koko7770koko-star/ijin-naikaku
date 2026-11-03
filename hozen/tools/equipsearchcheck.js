// 設備台帳の確認：設備200台（点検項目300・異常300つき）で、開く・検索の1回の描画が速く（各 300ms 以内）、検索で絞れる・390px で行が切れず横にはみ出さないことを確かめる。
// usage: node hozen/tools/equipsearchcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.locs=[{id:'b1',name:'A棟',type:'建屋',parent:'',note:'',pos:{}},{id:'f1',name:'1F',type:'階',parent:'b1',note:'',pos:{}}];
  S.equipment=[...Array(200)].map((_,i)=>({id:'e'+i,code:'E-'+String(i+1).padStart(3,'0'),name:'設備'+i+'（名前の長い設備 高圧交流負荷開閉器）',kind:['変圧器','発電機','遮断器'][i%3],status:'稼働',importance:['A','B','C'][i%3],locId:'f1',maker:'メーカー'+(i%7),model:'型式'+i,place:'',run:{meters:[]},repairs:i%5?[]:[{id:'r'+i,date:TODAY,kind:'修理',content:'x',vendor:''}],docs:[],photos:[],health:[]}));
  S.items=[...Array(300)].map((_,i)=>({id:'it'+i,name:'点検'+i,cat:'受変電',cycle:'年1回',base:addD(TODAY,-300+i%200),who:'委託',equipId:'e'+(i%200),track:true}));
  S.issues=[...Array(300)].map((_,i)=>({id:'is'+i,date:addD(TODAY,-i%30),title:'異常'+i,place:'',status:i%4?'完了':'対応中',equipId:'e'+(i%200),action:'',closed:''}));
  save()});
 const t0=Date.now();await p.evaluate(()=>go('equip'));await p.waitForSelector('#eqQ');const open=Date.now()-t0;
 const ms=await p.evaluate(()=>{const s=performance.now();V.eqQ='E-1';render();const a=performance.now()-s;const s2=performance.now();V.eqQ='設備15';render();const b2=performance.now()-s2;const s3=performance.now();V.eqQ='';V.eqSort='due';render();const c3=performance.now()-s3;V.eqSort='code';V.eqQ='';return [a,b2,c3]});
 console.log('open',open,'ms; search',ms.map(x=>Math.round(x)).join('/'),'ms (E-1 / 設備15 / 期限順)');
 if(Math.max(...ms)>300)bad.push('1回の描画が遅い '+ms.map(x=>Math.round(x)).join('/')+'ms');if(open>1500)bad.push('開くのが遅い '+open);
 await p.evaluate(()=>{V.eqQ='設備15';render()});
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')];return {n:it.length,sw:document.documentElement.scrollWidth,cut:it.filter(e=>e.scrollWidth>e.clientWidth+1||e.getBoundingClientRect().right>innerWidth+1).length,clear:getComputedStyle(document.getElementById('eqQ')).appearance,type:document.getElementById('eqQ').type}});
 if(r.n!==11)bad.push('「設備15」で絞った件数が '+r.n+'（設備15・150〜159の11台のはず）');if(r.sw>392||r.cut)bad.push('390pxで切れる・はみ出す');if(r.type!=='search')bad.push('検索欄が search でなく×が出ない');
 await p.evaluate(()=>{V.eqQ='';render()});
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
