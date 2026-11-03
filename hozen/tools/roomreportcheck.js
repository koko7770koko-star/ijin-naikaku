// 月報・印刷の盤の表を 棟→階→電気室→盤 の並びで：(1) 6の2 の行が「階 › 電気室」ごと (2) 6の3 の見出し行「A棟 › 3階 › 第1電気室」の下に盤が並ぶ
// (3) 現場用の空の点検表の左の列も「階 › 電気室」 (4) 古い形（電気室なし・階なし・両方なし）でも並ぶ (5) 見出し行が表の途中で切れないCSVがある・390pxではみ出さない。
// usage: node hozen/tools/roomreportcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const texts=(locs,mark)=>p.evaluate(([locs,mark])=>{S.locs=locs.map(([id,type,parent,name])=>({id,type,parent,name,note:'',pos:{floor:'',x:'',y:'',z:''}}));
  const ym=TODAY.slice(0,7);S.banChk={[ym]:mark};save();const y=now.getFullYear(),m=now.getMonth()+1;
  const d=document.createElement('div');d.innerHTML=banReportHTML(y,m)+banBlankHTML(ym,S.locs.filter(l=>l.type==='建屋'));
  return {all:d.textContent.replace(/\s+/g,' '),heads:[...d.querySelectorAll('tr.rbh')].map(x=>x.textContent.trim()),rows2:[...d.querySelectorAll('table:not(.bdt):not(.bpt) tbody tr')].map(x=>[...x.children].map(c=>c.textContent.trim()).slice(0,3).join('|')),blank:[...d.querySelectorAll('table.bpt tbody tr')].map(x=>x.children[0].textContent.trim()+'/'+x.children[1].textContent.trim()),html:d.innerHTML}},[locs,mark]);
 const L4=[['bA','建屋','','A棟'],['f3','階','bA','3階'],['f1','階','bA','1階'],['r1','電気室','f3','第1電気室'],['r2','電気室','f3','第2電気室'],['k1','盤','r1','動力盤-1'],['k2','盤','r1','動力盤-2'],['k3','盤','r2','動力盤-3'],['k4','盤','f1','分電盤-1']];
 let T=await texts(L4,{k1:['済','済','済']});
 if(JSON.stringify(T.heads)!==JSON.stringify(['A棟 › 3階 › 第1電気室','A棟 › 3階 › 第2電気室','A棟 › 1階']))bad.push('見出し行 '+JSON.stringify(T.heads));
 if(!T.rows2.some(r=>r.includes('3階 › 第1電気室|2'))||!T.rows2.some(r=>r.includes('1階|1')))bad.push('6の2の行 '+JSON.stringify(T.rows2));
 if(!T.blank.includes('3階 › 第1電気室/動力盤-1')||!T.blank.includes('/動力盤-2')||!T.blank.includes('1階/分電盤-1'))bad.push('空の点検表 '+JSON.stringify(T.blank));
 const i1=T.all.indexOf('動力盤-1'),i3=T.all.indexOf('動力盤-3');if(i1<0||i3<i1)bad.push('盤の順');
 // 古い形
 T=await texts([['bA','建屋','','A棟'],['r1','電気室','bA','第1電気室'],['k1','盤','r1','盤-1']],{});if(!T.heads.includes('A棟 › 第1電気室'))bad.push('階なし '+JSON.stringify(T.heads));
 T=await texts([['bA','建屋','','A棟'],['f1','階','bA','2階'],['k1','盤','f1','盤-1']],{});if(!T.heads.includes('A棟 › 2階'))bad.push('電気室なし '+JSON.stringify(T.heads));
 T=await texts([['bA','建屋','','A棟'],['k1','盤','bA','盤-1']],{});if(!T.heads.includes('A棟 › 階なし'))bad.push('どちらも無し '+JSON.stringify(T.heads));
 T=await texts([['fa','施設','','○○総合病院'],['bA','建屋','fa','A棟'],['r1','電気室','bA','第1電気室'],['k1','盤','r1','盤-1']],{});if(!T.heads.includes('A棟 › 第1電気室'))bad.push('施設→建屋 '+JSON.stringify(T.heads));
 // 印刷用のCSS
 const css=await p.evaluate(()=>[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].map(r=>r.cssText)}catch(e){return []}}).join('\n'));
 if(!/table\.bdt tr\.rbh/.test(css)||!/break-after:\s*avoid/.test(css))bad.push('見出し行の改ページ指定が無い');
 // 画面（月報）が390pxで開いてはみ出さない
 await p.evaluate(()=>{S.locs=[['bA','建屋','','A棟'],['f3','階','bA','3階'],['r1','電気室','f3','第1電気室'],['k1','盤','r1','動力盤-1']].map(([id,type,parent,name])=>({id,type,parent,name,note:'',pos:{floor:'',x:'',y:'',z:''}}));save();V.ry=now.getFullYear();V.rm=now.getMonth()+1;go('report')});await p.waitForTimeout(400);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('月報が横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2],fullPage:false});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
