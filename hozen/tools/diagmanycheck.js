// 健全度の診断（go('diag')）：設備 2000 台・場所 3400・異常案件 5000・測定記録 2 万件で、健全度・推奨と傾向・故障分析・測定記録の 4 つのタブが
// それぞれ 1 秒以内に出て、下のお知らせの数が出て、ホームも 1 秒以内、390px ではみ出さないか（hz-v-diag-many）。
// 結果が前と同じかは、git stash で前の版と画面の文字を比べて確かめた（2026-11-08）。保存の形は変えない。usage: node hozen/tools/diagmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=1000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY,L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;
  S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:['変圧器','遮断器','発電機'][i%3],locId:L[(i*7)%L.length].id,status:'稼働',importance:'ABC'[i%3],installed:'2005-04',life:20,photos:[],repairs:[],docs:[],health:[{date:addD(T,-30),score:3}]}));
  S.issues=[...Array(5000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%1000)),equipId:'e'+(i%2000),title:'異常'+i,status:i%4?'完了':'対応中',failure:i%2===0,downH:String(i%5),closed:addD(T,-(i%1000)),cost:''}));
  S.meas=[...Array(20000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%1000)),equipId:'e'+(i%2000),type:'絶縁抵抗',tplId:'t'+(i%3),name:'絶縁',rows:[{name:'R',v:String(i%50),min:'5',max:'',unit:'MΩ'}],note:''}));save()});
 await p.waitForTimeout(500);const tm={};const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 for(const t of ['health','rec','fail','meas']){const s=Date.now();await p.evaluate(t=>{V.dgTab=t;go('diag')},t);await raf();tm[t]=Date.now()-s;
  const n=await p.evaluate(()=>document.querySelector('#app').innerText.length);if(n<200)bad.push(t+' が空');
  if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push(t+' がはみ出す')}
 await p.evaluate(()=>{V.dgTab='health';go('diag')});await raf();const items=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].length);if(items<2000)bad.push('健全度の行 '+items);
 let s=Date.now();await p.evaluate(()=>go('home'));await raf();tm.home=Date.now()-s;
 const badge=await p.evaluate(()=>document.querySelector('nav').innerText.length);if(!badge)bad.push('下のボタンが出ない');
 for(const k in tm)if(tm[k]>LIM)bad.push(k+' '+tm[k]+'ms');
 const sv=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return [o.issues.length,o.meas.length]});if(sv[0]!==5000||sv[1]!==20000)bad.push('保存の件数 '+sv);
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
