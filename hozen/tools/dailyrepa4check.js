// 日報の印刷：ふつうの1日分（日常点検 10 項目・作業 3 件・測定 3 件・盤 10 面・申し送り 5 行・特記事項）が A4 1枚に収まる。
// 印刷の文字は 9.5pt 以上・画面の文字の大きさは変わらない（hz-v-dailyrep-a4）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const ds='2025-06-10';const r={by:'点検者',done:Date.now(),c:{}};numDefs().forEach((n,i)=>r[n.id]=String(10+i));chkDefs().forEach(c=>r.c[c.id]='○');S.daily[ds]=r;
  for(let i=0;i<3;i++)S.tasks.push({id:'dra'+i,date:ds,time:'1'+i+':00',kind:'月次',cat:'',title:'試しの作業'+i+' 受変電設備の外観点検',place:'',staff:'担当',attend:'',status:'完了',result:'良',note:'',photos:[]});
  S.meas=S.meas||[];for(let i=0;i<3;i++)S.meas.push({id:'dram'+i,date:ds,equipId:'',name:'絶縁抵抗測定'+i,rows:[{name:'R相',v:'100',unit:'MΩ'},{name:'S相',v:'120',unit:'MΩ'},{name:'T相',v:'110',unit:'MΩ'}]});
  const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});const L=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1')];for(let i=0;i<10;i++)L.push(mk('p'+i,'盤'+i,'盤','f1'));S.locs=L;
  S.handover=S.handover||{};S.handover[ds]={text:'申し送り1行目\n2行目\n3行目\n4行目\n5行目',by:'',at:Date.now()};S.dnotes=S.dnotes||{};S.dnotes[ds]='特記事項 1 行';
  go('dailyRep',{day:ds})});await p.waitForTimeout(400);
 const scr=await p.evaluate(()=>getComputedStyle(document.querySelector('.rep')).fontSize);
 if(scr!=='12px')bad.push('画面の日報の文字の大きさが変わった '+scr);
 await p.emulateMedia({media:'print'});
 const pf=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('.rep td,.rep th')].map(e=>parseFloat(getComputedStyle(e).fontSize))));
 if(pf<12.6)bad.push('印刷の文字が 9.5pt より小さい '+pf+'px');
 const buf=await p.pdf({format:'A4'});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 if(n!==1)bad.push('A4 '+n+' 枚になる（1枚に収まらない）');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
