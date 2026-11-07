// AI 支援：設備 2000 台・異常 5000 件（対応中 3300）・測定 2 万件・今月の予定 3000 件・技術資料 200 件（1 件 3 万字）のとき、AI に送る文が上限で切られ、切ったことが画面に出て、
// 送る前の窓が速く開き、つながらない（通信を止めた）ときも画面が固まらず「つながらない」窓になるか（hz-v-ai-context-big）。
// キーは書かない（端末の一時保存に試しの文字を置くだけ）。外への通信はすべて止める。usage: node hozen/tools/aicontextbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=60000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();let sent=0;
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();sent++;return r.abort()});
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 await p.evaluate(()=>{try{sessionStorage.setItem(KEYSTORE,'test-dummy')}catch(e){}const T=TODAY;
  S.mtpl=(S.mtpl||[]).concat([0,1,2].map(k=>({id:'t'+k,name:'測定'+k,type:'絶縁抵抗',cycleM:6,rows:[]})));
  S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',installed:'2005-04',life:20,importance:'A',photos:[],docs:[],health:[],repairs:[0,1,2].map(k=>({id:'r'+i+k,date:addD(T,-((i*3+k)%700)),kind:'修理',content:'修理 VCB 異音 '+'あ'.repeat(40),vendor:'',cost:1000,photos:[]}))}));
  S.issues=[...Array(5000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%700)),equipId:'e'+(i%2000),title:'異常'+i+' VCB 異音',place:'電気室',detail:'詳細'+'い'.repeat(80),action:'処置'+'う'.repeat(40),status:i%3?'対応中':'完了',urgency:'中',failure:i%2===0,downH:'1',closed:i%3?'':addD(T,-(i%700)),cost:'',log:[]}));
  S.meas=[...Array(20000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%700)),equipId:'e'+(i%2000),tplId:'t'+(i%3),type:'絶縁抵抗',name:'測定',rows:[{name:'R',v:String(i%50),min:'5',max:'',unit:'MΩ'}]}));
  const ym=T.slice(0,8);for(let i=0;i<3000;i++)S.tasks.push({id:'tm'+i,date:ym+String(1+i%28).padStart(2,'0'),time:'',kind:'定期',cat:S.settings.cats[0],title:'点検'+i,place:'',staff:'',attend:'',status:i%5?'完了':'予定',result:i%50?'':'要観察',note:'',photos:[]});
  S.issues.slice(0,600).forEach((x,k)=>x.date=ym+String(1+k%28).padStart(2,'0'));
  const para='受変電設備の点検手順。VCB の開閉操作の前に負荷を確認する。異音・異臭があれば記録する。';S.library=[...Array(200)].map((_,i)=>({id:'lb'+i,title:'資料'+i,tags:'点検',text:para.repeat(Math.ceil(30000/para.length)).slice(0,30000),equipIds:[],file:'',type:''}));
  for(let i=0;i<400;i++){const d=addD(T,-i);S.daily[d]=S.daily[d]||{}}
  save()});
 const cases=[['異常案件の要約',()=>aiIssues()],['保全計画の改善案',()=>aiPlan()],['異常候補の抽出',()=>aiCandidates()],['設備診断',()=>aiDiag('e0')],
  ['申し送りの下書き',()=>aiHandover(TODAY)],['日報の特記事項の下書き',()=>aiDailyNote(TODAY)],
  ['月報の所見の下書き',()=>aiMonthlyNote(+TODAY.slice(0,4),+TODAY.slice(5,7))],
  ['技術資料からの回答',()=>{V.libQ='VCB 異音';aiLib()}],
  ['過去の故障の要約',()=>{aiSearchHist('VCB');aiHistSummary()}]];
 for(const [name,fn] of cases){
  const s=Date.now();await p.evaluate(`(${fn})()`);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const ms=Date.now()-s;
  const r=await p.evaluate(()=>{const pre=document.querySelector('#modal pre.aisrc');return {len:pre?pre.textContent.length:-1,txt:pre?pre.textContent:'',sw:document.querySelector('#modal')?document.querySelector('#modal').scrollWidth-document.querySelector('#modal').clientWidth:0}});
  const cut=/省略|ほか\s*\d+\s*件|以下略|全\s*\d+\s*(件|台)/.test(r.txt);
  console.log(name+'：窓 '+ms+'ms・送る文 '+r.len+' 字'+(cut?'・省略の表示あり':''));
  if(r.len<0){bad.push(name+'：送る前の窓が開かない');continue}
  if(ms>1500)bad.push(name+'：窓が開くのが遅い '+ms+'ms');
  if(r.len>LIM)bad.push(name+'：送る文が長すぎる '+r.len+' 字（上限 '+LIM+'）');
  if(r.sw>1)bad.push(name+'：送る前の窓が横にはみ出す');
  // 送る（通信は止めてある）→ 固まらず「作れませんでした」の窓
  const t0=Date.now();await p.evaluate(()=>window.__aiGo());
  const ok=await p.waitForFunction(()=>/作れませんでした/.test((document.querySelector('#modal')||{}).innerText||''),null,{timeout:20000}).then(()=>true).catch(()=>false);
  if(!ok)bad.push(name+'：つながらないとき「作れませんでした」にならない');
  const t1=Date.now()-t0;if(t1>15000)bad.push(name+'：つながらないと分かるまで遅い '+t1+'ms');
  const alive=await p.evaluate(()=>{closeModal(true);go('home');return document.querySelector('#app').children.length>0});if(!alive)bad.push(name+'：閉じた後に画面が出ない');
 }
 // 異常 5000 件でも「対応中の異常」の要約は全体の件数を伝える
 const iss=await p.evaluate(()=>{aiIssues();const t=document.querySelector('#modal pre.aisrc').textContent;closeModal(true);return t});
 const n=await p.evaluate(()=>openIssues().length);
 if(!iss.includes(String(n)))bad.push('異常案件の要約：全体の件数 '+n+' が送る文に無い');
 const pl=await p.evaluate(()=>{aiPlan();const t=document.querySelector('#modal pre.aisrc').textContent;closeModal(true);return t});
 if(!/2000/.test(pl))bad.push('保全計画の改善案：全体の台数 2000 が送る文に無い（80 台で切ったことが分からない）');
 const hs=await p.evaluate(()=>{aiSearchHist('VCB');const n=(window.__hs||[]).length;aiHistSummary();const t=document.querySelector('#modal pre.aisrc').textContent;closeModal(true);return {n,t}});
 if(hs.n>40&&!hs.t.includes(String(hs.n)))bad.push('過去の故障の要約：見つかった件数 '+hs.n+' が送る文に無い');
 // 少ないときは省略の文を出さない
 const few=await p.evaluate(()=>{S.issues=S.issues.slice(0,6);aiIssues();const t=document.querySelector('#modal pre.aisrc').textContent;closeModal(true);return t});
 if(/省略/.test(few))bad.push('異常が少ないのに「省略」と出る');
 if(sent===0)bad.push('送る操作をしたのに通信が起きていない（確かめになっていない）');
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
