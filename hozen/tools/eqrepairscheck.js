// 設備カルテの修理・部品交換の履歴：25件・長い文でも新しい順・8件で畳む・「ほか○件」で全部出る・390px で横にはみ出さない・保存の並びは変えない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const order0=await p.evaluate(()=>{const reps=[];for(let i=0;i<25;i++){const m=1+(i*7)%12,d=1+(i*5)%28;reps.push({id:'r'+String(i).padStart(3,'0'),date:`${2000+i%20}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,kind:i%3?'修理':'故障',content:i===4?'あ'.repeat(200)+'Abcdefghijklmnopqrstuvwxyz0123456789'.repeat(5):'部品交換の例'+i,vendor:i%2?'○○電機':'',cost:i%2?'123456':'',photos:[]})}
  S.equipment=[{id:'eq1',code:'',name:'確認用の設備',place:'',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',kind:'',importance:'',status:'',life:'',renewYear:'',repairs:reps,health:[],photos:[],docs:[]}];save();go('equipDetail',{eq:'eq1'});return JSON.stringify(reps.map(r=>r.id))});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const it=[...([...document.querySelectorAll('#app .card')].find(c=>/故障・修理履歴/.test((c.querySelector('h2')||{}).textContent||''))||document.createElement('div')).querySelectorAll('.item')];const d=it.map(x=>x.querySelector('.dt small').textContent+x.querySelector('.dt').childNodes[0].textContent);
  return {n:it.length,d,sw:document.documentElement.scrollWidth,btn:[...document.querySelectorAll('#app button')].some(x=>/ほか17件/.test(x.textContent))}});
 if(!r.btn||r.n!==8)bad.push('8件で畳まれない '+r.n+' '+r.btn);
 const ys=r.d.map(x=>x.slice(0,4));if(ys.join()!==[...ys].sort().reverse().join())bad.push('新しい順でない '+ys);
 if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 await p.evaluate(()=>{V.eqMore={};V.eqMore['eq1:rep']=true;render()});await p.waitForTimeout(300);
 const all=await p.evaluate(()=>({n:[...([...document.querySelectorAll('#app .card')].find(c=>/故障・修理履歴/.test((c.querySelector('h2')||{}).textContent||''))||document.createElement('div')).querySelectorAll('.item')].length,sw:document.documentElement.scrollWidth}));
 if(all.n!==25)bad.push('全部出ない '+all.n);if(all.sw>392)bad.push('全部出すと横にはみ出す '+all.sw);
 const order1=await p.evaluate(()=>JSON.stringify(S.equipment[0].repairs.map(r=>r.id)));if(order1!==order0)bad.push('保存の並びが変わった');
 if(errs.length)bad.push(errs.join(';'));console.log(bad.length?'FAIL\n'+bad.join('\n'):'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
