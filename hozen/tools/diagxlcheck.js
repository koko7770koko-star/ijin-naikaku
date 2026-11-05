// 診断（diag）を設備・記録を入れた形で、文字「大」「特大」・360px で見る（hz-xl-review-14）。
// ①故障分析の月の札が「12/月」と2行に割れない ②まとめの行が「停/止〜復旧」と割れない ③測定記録の2つの絞り込みが「すべての」で切れない
// ④健全度の行の下の行が「・人の評価」と「・」から始まらない（場所が無いとき。標準でも）。月の札は標準でも割れるので、画面では数字だけ（印刷は「月」付き）。
// usage: node hozen/tools/diagxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 await p.evaluate(f=>{S.equipment=[...Array(20)].map((_,i)=>({id:'q'+i,code:'E-'+(100+i),name:'設備'+(i+1),kind:'分電盤',importance:'ABC'[i%3],place:'',status:'稼働',photos:[],docs:[],repairs:[],health:i%2?[{date:addD(TODAY,-30),score:1+i%5}]:[]}));
  S.issues=[...Array(15)].map((_,i)=>({id:'qi'+i,src:'manual:qi'+i,date:addD(TODAY,-i*20),title:'不具合'+i,place:'',detail:'',status:'完了',urgency:'中',action:'',closed:addD(TODAY,-i*20+1),photos:[],equipId:'q'+(i%6),failure:true,log:[]}));
  S.meas=[...Array(20)].map((_,i)=>({id:'m'+i,at:nowIso(),date:addD(TODAY,-i),type:MEAS_TYPES[0],name:MEAS_TYPES[0],equipId:'q'+i,tplId:'',rows:[{name:'絶縁抵抗',v:i%4?50:0.05,unit:'MΩ',min:0.1,max:'',src:''}],cond:{temp:'',hum:'',toolName:''},by:'職員1',note:''}));
  S.settings.fscale=f;save();applyFScale()},fs);
 // ① ②
 await p.evaluate(()=>go('diag',{dgTab:'fail'}));await p.waitForTimeout(300);
 const r1=await p.evaluate(()=>{const sm=[...document.querySelectorAll('.bars .bar small')];const lh=sm.length?parseFloat(getComputedStyle(sm[0]).lineHeight)||16:16;
  const two=sm.filter(e=>e.getBoundingClientRect().height>lh*1.5).map(e=>e.textContent);
  const sum=document.querySelector('.dgsum');let split='';if(sum){const walk=document.createTreeWalker(sum,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){const t=n.textContent,i=t.indexOf('停止〜復旧');if(i<0)continue;const tops=[...Array(5)].map((_,k)=>{const rg=document.createRange();rg.setStart(n,i+k);rg.setEnd(n,i+k+1);return Math.round(rg.getClientRects()[0].top)});if(Math.max(...tops)-Math.min(...tops)>2)split='停止〜復旧 が割れる'}}
  return {n:sm.length,two,month:sm.length?sm[sm.length-1].innerText.trim():'',split,sw:document.documentElement.scrollWidth}});
 if(!r1.n)errs.push(tag+'故障分析の月の札が無い');
 if(r1.two.length)errs.push(tag+'故障分析の月の札が2行に割れる：'+r1.two.slice(0,3).join(','));
 if(!/^\d+$/.test(r1.month))errs.push(tag+'月の札が数字だけになっていない：'+r1.month);
 if(r1.split&&fs)errs.push(tag+r1.split);
 if(r1.sw>w+1)errs.push(tag+'故障分析がはみ出す '+r1.sw);
 // ③
 await p.evaluate(()=>go('diag',{dgTab:'meas'}));await p.waitForTimeout(300);
 const r3=await p.evaluate(()=>[...document.querySelectorAll('#app select')].slice(0,2).map(s=>{const cs=getComputedStyle(s),cv=document.createElement('canvas').getContext('2d');cv.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const tw=cv.measureText(s.options[s.selectedIndex].text).width;return {t:s.options[s.selectedIndex].text,tw,room:s.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-16}}));
 if(r3.length<2)errs.push(tag+'測定記録の絞り込みが無い');
 for(const s of r3)if(fs&&s.tw>s.room)errs.push(tag+'測定記録の絞り込み「'+s.t+'」が切れる（'+Math.round(s.tw)+'>'+Math.round(s.room)+'）');
 // ④
 await p.evaluate(()=>go('diag',{dgTab:'health'}));await p.waitForTimeout(300);
 const r4=await p.evaluate(()=>[...document.querySelectorAll('#app .item .meta')].map(e=>e.textContent.trim()).filter(t=>t.startsWith('・')).slice(0,2));
 if(r4.length)errs.push(tag+'健全度の行が「・」から始まる：'+r4.join(' / '));
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
