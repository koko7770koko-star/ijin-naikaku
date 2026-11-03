// 異常・修理：未完了に「発見から ○日」が出る、14日以上は強調、完了には出ない。390px で横にはみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=(id,d,st)=>({id,src:'m:'+id,date:addD(TODAY,-d),title:'件'+id,place:'',detail:'',status:st,action:'',closed:st==='完了'?TODAY:'',photos:[],equipId:'',urgency:'中',log:[]});
  S.issues.push(mk('n3',3,'未対応'),mk('n20',20,'対応中'),mk('c30',30,'完了'));save();V.isF='all';go('issues')});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const it=t=>[...document.querySelectorAll('#app .item')].find(x=>x.innerText.includes(t));const sm=t=>{const e=it(t);return e&&e.querySelector('.dt small')};
  const a=sm('件n3'),b=sm('件n20'),c=sm('件c30');return {a:a&&a.textContent,aOld:a&&a.classList.contains('old'),b:b&&b.textContent,bOld:b&&b.classList.contains('old'),bColor:b&&getComputedStyle(b).color,c:c&&c.textContent,sw:document.documentElement.scrollWidth}});
 if(r.a!=='発見から 3日'||r.aOld)bad.push('3日の表示 '+JSON.stringify(r));if(r.b!=='発見から 20日'||!r.bOld)bad.push('20日の強調 '+JSON.stringify(r));if(r.c)bad.push('完了に日数が出る');if(r.sw>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
