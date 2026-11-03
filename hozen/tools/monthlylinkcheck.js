// 月報（monthly）の「5. 異常案件」：行を押すと不具合の編集が開き、設備に結ばれた案件は「設備のカルテを開く」（44px以上・印刷には出さない）で設備カルテへ飛ぶ。390pxではみ出さない・保存データは変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const setup=()=>p.evaluate(()=>{closeModal(true);const ym=TODAY.slice(0,7);S.tasks=[];S.daily={};
  S.equipment=[{id:'q1',code:'E-1',name:'設備ア',place:'C棟',kind:'',status:'稼働',repairs:[]}];
  const mk=(id,eq)=>({id,date:ym+'-01',title:'異常'+id,place:'C棟',status:'発見',detail:'',action:'',photos:[],equipId:eq,closed:'',cost:''});
  S.issues=[mk('i1','q1'),mk('i2','')];V.ry=now.getFullYear();V.rm=now.getMonth()+1;go('report',{rmode:'m'});return JSON.stringify(S.issues)});
 const before=await setup();await p.waitForTimeout(300);
 const rows=await p.evaluate(()=>[...document.querySelectorAll('.rep tr.lk')].map(r=>({b:r.querySelector('.mlk')?r.querySelector('.mlk').getBoundingClientRect().height:0,np:r.querySelector('.mlk')?r.querySelector('.mlk').classList.contains('noprint'):false})));
 if(rows.length!==2)bad.push('案件の行が2つでない '+rows.length);
 else{if(rows[0].b<44)bad.push('設備カルテのボタンが無いか44px未満');if(!rows[0].np)bad.push('ボタンが印刷に出る');if(rows[1].b)bad.push('設備の無い案件にボタンが出る')}
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 await p.emulateMedia({media:'print'});if(await p.evaluate(()=>{const e=document.querySelector('.mlk');return e&&getComputedStyle(e).display!=='none'}))bad.push('印刷でボタンが見える');await p.emulateMedia({media:'screen'});
 await p.evaluate(()=>document.querySelectorAll('.rep tr.lk')[1].click());await p.waitForTimeout(250);
 if(!await p.evaluate(()=>document.querySelector('#mask').classList.contains('on')))bad.push('行を押しても不具合の編集が開かない');
 await p.evaluate(()=>closeModal(true));
 await p.evaluate(()=>document.querySelector('.rep .mlk').click());await p.waitForTimeout(250);
 const st=await p.evaluate(()=>({v:V.view,eq:V.eq,mask:document.querySelector('#mask').classList.contains('on')}));
 if(st.v!=='equipDetail'||st.eq!=='q1')bad.push('設備カルテへ飛ばない '+JSON.stringify(st));if(st.mask)bad.push('飛んだのに窓が残る');
 if(await p.evaluate(()=>JSON.stringify(S.issues))!==before)bad.push('保存データが変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
