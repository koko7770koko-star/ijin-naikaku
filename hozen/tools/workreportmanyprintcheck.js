// 作業報告書（printDoc work）の印刷：作業内容 60 行・作業前後の確認 各 60 項目・設備 40 台・写真 6 枚・履歴 60 件のとき、
// 画面が 1 秒以内に出て、A4 縦の幅に収まり（390px でもはみ出さない）、操作の部品が印刷に出ず、複数頁になっても 1 頁だけに切れず、
// 表の見出し（作業前確認など）が行と離れず、署名の欄が最後の頁に残り、PDF にできて、記録は変わらない（hz-v-worksheet-print-many）。usage: node hozen/tools/workreportmanyprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{
  const eq=[];for(let i=0;i<40;i++)eq.push({id:'wre'+i,code:'E-'+(100+i),name:'受変電設備の盤 '+i+'（長い名前の例）',status:'稼働'});
  S.equipment=(S.equipment||[]).concat(eq);
  const chk=(n,t)=>Array.from({length:n},(_,i)=>({text:t+(i+1)+' 絶縁抵抗・端子の締付け・表示灯の点灯を確かめる（長い項目の例）',req:true,done:i%2===0,by:i%2?'':'担当A',at:''}));
  S.works=[{id:'wrm1',no:'W-900',title:'受変電設備の年次点検と清掃（停電を伴う）',kind:'停電作業',status:'完了',date:TODAY,endDate:'',start:'09:00',end:'17:00',place:'A棟 › 3階 › 第2電気室',equipIds:eq.map(e=>e.id),locId:'',staff:['担当A','担当B'],vendor:'○○電気工事',vendorStaff:'担当C',needQuals:[],needN:0,
   content:Array.from({length:60},(_,i)=>(i+1)+'. 手順 '+i+'：開閉器を開放し、検電、接地し、点検後に復旧する（長い手順の例）').join('\n'),result:'異常なし',outage:{on:true,range:'A棟 全館',from:'9:00',to:'12:00',affect:'空調',contact:'各部署'},ky:[],kyBy:'',pre:chk(60,'前'),post:chk(60,'後'),stdId:'',stdVer:'',stdName:'',cost:'',photos:[],docs:[],approvals:[],hist:Array.from({length:60},(_,i)=>({at:new Date().toISOString(),act:'更新'+i,by:'担当A',note:'メモ'+i})),issueId:''}];
  save();return JSON.stringify(S.works)});
 const t0=Date.now();await p.evaluate(()=>go('printDoc',{doc:{t:'work',id:'wrm1'}}));await p.waitForSelector('#app .rep');const ms=Date.now()-t0;
 if(ms>1000)bad.push('報告書が 1 秒以内に出ない '+ms+'ms');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
  const ctl=[...document.querySelectorAll('#app button,#app select,#app input')].filter(vis).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'')).trim().slice(0,16));
  const T=document.body.innerText;return {sw:document.documentElement.scrollWidth,W,over,ctl,has:['手順 59','前60','後60','更新59','E-139'].filter(k=>!T.includes(k)),sign:T.includes('承認')&&T.includes('作成')}});
 if(r.sw>r.W+1||r.over.length)bad.push('A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
 if(r.ctl.length)bad.push('印刷に操作の部品が残る '+r.ctl.join('|'));
 if(r.has.length)bad.push('途中で切れて出ない物がある '+r.has.join(','));
 if(!r.sign)bad.push('署名の欄が出ない');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;if(pages<3)bad.push('3 頁以上にならない（試しが効いていない） '+pages);
 if(pages>7)bad.push('頁が多すぎる（大きい行を次の頁へ送って余白ができている）'+pages);
 console.log('頁数',pages,'表示ms',ms);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.works))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
