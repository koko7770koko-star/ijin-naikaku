// 作業指示書：協力会社・協力会社の作業者・KY実施者の欄に、前に入れた名前の候補（datalist）が出る（記録から重複を除く・「、」区切りは1人ずつ・初期値の名前は入れない）／
// 記録が無いときは候補が空で、欄は今までどおり入力できる／保存する値は文字列のまま。390pxではみ出さない。
// usage: node hozen/tools/worksnamescheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const opts=id=>p.evaluate(id=>[...document.querySelectorAll('#'+id+' option')].map(o=>o.value),id);
 // 記録なし：候補は空（初期値の名前を入れない）
 await p.evaluate(()=>{S.works=[];S.equipment=[];save();editWork()});await p.waitForTimeout(500);
 let v=await opts('dl_wkv'),vs=await opts('dl_wkvs');if(v.length||vs.length)bad.push('記録が無いのに候補がある '+JSON.stringify([v,vs]));
 const links=await p.evaluate(()=>['wk_vendor','wk_vendorStaff','wk_kyBy'].map(i=>document.getElementById(i).getAttribute('list')));if(links.join()!=='dl_wkv,dl_wkvs,dl_wkky')bad.push('list の結びつき '+links);
 await p.evaluate(()=>closeModal(true));
 // 記録あり
 await p.evaluate(()=>{const w=(id,vendor,vs,ky)=>({id,no:id,title:id,kind:'点検',status:'完了',date:TODAY,start:'09:00',endDate:'',end:'17:00',equipIds:[],locId:'',place:'',staff:[],vendor,vendorStaff:vs,needQuals:[],needN:0,content:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:ky,pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''});
  S.works=[w('w1','○○電気','社員甲、社員乙','社員甲'),w('w2','○○電気','社員乙、社員丙','社員丁'),w('w3','△△設備','','')];
  S.equipment=[{id:'e1',name:'x',kind:'',status:'稼働',photos:[],docs:[],repairs:[{id:'r',date:TODAY,kind:'修理',content:'x',vendor:'□□工業',cost:'',photos:[]}],health:[]}];save();editWork()});await p.waitForTimeout(500);
 v=await opts('dl_wkv');vs=await opts('dl_wkvs');const ky=await opts('dl_wkky');
 if(v.join()!=='○○電気,△△設備,□□工業')bad.push('協力会社の候補 '+v.join());
 if(vs.join()!=='社員甲,社員乙,社員丙')bad.push('作業者の候補（1人ずつ・重複なし） '+vs.join());
 if(!ky.includes('社員甲')||!ky.includes('社員丁')||ky.filter(x=>x==='社員甲').length!==1)bad.push('KY実施者の候補 '+ky.join());
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 // 保存される値は文字列のまま
 await p.evaluate(()=>{document.getElementById('wk_title').value='候補の試し';document.getElementById('wk_vendor').value='○○電気'});
 await p.evaluate(()=>saveWork&&saveWork(''));await p.waitForTimeout(400);
 const sv=await p.evaluate(()=>{const w=S.works.find(x=>x.title==='候補の試し');return w?w.vendor:null});if(sv!=='○○電気')bad.push('保存された値 '+sv);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
