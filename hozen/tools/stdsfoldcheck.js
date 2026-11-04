// 作業標準・盤の点検表の検索の表記ゆれ：全角/半角・大小・カタカナ/ひらがなの違いでも見つかる（保存する値は変えない）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const snap=await p.evaluate(()=>{const st=(id,name,docNo,kinds)=>({id,name,docNo,ver:'1',kinds,pre:[],post:[],steps:[],approvedBy:'',approvedDate:'',note:''});
  S.stds=[st('s1','VCB 開閉操作','STD-01',['停電']),st('s2','トランス 絶縁測定','STD-02',['測定']),st('s3','照明 交換','STD-03',['一般'])];
  const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});
  S.locs=[mk('a','A棟','建屋',''),mk('f1','1階','階','a'),mk('r1','第1電気室','電気室','f1'),mk('p1','動力盤-1','盤','r1'),mk('p2','電灯盤-1','盤','r1'),mk('p3','ＭＣＣ盤','盤','r1')];
  save();return JSON.stringify([S.stds,S.locs])});
 const std=async q=>{await p.evaluate(q=>{V.stdQ=q;go('stds')},q);await p.waitForTimeout(150);return p.evaluate(()=>[...document.querySelectorAll('#app .item')].map(x=>x.textContent).join('|'))};
 for(const [q,t] of [['ｖｃｂ','VCB 開閉操作'],['ＶＣＢ','VCB 開閉操作'],['とらんす','トランス 絶縁測定'],['ﾄﾗﾝｽ','トランス 絶縁測定'],['ｓｔｄ－０３','照明 交換']]){const s=await std(q);if(!s.includes(t))bad.push('作業標準：'+q+' で「'+t+'」が出ない');}
 if((await std('とらんす')).includes('VCB'))bad.push('作業標準：とらんす で関係ない件まで出る');
 const ban=async q=>{await p.evaluate(q=>{V.stdQ='';V.banB='a';V.banQ=q;go('ban')},q);await p.waitForTimeout(250);return p.evaluate(()=>document.querySelectorAll('.banrow:not(.bh)').length)};
 // 盤の名前は漢字が多いので、カナ・英字の盤で確かめる
 await p.evaluate(()=>{S.locs.push({id:'p4',name:'キュービクル盤',type:'盤',parent:'r1',note:'',pos:{}});});
 for(const [q,n] of [['mcc',1],['ｍｃｃ',1],['きゅーびくる',1],['ｷｭｰﾋﾞｸﾙ',1],['動力',1]]){const k=await ban(q);if(k!==n)bad.push('盤：'+q+' で '+k+' 面（'+n+' のはず）');}
 await p.evaluate(()=>{S.locs=S.locs.filter(l=>l.id!=='p4');V.banQ='';V.stdQ=''});
 if(await p.evaluate(()=>JSON.stringify([S.stds,S.locs]))!==snap)bad.push('検索で記録が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
