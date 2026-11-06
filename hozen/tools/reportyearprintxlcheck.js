// 年報の印刷：文字「特大」（と「大」）にしていても、紙（A4）で表の列が切れず、4月〜3月の 12 か月と 1 年の計・表の右端の列・異常の一覧が全部出て、操作ボタンが紙に出ないこと（hz-v-report-year-xl）。
// 点検 40 件・異常 6 件・工事 4 件を 12 か月にばらす（reportyearxlcheck と同じ記録）。390px の画面から印刷する。
// usage: node hozen/tools/reportyearprintxlcheck.js
const {chromium}=require('playwright');const path=require('path');const {execSync}=require('child_process');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fsc of ['xl','l']){const tag=({xl:'特大',l:'大'})[fsc];
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();const y=now.getFullYear(),m=now.getMonth()+1;const fy=m>=4?y:y-1;
  const ym=k=>{const mm=((3+k)%12)+1,yy=mm>=4?fy:fy+1;return yy+'-'+String(mm).padStart(2,'0')}; /* 年度の k 番目の月（0=4月） */
  S.items=[...Array(30)].map((_,i)=>({id:'it'+i,name:'設備'+(i+1)+'の点検（受変電設備）',cat:['受変電','発電機','空調','消防'][i%4],cycle:'毎月',base:fy+'-04-10',who:i%2?'委託':'自主'}));
  S.tasks=[...Array(40)].map((_,i)=>({id:'t'+i,date:ym(i%12)+'-'+String(1+i%27).padStart(2,'0'),time:'',kind:'月次',cat:'',title:'設備'+(i+1)+'の点検（受変電設備）',place:'',staff:'職員1',attend:'',status:i%5?'完了':'予定',result:i%7?'良':'不良',note:'',photos:[]}));
  S.works=[...Array(4)].map((_,i)=>({id:'w'+i,date:ym(i*3)+'-10',endDate:'',title:'工事の試し'+i+'（受変電設備の更新）',place:'A棟',status:'完了',equipIds:[],staff:'',note:''}));
  S.issues=[...Array(6)].map((_,i)=>({id:'is'+i,date:ym(i*2)+'-05',title:'異常の試し'+i+'（設備'+i+'の発熱）',place:'A棟 1F',status:i%3?'完了':'対応中',action:'増し締め',closed:'',detail:''}));
  V.ry=y;V.rm=m;V.rfy=fy;V.rmode='y';go('report')},fsc);await p.waitForTimeout(400);
 const fsNow=await p.evaluate(()=>document.documentElement.dataset.fs);if(fsNow!==fsc)errs.push(tag+'：文字の大きさが '+fsNow+' になっていない（確かめの作りの誤り）');
 await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(200); /* 紙（A4 縦）の幅で並べ直したときを測る */
 const r=await p.evaluate(()=>{const o={cut:[],btn:0,zoom:getComputedStyle(document.documentElement).zoom};const vw=document.documentElement.clientWidth;
  for(const t of document.querySelectorAll('#app table')){if(!t.offsetParent)continue;const q=t.getBoundingClientRect(),w=t.parentElement;if(q.right>vw+1||w.scrollWidth>w.clientWidth+1)o.cut.push((t.className||'table')+':'+Math.round(q.right)+'/'+vw)}
  o.btn=[...document.querySelectorAll('#app button,#app .btn')].filter(x=>x.offsetParent&&getComputedStyle(x).visibility!=='hidden').map(x=>x.textContent.trim().slice(0,8));return o});
 if(r.cut.length)errs.push(tag+'：印刷で表が紙の幅からはみ出す '+r.cut.join(' '));
 if(r.btn.length)errs.push(tag+'：操作ボタンが紙に出る '+r.btn.join(' '));
 const buf=await p.pdf({format:'A4',preferCSSPageSize:true,printBackground:true});
 try{const f=path.join(os.tmpdir(),'rypx'+process.pid+fsc+'.pdf');fs.writeFileSync(f,buf);const raw=execSync('pdftotext -raw '+f+' -',{encoding:'utf8'});fs.unlinkSync(f);const txt=raw.replace(/\s+/g,'');
  if(process.env.DUMP)console.log(raw);
  const miss=['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'].filter(m=>!txt.includes(m));if(miss.length)errs.push(tag+'：紙に出ない月 '+miss.join(' '));
  if(!/(^|\n)計\s+40\s+32\s/.test(raw))errs.push(tag+'：紙に 1 年の「計」の行（予定 40・完了 32）が出ない');
  for(const w of ['異常の試し0（設備0の発熱）','異常の試し5（設備5の発熱）','最大需要(kW)','計画済/予'])if(!txt.includes(w))errs.push(tag+'：紙に「'+w+'」が出ない（中身が切れている）')}catch(e){if(!/not found|ENOENT/.test(String(e.message)))errs.push('pdftotext '+e.message)}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
