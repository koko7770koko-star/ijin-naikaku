// 作業標準の編集窓（作業前 8 項目・作業後 6 項目）：文字「大」「特大」・360px で、①項目の文・「必須」の札・×が割れたり重なったりしない②押す所が 44px 以上③窓の中で横にはみ出さない、を確かめる。保存の形は見るだけで変えない。
// usage: node hozen/tools/stdeditxlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();
  S.stds.push({id:'sdx',name:'高圧受電設備 停電作業標準（設備1）',docNo:'STD-001',ver:'3',kinds:['停電作業'],pre:[...Array(8)].map((_,i)=>({text:'作業前の確認'+(i+1)+'：検電器で無電圧を確かめ、接地を取り付ける',req:i<4})),post:[...Array(6)].map((_,i)=>({text:'作業後の確認'+(i+1)+'：接地の取り外しと工具の数',req:i%2==0})),note:'',approvedBy:'',approvedRole:'',approvedDate:'',hist:[]});
  go('stds');editStd('sdx')},fs);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const m=document.querySelector('.modal')||document.querySelector('#modal');if(!m)return null;const M=m.getBoundingClientRect();const small=[],ov=[],cut=[],lap=[];
  m.querySelectorAll('button,input,textarea,select,label.chkl').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(q.height<43.5&&!e.matches('input[type=checkbox]'))small.push((e.getAttribute('aria-label')||e.textContent.trim()||e.id||e.tagName).slice(0,10)+' '+Math.round(q.height));if(q.right>M.right+1||q.left<M.left-1)ov.push((e.textContent.trim()||e.id||e.tagName).slice(0,10))});
  m.querySelectorAll('.stdrow').forEach(row=>{const ta=row.querySelector('textarea'),ctl=row.querySelector('.stdctl');const a=ta.getBoundingClientRect(),c=ctl.getBoundingClientRect();if(a.right>c.left+1&&a.bottom>c.top+1&&c.bottom>a.top+1)lap.push(ta.value.slice(0,8));
   const lb=row.querySelector('label.chkl');if(lb){const rs=[...(()=>{const tn=[...lb.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());const R=document.createRange();if(tn)R.selectNodeContents(tn);return tn?R.getClientRects():[]})()].map(x=>Math.round(x.top));if(new Set(rs).size>1)cut.push('必須が割れる')}});
  return {n:m.querySelectorAll('.stdrow').length,small:[...new Set(small)],ov:[...new Set(ov)],lap,cut:[...new Set(cut)],sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 if(!r){errs.push(tag+'：窓が開かない');await c.close();continue}
 if(r.n!==14)errs.push(tag+'：項目の行が '+r.n+'（14 のはず）');
 if(r.small.length)errs.push(tag+'：44px 未満 '+r.small.slice(0,6).join(' | '));
 if(r.ov.length)errs.push(tag+'：窓の外へはみ出す '+r.ov.slice(0,4).join(' | '));
 if(r.lap.length)errs.push(tag+'：項目の文と「必須」「×」が重なる '+r.lap.length);
 if(r.cut.length)errs.push(tag+'：'+r.cut.join(' '));
 if(r.sw>r.cw+1)errs.push(tag+'：横にはみ出す');
 if(shot){await p.evaluate(()=>{const m=document.querySelector('.modal');if(m){m.style.maxHeight='none';m.style.height='auto'}});await p.screenshot({path:shot+'-'+w+fs+'.png',fullPage:true})}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
