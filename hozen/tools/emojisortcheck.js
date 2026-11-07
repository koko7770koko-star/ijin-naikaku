// 名前順の並べ替え：設備台帳（名前順・ID順）と場所の木で、絵文字・異体字・半角カナ・数字入り（盤-2・盤-10）が混ざっても、
// 例外が出ず、2 回開いても同じ並びで、数字は 2→10 の順になるか（hz-v-emoji-sort）。保存の形は変えない。usage: node hozen/tools/emojisortcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{window.save=()=>{};const N=['盤-10','🔥盤','盤-2','𠮷野盤','ﾊﾞﾝ-1','葉\u{E0100}盤','盤-1','ばん','Ｂ盤','b盤'];
  S.equipment=N.map((n,i)=>({id:'e'+i,code:n,name:n,kind:'変圧器',status:'稼働'}));
  S.locs=[{id:'lb',name:'A棟',type:'建屋',parent:''},{id:'lf',name:'1階',type:'階',parent:'lb'},{id:'lr',name:'第1電気室',type:'電気室',parent:'lf'},...N.map((n,i)=>({id:'lp'+i,name:n,type:'盤',parent:'lr'}))];
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);S.equipment=m.equipment;S.locs=m.locs}
  const R={};const names=()=>[...document.querySelectorAll('#app .item .ti')].map(e=>e.textContent.trim()).filter(t=>N.some(n=>t.includes(n)));
  for(const k of ['name','code']){V.eqSort=k;go('equip');const a=names();go('home');go('equip');const b2=names();R[k]={a,same:JSON.stringify(a)===JSON.stringify(b2)}}
  V['lo_lb']=true;V['lo_lf']=true;V['lo_lr']=true;go('locs');R.locs=[...document.querySelectorAll('#app .locn .ti')].map(e=>e.textContent.replace(/^[▾▸]\s*/,'').trim()).filter(t=>N.includes(t));
  return R});
 console.log(JSON.stringify(r));
 for(const k of ['name','code']){const a=r[k].a;if(a.length<N_LEN())bad.push(k+'順：一覧に全部出ない '+a.length);if(!r[k].same)bad.push(k+'順：2 回開くと並びが変わる');
  const i2=a.findIndex(t=>t.includes('盤-2')),i10=a.findIndex(t=>t.includes('盤-10'));if(k==='name'&&!(i2>=0&&i10>=0&&i2<i10))bad.push(k+'順：盤-2 が 盤-10 より前にない')}
 function N_LEN(){return 10}
 {const a=r.locs;if(a.length<10)bad.push('場所の木：盤が全部出ない '+a.length);if(!(a.indexOf('盤-2')>=0&&a.indexOf('盤-2')<a.indexOf('盤-10')))bad.push('場所の木：盤-2 が 盤-10 より前にない')}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
