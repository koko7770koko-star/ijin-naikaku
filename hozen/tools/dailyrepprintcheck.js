// 日報の印刷の確認：測定10件・盤の多い棟・異常8件・実績12件の日に、A4 縦で（印刷の表示にして）列が1字ずつ折れず、
// 各表の見出しが thead（次のページにも出る）で、行がページの境で割れない設定（break-inside:avoid）になり、PDFにできることを確かめる。
// usage: node hozen/tools/dailyrepprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{const L=[];['A','B','C','D','E','F'].forEach((x,i)=>{L.push({id:'b'+i,name:x+'棟',type:'建屋',parent:''});for(let f=1;f<=3;f++){L.push({id:'f'+i+f,name:f+'F',type:'階',parent:'b'+i});for(let k=1;k<=4;k++)L.push({id:'k'+i+f+k,name:'盤'+k,type:'盤',parent:'f'+i+f})}});S.locs=L;
  S.equipment=[{id:'g1',code:'G-1',name:'非常用発電機',kind:'発電機',status:'稼働',locId:'f11',run:{meters:[]}}];
  S.banChk={[TODAY.slice(0,7)]:{}};L.filter(l=>l.type==='盤').forEach((l,i)=>{S.banChk[TODAY.slice(0,7)][l.id]=['済','○',''].slice(0,i%3+1)});
  S.meas=[...Array(10)].map((_,i)=>({id:'m'+i,equipId:'g1',tplId:'mt_gen',date:TODAY,type:'電圧・電流・電力',name:'月次点検'+i,rows:[{name:'電圧',v:200+i,unit:'V',min:190,max:210},{name:'周波数',v:50,unit:'Hz',min:49,max:51},{name:'燃料',v:80,unit:'%',min:50,max:100}]}));
  S.issues=[...Array(8)].map((_,i)=>({id:'i'+i,date:TODAY,title:'異常の試し'+i+'（受変電設備の発熱）',place:'A棟 1F 盤1',status:'対応中',action:'増し締めして様子を見る',closed:''}));
  S.tasks=[...Array(12)].map((_,i)=>({id:'t'+i,date:TODAY,time:'09:'+String(i).padStart(2,'0'),kind:'月次',cat:'',title:'点検の試し'+i,place:'A棟 1F',staff:'職員'+i,attend:'',status:'完了',result:'良',note:'',photos:[]}));
  go('dailyRep',{day:TODAY})});await p.waitForTimeout(500);
 await p.setViewportSize({width:718,height:1000});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const o={narrow:[],noThead:0,tr:0,nthead:0};
  for(const t of document.querySelectorAll('.rep table:not(.head):not(.stamp)')){const rows=t.querySelectorAll('tr').length;if(rows>3&&!t.querySelector('thead')&&t.querySelector('th'))o.noThead++;if(t.querySelector('thead'))o.nthead++;
   for(const c of t.querySelectorAll('th')){const w=c.getBoundingClientRect().width;if(w<22&&(c.textContent||'').trim().length>=2)o.narrow.push((c.textContent||'').trim()+':'+Math.round(w))}}
  const tr=document.querySelector('.rep tbody tr');o.tr=tr?getComputedStyle(tr).breakInside:'none';o.sw=document.documentElement.scrollWidth;return o});
 if(r.narrow.length)bad.push('列が細すぎて折れる: '+r.narrow.join(' '));
 if(r.nthead<3)bad.push('見出しが thead の表が少ない: '+r.nthead);
 if(r.tr!=='avoid')bad.push('行がページの境で割れる設定になっていない: '+r.tr);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<5000)bad.push('PDFが作れない');
 const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;console.log('pages',pages);
 if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
