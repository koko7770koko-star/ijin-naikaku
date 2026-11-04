// 工事（作業指示）の検索の表記ゆれ：全角/半角・大小・カタカナ/ひらがなの違いでも見つかる（保存する値は変えない）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const mk=(i,title,vendor)=>({id:'w'+i,no:'W00'+i,title,kind:'点検',status:'起案',date:TODAY,start:'09:00',endDate:'',end:'17:00',equipIds:[],locId:'',place:'',staff:[],vendor,vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''});
 const before=await p.evaluate(()=>{S.works=[];return 1});
 await p.evaluate(m=>{S.works=[eval(m)(1,'VCB 点検',''),eval(m)(2,'トランス 清掃',''),eval(m)(3,'照明 交換','デンキ工事')];save()},mk.toString());
 const snap=await p.evaluate(()=>JSON.stringify(S.works));
 const cnt=async q=>{await p.evaluate(q=>{V.wkQ=q;V.wkF='all';V.wkMore=0;go('works')},q);await p.waitForTimeout(150);return p.evaluate(()=>[...document.querySelectorAll('#app .item')].map(x=>x.textContent).join('|'))};
 const want=[['ｖｃｂ','VCB 点検'],['ＶＣＢ','VCB 点検'],['vcb','VCB 点検'],['とらんす','トランス 清掃'],['ﾄﾗﾝｽ','トランス 清掃'],['でんき','照明 交換'],['ｗ００３','照明 交換']];
 for(const [q,t] of want){const s=await cnt(q);if(!s.includes(t))bad.push(q+' で「'+t+'」が出ない');}
 const s2=await cnt('とらんす');if(s2.includes('VCB 点検')||s2.includes('照明 交換'))bad.push('とらんす で関係ない件まで出る');
 if(await p.evaluate(()=>JSON.stringify(S.works))!==snap)bad.push('検索で記録が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
