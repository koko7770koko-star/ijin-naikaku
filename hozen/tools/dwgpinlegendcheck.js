// 図面の印刷：印（ピン）に出るのは設備の記号か名前の頭だけ（長い名前は … で切れる）なので、紙に「設備の印の一覧」（印の文字・設備の名前・場所）が出て、
// 10 個の印の設備の名前が最後まで紙で読めること。印の文字が 9pt 以上。画面には一覧（下のカード）が今までどおり出て、紙用の一覧は画面に出ない（hz-v-dwg-pin-print）
// usage: node hozen/tools/dwgpinlegendcheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=1600;cv.height=800;const x=cv.getContext('2d');x.fillStyle='#dde';x.fillRect(0,0,1600,800);const a=await putPhoto(cv.toDataURL('image/png'));
  S.locs=[{id:'lcB',name:'A棟',type:'建屋',parent:''},{id:'lcR',name:'第1電気室',type:'電気室',parent:'lcB'}];
  S.equipment=[...Array(10)].map((_,i)=>({id:'pe'+i,code:i%3?'':'E-'+i,name:'設備'+i+'番 高圧受電盤の真空遮断器と保護継電器（末尾'+i+'）',kind:'',status:'稼働',locId:i%2?'lcR':'',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}));
  S.drawings=[{id:'dw',name:'横長の図面',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:TODAY,note:'',by:'',file:a,type:'image/png'}],pins:[...Array(10)].map((_,i)=>({id:'pp'+i,equipId:'pe'+i,label:i===9?'手書き9':'',x:.05+i*.09,y:i%2?.15:.85}))}];
  save();return JSON.stringify(S.drawings)});
 await p.evaluate(()=>go('dwg',{dwg:'dw'}));await p.waitForTimeout(500);
 const scr=await p.evaluate(()=>{const L=document.querySelector('#dwgLegend');return {legendShown:!!(L&&L.getClientRects().length&&getComputedStyle(L).display!=='none'),card:/設備の印/.test(document.getElementById('app').innerText)}});
 if(scr.legendShown)bad.push('紙用の印の一覧が画面にも出ている');if(!scr.card)bad.push('画面の「設備の印」の一覧が出ない');
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const pins=[...document.querySelectorAll('#dwgv .pin')];return {n:pins.length,fs:Math.min(...pins.map(e=>parseFloat(getComputedStyle(e).fontSize)))*0.75,L:!!document.querySelector('#dwgLegend')}});
 if(r.n!==10)bad.push('印が '+r.n+' 個（10 個のはず）');if(r.fs<9)bad.push('紙の印の文字が小さい '+r.fs.toFixed(1)+'pt');if(!r.L)bad.push('紙に「設備の印の一覧」が無い');
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;if(pages>2)bad.push('印刷が '+pages+' 枚（2 枚まで）');
 try{const f=path.join(os.tmpdir(),'dpl'+process.pid+'.pdf');fs.writeFileSync(f,buf);const txt=execSync('pdftotext -raw '+f+' -',{encoding:'utf8'}).replace(/\s+/g,'');fs.unlinkSync(f);
  for(let i=0;i<10;i++)if(!txt.includes('（末尾'+i+'）'))bad.push('紙で設備'+i+'番の名前が最後まで読めない');
  if(!txt.includes('手書き9'))bad.push('紙に印の文字「手書き9」が出ない');if(!txt.includes('A棟›第1電気室'))bad.push('紙の一覧に設備の場所が出ない')}catch(e){if(!/not found|ENOENT/.test(String(e.message)))bad.push('pdftotext '+e.message)}
 const after=await p.evaluate(()=>JSON.stringify(S.drawings));if(after!==before)bad.push('印刷で図面の記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
