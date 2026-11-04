// 図面画面（390px）：版の選びの「最新」が切れない・印を置くモードの説明が出る・ボタン44px・はみ出さない・記録不変。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=800;cv.height=500;const x=cv.getContext('2d');x.fillStyle='#ccd';x.fillRect(0,0,800,500);const id=await putPhoto(cv.toDataURL('image/png'));
  S.drawings=[{id:'d1',name:'本館 受変電設備 単線結線図（高圧側・低圧側まとめ）',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'1',date:'2026-11-04',note:'',by:'',file:id,type:'image/png'},{id:'v2',ver:'12',date:'2026-11-04',note:'',by:'',file:id,type:'image/png'}],pins:[]}];go('dwg',{dwg:'d1',dwgZ:1});return JSON.stringify(S.drawings)});
 await p.waitForTimeout(400);
 const sel=await p.evaluate(()=>{const s=document.querySelector('#app select');return {sw:s.scrollWidth,cw:s.clientWidth,t:s.options[s.selectedIndex].text}});
 // select の中の文字が入りきる幅か：文字を測る
 const fit=await p.evaluate(()=>{const s=document.querySelector('#app select'),cs=getComputedStyle(s),cv=document.createElement('canvas').getContext('2d');cv.font=cs.font;const w=cv.measureText(s.options[s.selectedIndex].text).width;return {w,avail:s.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-24}});
 if(fit.w>fit.avail)bad.push('版の選びの文字が切れる '+JSON.stringify(fit)+sel.t);
 if(/20\d\d\//.test(sel.t))bad.push('年が4桁で長い '+sel.t);
 if(await p.evaluate(()=>/図面をタップすると印を置けます/.test(document.body.innerText)))bad.push('モード前に説明が出ている');
 await p.evaluate(()=>{V.pinMode=true;render()});await p.waitForTimeout(200);
 if(!await p.evaluate(()=>/図面をタップすると印を置けます.*外せます/.test(document.body.innerText)))bad.push('置くモードの説明が無い');
 const small=await p.evaluate(()=>[...document.querySelectorAll('#app button,#app select')].filter(e=>e.getBoundingClientRect().height<44).map(e=>e.innerText.slice(0,10)));if(small.length)bad.push('44px未満 '+small);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 if(await p.evaluate(()=>JSON.stringify(S.drawings))!==before)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
