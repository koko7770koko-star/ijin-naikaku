// 文字「大」「特大」・360px で全画面（VIEWS）を開き、選び欄（select）で選んだ文字が欄の中で切れないかを測る（hz-xl-select-cut）。
// 測り方は diagxlcheck と同じ（canvas で選んだ文字の幅を測り、select の中の幅（左右の余白と▼の 16px を除く）と比べる）。標準・390px ははみ出さないことだけ見る。
// 入力欄の例（placeholder）は標準の文字・360px でも見る（hz-std-search-ph）。
// usage: node hozen/tools/selectcutxlcheck.js [--list]（--list は標準でも切れる物を一覧に出すだけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const LIST=process.argv.includes('--list');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,''],[360,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 await p.evaluate(f=>{S.equipment=[...Array(8)].map((_,i)=>({id:'q'+i,code:'E-'+(100+i),name:'設備'+(i+1),kind:'分電盤',importance:'ABC'[i%3],place:'',status:'稼働',photos:[],docs:[],repairs:[],health:[]}));
  S.settings.fscale=f;save();applyFScale()},fs);
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 for(const v of views){
  const r=await p.evaluate(v=>{try{const a={equipDetail:{eq:'q0'}}[v]||{};go(v,a)}catch(e){return {err:String(e)}}
   const out=[];for(const s of document.querySelectorAll('#app select')){if(!s.getClientRects().length||s.selectedIndex<0)continue;const cs=getComputedStyle(s),cv=document.createElement('canvas').getContext('2d');cv.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    const t=s.options[s.selectedIndex].text,tw=cv.measureText(t).width,room=s.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-16;if(tw>room+1)out.push('「'+t+'」（'+Math.round(tw)+'>'+Math.round(room)+'）')}
   // 入力欄の例（placeholder）も同じ測り方で（hz-xl-works-search：作業管理の「…協力」が切れていた）
   for(const s of document.querySelectorAll('#app input[placeholder]')){if(!s.getClientRects().length||s.value)continue;const cs=getComputedStyle(s),cv=document.createElement('canvas').getContext('2d');cv.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    const t=s.placeholder,tw=cv.measureText(t).width,room=s.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-(s.type==='search'?16:0);if(tw>room+1)out.push('入力欄の例「'+t+'」（'+Math.round(tw)+'>'+Math.round(room)+'）')}
   return {out,sw:document.documentElement.scrollWidth}},v);
  if(r.err){errs.push(tag+v+'：開けない '+r.err);continue}
  if(r.sw>w+1)errs.push(tag+v+'：はみ出す '+r.sw);
  // 標準の文字でも 360px で入力欄の例は切れない（hz-std-search-ph）
  for(const x of r.out)if(fs||LIST||x.startsWith('入力欄'))errs.push(tag+v+'：'+(x.startsWith('入力欄')?'':'選び欄 ')+x+' が切れる');
 }
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
