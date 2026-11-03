// 夜間（暗い画面）の確認：設定の「夜間」で html に night が付き、ホーム・日常点検・盤の点検・発電機の入力・設定・異常で
// 文字と背景の差（コントラスト）が 3 以上、PAGEERR 0、横にはみ出さない。印刷（media print）は白地のまま。保存して読み直しても残る。標準に戻せる。
// usage: node hozen/tools/nightcheck.js [--list]   （--list は低い所を全部出す）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','A棟','建屋',''),mk('f1','1階','階','b1'),mk('r1','第1電気室','電気室','f1'),mk('p1','動力盤-1','盤','r1'),mk('p2','動力盤-2','盤','r1')];
  const ym=TODAY.slice(0,7);S.banChk={[ym]:{p1:['済','○','延']}};S.equipment=S.equipment||[];S.equipment.push({id:'eqG',code:'',name:'試験発電機',kind:'発電機',place:'',locId:'',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[],run:{meters:[]},spec:{}});
  S.issues.push({id:'isN',date:TODAY,title:'試験の異常',place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[],urgency:'高'});save()});
 await p.evaluate(()=>go('set'));await p.waitForTimeout(300);
 if(!await p.evaluate(()=>/画面の明るさ/.test(document.querySelector('#app').innerText)))bad.push('設定に「画面の明るさ」が無い');
 await p.click('button:has-text("夜間")');await p.waitForTimeout(300);
 if(!await p.evaluate(()=>document.documentElement.classList.contains('night')&&S.settings.night==='on'))bad.push('夜間にならない');
 const views=(await p.evaluate(()=>Object.keys(VIEWS))).filter(v=>!['printDoc','workSheet','qr'].includes(v)).map(v=>[v,{day:'TODAY',eq:'eqG',hItem:'',dgTab:'meas'}]);
 views.push(['diag',{dgTab:'rec'}],['stock',{stTab:'tools'}],['plan',{plTab:'legal'}]);
 const low=[];
 for(const [v,ex] of views){
  await p.evaluate(([v,ex])=>{if(ex.day)ex.day=TODAY;try{go(v,ex)}catch(e){}},[v,ex]);await p.waitForTimeout(350);
  const r=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
   const bgOf=e=>{let x=e;while(x){const b=getComputedStyle(x).backgroundColor;const m=b.match(/[\d.]+/g);if(m&&(m.length<4||+m[3]>.5))return b;x=x.parentElement}return 'rgb(16,21,28)'};
   const out=[];document.querySelectorAll('#app *,#modal *').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own)return;
    const cs=getComputedStyle(e),fg=lum(cs.color),bg=lum(bgOf(e)),hi=Math.max(fg,bg),lo=Math.min(fg,bg),cr=(hi+.05)/(lo+.05);
    if(cr<3)out.push({t:e.textContent.trim().slice(0,20),cls:e.className,cr:Math.round(cr*10)/10,fg:cs.color,bg:bgOf(e)})});
   return {out:out.slice(0,12),n:out.length,sw:document.documentElement.scrollWidth}});
  if(r.sw>392)bad.push(v+'：はみ出す');
  if(r.n)low.push(v+'：'+r.n+'件 '+JSON.stringify(r.out.slice(0,5)));
 }
 for(const [n,js] of [['予定',"editTask(null,TODAY)"],['異常',"editIssue(null,{})"],['設備',"editEquip()"],['測定',"editMeas(null,{})"],['発電機',"genStart('eqG')"],['作業',"editWork&&editWork()"],['資料',"editLib()"],['盤の異常',"banIssue('p1')"]]){
  await p.evaluate(j=>{closeModal(true);try{(0,eval)(j)}catch(e){}},js);await p.waitForTimeout(350);
  const r=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
   const bgOf=e=>{let x=e;while(x){const b=getComputedStyle(x).backgroundColor;const m=b.match(/[\d.]+/g);if(m&&(m.length<4||+m[3]>.5))return b;x=x.parentElement}return 'rgb(16,21,28)'};
   const out=[];document.querySelectorAll('#modal *').forEach(e=>{if(!e.offsetParent)return;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own)return;const cs=getComputedStyle(e),fg=lum(cs.color),bg=lum(bgOf(e)),hi=Math.max(fg,bg),lo=Math.min(fg,bg),cr=(hi+.05)/(lo+.05);if(cr<3)out.push({t:e.textContent.trim().slice(0,20),cls:e.className,cr:Math.round(cr*10)/10,fg:cs.color,bg:bgOf(e)})});return {out:out.slice(0,5),n:out.length,on:document.querySelector('#mask').classList.contains('on')}});
  if(r.on&&r.n)low.push('窓 '+n+'：'+r.n+'件 '+JSON.stringify(r.out))}
 if(process.argv.includes('--list'))console.log(low.join('\n'));
 if(low.length)bad.push('コントラストが低い所：\n'+low.join('\n'));
 // 印刷は白地のまま
 await p.emulateMedia({media:'print'});const pb=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);await p.emulateMedia({media:'screen'});
 if(!/255, 255, 255|242, 244, 247/.test(pb))bad.push('印刷の背景が暗い '+pb);
 // 保存→読み直しで残る・標準に戻せる
 await p.waitForTimeout(300);await p.reload();await p.waitForTimeout(1200);
 if(!await p.evaluate(()=>document.documentElement.classList.contains('night')))bad.push('読み直すと夜間が消える');
 await p.evaluate(()=>go('set'));await p.waitForTimeout(300);await p.click('button:has-text("標準")');await p.waitForTimeout(200);
 if(await p.evaluate(()=>document.documentElement.classList.contains('night')||S.settings.night!==''))bad.push('標準に戻らない');
 // 古い記録（night の項目が無い）をそのまま開ける：標準の明るさで始まる
 await p.evaluate(()=>{delete S.settings.night;save()});await p.reload();await p.waitForTimeout(1200);
 if(await p.evaluate(()=>document.documentElement.classList.contains('night')||(S.settings.night||'')!==''))bad.push('night の無い古い記録が標準で開かない');
 await p.evaluate(()=>{for(const v of ['home','set','ban'])go(v)});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
