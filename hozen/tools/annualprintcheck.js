// 年報の印刷の確認：項目60・異常40件・期限の多い年を A4 縦の PDF にして、PDFにできる・表が横にはみ出さず（列が細くなりすぎない）・
// 見出しが thead（次のページにも出る）・行がページの境で割れない設定になっていること、画面（390px）でも横にはみ出さないことを確かめる。
// usage: node hozen/tools/annualprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const before=await p.evaluate(()=>{const fy=now.getMonth()+1>=4?now.getFullYear():now.getFullYear()-1;
  S.items=[...Array(60)].map((_,i)=>({id:'it'+i,name:'点検項目'+i+'（受変電設備 高圧交流負荷開閉器の点検）',cat:['受変電','発電機','空調','消防'][i%4],cycle:['毎月','3ヶ月','6ヶ月','年1回'][i%4],base:fy+'-04-10',who:i%2?'委託':'自主'}));
  S.marks={[fy]:Object.fromEntries(S.items.map((it,i)=>[it.id,[...Array(12)].map((_,k)=>(k+i)%3===0?'済':(k+i)%3===1?'○':'')]))};
  S.issues=[...Array(40)].map((_,i)=>({id:'is'+i,date:fy+'-'+String(4+i%9).padStart(2,'0')+'-10',title:'異常の試し'+i+'（受変電設備の発熱）',place:'A棟 1F',status:i%3?'完了':'対応中',action:'増し締め',closed:'',detail:''}));
  S.tasks=[...Array(80)].map((_,i)=>({id:'t'+i,date:fy+'-'+String(4+i%9).padStart(2,'0')+'-'+String(1+i%27).padStart(2,'0'),time:'',kind:'月次',cat:'',title:'点検項目'+(i%60),place:'',staff:'',attend:'',status:i%4?'完了':'予定',result:'良',note:'',photos:[]}));
  V.rfy=fy;V.rmode='y';go('report');return JSON.stringify([S.items.length,S.issues.length])});await p.waitForTimeout(500);
 const sc=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,t:document.querySelector('#app').innerText.includes('年次報告書')}));
 if(!sc.t)bad.push('年報が開かない');if(sc.sw>392)bad.push('390pxで横にはみ出す '+sc.sw);
 await p.setViewportSize({width:718,height:1000});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const o={narrow:[],noThead:0,sw:document.documentElement.scrollWidth,tr:'',over:0};
  for(const t of document.querySelectorAll('.rep table:not(.head):not(.stamp)')){if(t.querySelectorAll('tr').length>14&&!t.querySelector('thead'))o.noThead++;
   if(t.getBoundingClientRect().right>innerWidth+1)o.over++;
   for(const c of t.querySelectorAll('th')){const w=c.getBoundingClientRect().width;if(w<22&&(c.textContent||'').trim().length>=2)o.narrow.push((c.textContent||'').trim()+':'+Math.round(w))}}
  const tr=document.querySelector('.rep tbody tr');o.tr=tr?getComputedStyle(tr).breakInside:'none';return o});
 if(r.noThead)bad.push('行が多いのに見出しが thead でない表 '+r.noThead);if(r.narrow.length)bad.push('列が細すぎる: '+r.narrow.join(' '));if(r.over||r.sw>722)bad.push('印刷幅で表がはみ出す '+r.over+'/'+r.sw);if(r.tr!=='avoid')bad.push('行が割れる設定: '+r.tr);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<5000)bad.push('PDFが作れない');
 const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;console.log('pages',pages);
 if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 const after=await p.evaluate(()=>JSON.stringify([S.items.length,S.issues.length]));if(after!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
