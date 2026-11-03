// 異常の記録の CSV（hz-issues-csv）：BOM つき・書き出しは window.hzSave（downloads と同じ入口）。列に 棟・階・電気室・盤 を足した。
//  設備に場所があればそこから、無ければ「設置場所」の文字が登録した場所の道のりと同じときだけ埋める（分からなければ空）。日付の無い古い記録でも止まらない。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('fb','2階','階','b'),mk('y','分電盤-2','盤','fb')];
  S.equipment=[{id:'e1',code:'E-1',name:'変圧器',status:'稼働',locId:'r',spec:{}}];
  S.issues=[{id:'i1',date:'2026-11-01',title:'盤の異常：動力盤-1（端子および碍子）',place:'A棟 › 1階 › 第1電気室 › 動力盤-1',status:'発見',equipId:'',detail:'',action:'',photos:[]},
    {id:'i2',date:'2026-11-02',title:'変圧器の異音',place:'',status:'対応中',equipId:'e1',detail:'',action:'',photos:[]},
    {id:'i3',date:'2026-11-03',title:'電気室なし',place:'A棟 › 2階 › 分電盤-2',status:'発見',equipId:'',detail:'',action:'',photos:[]},
    {id:'i4',date:'2026-11-04',title:'場所の文字が違う',place:'B棟のどこか',status:'発見',equipId:'',detail:'',action:'',photos:[]},
    {id:'i5',title:'日付なし（古い記録）',place:'',status:'発見',equipId:'',detail:'',action:'',photos:[]}];return JSON.stringify(S.issues)});
 const out=await p.evaluate(async()=>{window.__out=null;window.hzSave=async(n,bl)=>{const u=new Uint8Array(await bl.arrayBuffer());window.__out={n,t:await bl.text(),bom:u[0]===0xEF&&u[1]===0xBB&&u[2]===0xBF};return true};exportIssuesCsv();for(let k=0;k<100&&!window.__out;k++)await new Promise(r=>setTimeout(r,50));return window.__out});
 if(!out)bad.push('書き出されない');else{
  if(!out.bom)bad.push('BOM が無い');
  const L=out.t.replace(/^\uFEFF/,'').split('\r\n').filter(Boolean).map(l=>l.split(',').map(x=>x.replace(/^"|"$/g,'')));const H=L[0];
  if(H.slice(2,7).join()!=='設置場所,棟,階,電気室,盤')bad.push('列の並びが違う '+H.join());
  const row=t=>{const r=L.find(x=>x.join(',').includes(t));return r?r.slice(3,7).join('/'):'なし'};
  if(row('動力盤-1（端子')!=='A棟/1階/第1電気室/動力盤-1')bad.push('盤の異常の4段 '+row('動力盤-1（端子'));
  if(row('変圧器の異音')!=='A棟/1階/第1電気室/')bad.push('設備の場所から '+row('変圧器の異音'));
  if(row('電気室なし')!=='A棟/2階//分電盤-2')bad.push('電気室なしの形 '+row('電気室なし'));
  if(row('場所の文字が違う')!=='///')bad.push('分からない場所を埋めた '+row('場所の文字が違う'));
  if(row('日付なし')==='なし')bad.push('日付の無い記録が出ない');}
 if(await p.evaluate(()=>JSON.stringify(S.issues))!==before)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
