// 非常用発電機：60 台（棟 6 × 階 × 電気室）・月次点検の記録 3 年分（約 2100 件）＋ほかの測定 3000 件で、
// 発電機の一覧（診断の測定記録）とホームが 1 秒以内に出て、今月の ●/◯ の数が正しく、1 台目の窓を開いて数字を入れて保存すると
// 「次の発電機へ」が出て、押すと次の台の窓が 1 秒以内に開き、390px・文字「標準」「特大」ではみ出さないか（hz-v-gen-many）。
// usage: node hozen/tools/genmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const NG=60,LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(([f,NG])=>{S.settings.fscale=f;const L=[];
  for(let bI=0;bI<6;bI++){L.push({id:'bl'+bI,name:'ABCDEF'[bI]+'棟',type:'建屋',parent:'',note:'',pos:{}});
   for(let fI=0;fI<2;fI++){L.push({id:'fl'+bI+fI,name:(fI?'屋上':'地下1階'),type:'階',parent:'bl'+bI,note:'',pos:{}});L.push({id:'rm'+bI+fI,name:'第'+(fI+1)+'電気室（非常用発電機室 長い名前の例）',type:'電気室',parent:'fl'+bI+fI,note:'',pos:{}})}}
  S.locs=L;
  S.equipment=[...Array(NG)].map((_,i)=>({id:'gen'+i,code:'G-'+String(i).padStart(3,'0'),name:'非常用発電機 '+(i+1)+'号機（ディーゼル 500kVA）',kind:'発電機',locId:'rm'+(i%6)+(i%2),status:'稼働',importance:'A',repairs:[]}))
   .concat([...Array(200)].map((_,i)=>({id:'eqm'+i,code:'EQ-'+i,name:'試しの設備'+i,kind:'変圧器',locId:'rm'+(i%6)+'0',status:'稼働',importance:'',repairs:[]})));
  const M=[];const ym=TODAY.slice(0,7);
  for(let i=0;i<NG;i++)for(let k=0;k<36;k++){const d=addM(ym+'-05',-k);if(k===0&&(i%3===0||d>TODAY))continue;M.push({id:'mg'+i+'_'+k,at:'',date:d,type:'電圧・電流・電力',tplId:'mt_gen',name:GEN_TPL.name,equipId:'gen'+i,by:'',note:'',rows:GEN_TPL.rows.map((r,j)=>({...r,v:200+j}))})}
  for(let i=0;i<3000;i++)M.push({id:'mm'+i,at:'',date:addD(TODAY,-(i%1095)),type:'絶縁抵抗',tplId:'',name:'試しの測定'+i,equipId:'eqm'+(i%200),by:'',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:100}]});
  S.meas=M;save()},[fs,NG]);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const want=await p.evaluate(()=>genPending().length);
 const th=await p.evaluate(()=>{applyFScale();const s=performance.now();go('home');return performance.now()-s});if(th>LIM)bad.push(tag+'ホームが出るまで '+Math.round(th)+'ms');
 const tm=await p.evaluate(()=>{V.genB='';const s=performance.now();go('diag',{dgTab:'meas'});return performance.now()-s});await p.waitForTimeout(150);if(tm>LIM)bad.push(tag+'発電機の一覧が出るまで '+Math.round(tm)+'ms');
 const g=await p.evaluate(()=>{const c=document.querySelector('#genCard');const t=c?c.textContent:'';const m=t.match(/今月 ● (\d+)\/(\d+)/);const rows=c?[...c.querySelectorAll('.item')].length:0;
  const over=c?[...c.querySelectorAll('.item, .grp b, button')].filter(x=>x.getBoundingClientRect().right>391).length:0;return {done:m?+m[1]:-1,all:m?+m[2]:-1,rows,over,sw:document.documentElement.scrollWidth}});
 if(g.all!==NG)bad.push(tag+'発電機の台数が違う '+g.all+'/'+NG);if(g.done!==NG-want)bad.push(tag+'今月 ● の数が違う '+g.done+'/'+(NG-want));if(g.rows!==NG)bad.push(tag+'一覧の台数 '+g.rows);if(g.over)bad.push(tag+'一覧がはみ出す '+g.over);if(g.sw>392)bad.push(tag+'横にはみ出す '+g.sw);
 // 1台目を入れて保存 → 次の発電機へ
 const first=await p.evaluate(()=>genOrder().find(e=>genPending().some(x=>x.id===e.id)).id);
 await p.evaluate(id=>genStart(id),first);await p.waitForSelector('#ms_rows input[data-mv]');const ins=p.locator('#ms_rows input[data-mv]');const k=await ins.count();for(let i=0;i<k;i++)await ins.nth(i).fill(String(100+i));await p.fill('#ms_by','確認者');
 const s0=Date.now();await p.click('#modal button:text-is("保存")');const nx=await p.waitForSelector('#genNextBtn',{timeout:5000}).catch(()=>null);const sm=Date.now()-s0;
 if(!nx)bad.push(tag+'保存の後に「次の発電機へ」が出ない');else{if(sm>LIM+500)bad.push(tag+'保存から次の案内まで '+sm+'ms');
  const s1=Date.now();await nx.click();await p.waitForSelector('#ms_rows input[data-mv]',{timeout:5000}).catch(()=>bad.push(tag+'次の台の窓が開かない'));const om=Date.now()-s1;if(om>LIM)bad.push(tag+'次の台の窓が開くまで '+om+'ms');
  const cur=await p.evaluate(()=>{const e=document.querySelector('#ms_eq');return e?e.value:''});if(cur===first||!cur)bad.push(tag+'次の台に進まない '+cur);
  const mw=await p.evaluate(()=>{const m=document.querySelector('#modal');return m?m.scrollWidth>m.clientWidth+1:false});if(mw)bad.push(tag+'記録の窓が横にはみ出す');
  await p.evaluate(()=>closeModal(true))}
 const left=await p.evaluate(()=>genPending().length);if(left!==want-1)bad.push(tag+'保存しても未入力の数が減らない '+left+'/'+(want-1));
 console.log(tag+'ホーム '+Math.round(th)+'ms、発電機の一覧 '+Math.round(tm)+'ms、保存→次の案内 '+sm+'ms');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
