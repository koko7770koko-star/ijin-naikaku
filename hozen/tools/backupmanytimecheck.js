// 全画面が数千件ずつ（予定 4200・点検項目 1400・設備 350・異常 2100・測定 3500・作業 700・場所 2100・日常点検 255 日、記録の合計 約 3.8MB＝端末の保存の上限 約 5MB の手前）のとき、
// バックアップの書き出しと、別の記録が入った端末への戻しが何秒か測り、戻す前の確かめ（件数の表・差分の表）の数が正しく、
// 戻した後に全画面がエラーなく開き、読み直しても件数が同じか（hz-v-backup-many-time）。usage: node hozen/tools/backupmanytimecheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
async function open(b){const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);return {ctx,p,errs}}
const fill=(p,pre,k)=>p.evaluate(([pre,k])=>{const cats=S.settings.cats,n=x=>Math.round(x*k);
 S.locs=[...Array(n(3000))].map((_,i)=>({id:pre+'lc'+i,name:(i<6?'ABCDEF'[i]+'棟':'盤-'+i),type:i<6?'建屋':i<60?'電気室':'盤',parent:i<6?'':i<60?pre+'lc'+(i%6):pre+'lc'+(6+i%54),note:'',pos:{}}));
 S.equipment=[...Array(n(500))].map((_,i)=>({id:pre+'eq'+i,code:'EQ-'+i,name:'設備'+i,kind:'変圧器',locId:pre+'lc'+(6+i%54),status:'稼働',importance:'',repairs:[],photos:[],docs:[]}));
 S.items=[...Array(n(2000))].map((_,i)=>({id:pre+'it'+i,name:'点検'+i,cat:cats[i%cats.length],cycle:'年1回',base:addD(TODAY,-300),who:'自社',track:true,legal:'',equipId:pre+'eq'+(i%n(500))}));
 S.tasks=[...Array(n(6000))].map((_,i)=>({id:pre+'tk'+i,date:addD(TODAY,-(i%700)+30),time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+(i%n(2000)),place:'',staff:'',attend:'',status:i%3?'完了':'予定',result:'',note:'',photos:[]}));
 S.issues=[...Array(n(3000))].map((_,i)=>({id:pre+'is'+i,src:'manual:'+pre+i,date:addD(TODAY,-(i%900)),title:'異常'+i,detail:'詳細',place:'',status:i%3?'完了':'対応中',urgency:'中',equipId:pre+'eq'+(i%n(500)),action:'',cause:'',closed:i%3?TODAY:'',photos:[],log:[]}));
 S.meas=[...Array(n(5000))].map((_,i)=>({id:pre+'ms'+i,at:'',date:addD(TODAY,-(i%1095)),type:'絶縁抵抗',tplId:'',name:'測定'+i,equipId:pre+'eq'+(i%n(500)),by:'',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:100}]}));
 S.works=[...Array(n(1000))].map((_,i)=>({id:pre+'wk'+i,no:'W-'+i,date:addD(TODAY,-(i%300)),endDate:'',title:'作業'+i,kind:'点検',status:i%2?'完了':'予定',equipId:'',place:'',staff:[],needQuals:[],steps:[],approvals:[],hist:[],issueId:'',note:''}));
 for(let i=0;i<n(365);i++)S.daily[addD(TODAY,-i)]={note:'日常メモ'+pre+i};
 // 本物の記録と同じく全部の項目を持つ形にそろえる（そろえないと戻すときに初期値が足されて大きさが 1.6 倍になる）
 const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','meas','works','locs','daily'])S[x]=m[x]}
 save()},[pre,k]);
const cnt=p=>p.evaluate(()=>[S.tasks.length,Object.keys(S.daily).length,S.items.length,S.equipment.length,S.issues.length,(S.meas||[]).length,(S.works||[]).length,(S.locs||[]).length]);
(async()=>{const b=await chromium.launch();const A=await open(b);
 await fill(A.p,'a',0.7);ok(!(await A.p.evaluate(()=>SAVE_FAIL.app)),'書き出す側で保存できない（容量）');await A.p.waitForTimeout(500);const nA=await cnt(A.p);
 const t0=Date.now();const built=await A.p.evaluate(async()=>{const r=await buildBackup();return {text:await r.blob.text(),info:r.info}}).catch(e=>{bad.push('書き出しに失敗 '+e.message);return null});
 if(!built){console.log(bad.join('\n'));process.exit(1)}const tBuild=Date.now()-t0;ok(built.info.complete,'バックアップが不完全と判定された');ok(tBuild<10000,'書き出しに '+tBuild+'ms');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bkm-'));const file=path.join(tmp,'many.json');fs.writeFileSync(file,built.text);
 // 戻す先：別の記録が少し入った端末（差分の表が意味を持つように、半分は同じ id・半分は別）
 const B=await open(b);await fill(B.p,'b',0.1);await B.p.evaluate(()=>{S.tasks.push({id:'atk0',date:TODAY,time:'',kind:'定期',cat:S.settings.cats[0],title:'違う中身',place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]});save();go('set')});await B.p.waitForTimeout(500);
 const nB=await cnt(B.p);
 const t1=Date.now();await B.p.setInputFiles('input[onchange^="restore("]',file,{timeout:5000});
 await B.p.waitForFunction(()=>/復元の確認|復元できません/.test(document.body.innerText),null,{timeout:60000});const tCheck=Date.now()-t1;
 ok(await B.p.evaluate(()=>/復元の確認/.test(document.body.innerText)),'復元の確認が出ない（断られた）');ok(tCheck<8000,'戻す前の確かめが出るまで '+tCheck+'ms');
 const tbl=await B.p.evaluate(()=>{const R={};document.querySelectorAll('#modal .rep table tr').forEach(tr=>{const td=[...tr.querySelectorAll('td')].map(x=>x.textContent.trim());if(td.length===3)R[td[0]]=[td[1],td[2]]});return R});
 const want={'予定・実績':[nB[0],nA[0]],'日常点検（日数）':[nB[1],nA[1]],'点検項目':[nB[2],nA[2]],'設備':[nB[3],nA[3]],'異常案件':[nB[4],nA[4]]};
 for(const k in want){const g=tbl[k];ok(g&&+g[0]===want[k][0]&&+g[1]===want[k][1],'件数の表「'+k+'」が違う '+JSON.stringify(g)+' / '+want[k])}
 const df=await B.p.evaluate(()=>{const t=document.querySelector('#modal details');return t?t.textContent:''});ok(/測定記録/.test(df)&&/作業指示/.test(df),'差分の表に測定記録・作業指示が無い');
 const dm=await B.p.evaluate(()=>{const m=document.querySelector('#modal');return m.scrollWidth>m.clientWidth+1});ok(!dm,'戻す前の確かめの窓が横にはみ出す');
 const t2=Date.now();await B.p.evaluate(()=>applyRestore());await B.p.waitForFunction(n=>S.tasks.length===n,nA[0],{timeout:30000}).catch(async()=>bad.push('戻しが終わらない：'+(await B.p.evaluate(()=>(document.querySelector('#modal')||{}).innerText||'')).slice(0,200)));await B.p.waitForTimeout(800);const tApply=Date.now()-t2;
 ok(tApply<10000,'戻すのに '+tApply+'ms');
 const nR=await cnt(B.p);ok(JSON.stringify(nR)===JSON.stringify(nA),'戻した後の件数が違う '+nR+' / '+nA);
 const slow=[];const views=await B.p.evaluate(()=>Object.keys(VIEWS));
 for(const v of views){if(v==='equipDetail'||v==='printDoc')continue;const r=await B.p.evaluate(v=>{const s=performance.now();try{go(v)}catch(e){return {e:e.message}}return {ms:performance.now()-s,n:document.body.innerText.length}},v);
  if(r.e)bad.push('戻した後に画面 '+v+' でエラー '+r.e);else{if(r.n<20)bad.push('戻した後に画面 '+v+' が空');if(r.ms>2000)slow.push(v+' '+Math.round(r.ms)+'ms')}}
 if(slow.length)bad.push('戻した後に開くのが遅い画面：'+slow.join('、'));
 await B.p.reload();await B.p.waitForFunction(READY,null,{timeout:30000});const nRe=await cnt(B.p);ok(JSON.stringify(nRe)===JSON.stringify(nA),'読み直すと件数が変わる '+nRe);
 console.log('件数',nA.join('/'),'大きさ',Math.round(built.text.length/1024)+'KB','書き出し',tBuild+'ms','確かめ',tCheck+'ms','戻し',tApply+'ms');
 console.log([...A.errs,...B.errs,...bad].slice(0,20).join('\n')||'NO ERRORS');await b.close();process.exit(A.errs.length+B.errs.length+bad.length?1:0)})();
