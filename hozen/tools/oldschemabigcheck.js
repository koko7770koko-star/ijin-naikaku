// 古い形の大きい記録：SCHEMA が無い（1）・2 の記録（設備 2000・予定 1 万・日常点検 3 年分・異常 3000）を端末に入れて開いたとき、
// 読み替え（validateData→migrate）を含めて 2 秒以内に開き、件数がそろい、日常点検が「完了（移行）」になり、新しい形で保存し直せるか（hz-v-oldschema-big）。
// 予定 2 万件の古い記録は、足りない項目を補うと約 570 万字になり端末の保存の上限（約 520 万字）を超える。そのときは
// 元の記録を上書きせずに残し、赤い帯「保存できていません…今すぐファイルに保存」が出て、読み直しても 2 万件が消えないことを確かめる。
// 保存の形は変えない。外への通信は止める。名前は「設備1」の形だけ。usage: node hozen/tools/oldschemabigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';const bad=[];const LIMIT=5.2e6;
const ymd=d=>d.toISOString().slice(0,10);const T0=new Date('2026-11-01T00:00:00Z');const day=i=>ymd(new Date(T0-i*864e5));
function make(schema,NT){
 const o={settings:{name:'',lim:{}},tasks:[],issues:[],daily:{},equipment:[],items:[]};if(schema)o.schema=schema;
 for(let i=0;i<NT;i++)o.tasks.push({id:'t'+i,date:day(i%1095),time:'',kind:'定期',cat:'',title:'点検'+i,place:'',staff:'',status:i%4?'完了':'予定',result:'',note:''});
 for(let i=0;i<2000;i++)o.equipment.push({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',status:'稼働',installed:'2005-04',life:20,repairs:[]});
 for(let i=0;i<3000;i++)o.issues.push({id:'i'+i,date:day(i%1095),title:'異常'+i,status:i%2?'完了':'対応中',detail:'',action:'',equipId:'e'+(i%2000)});
 return o}
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});
 // 今の形の日常点検の id を使う（知らない id は validateData が落とすため）
 const ids=await p.evaluate(()=>({n:S.settings.dnums.map(x=>x.id),c:S.settings.dchecks.map(x=>x.id)}));
 for(const [schema,NT] of [[0,10000],[2,10000],[0,20000]]){
  const over=NT>15000;const o=make(schema,NT);for(let i=0;i<1095;i++){const r={c:{}};ids.c.forEach(id=>r.c[id]='○');ids.n.slice(0,3).forEach((id,k)=>r[id]=100+k+(i%7));o.daily[day(i)]=r}
  const raw=JSON.stringify(o);const label='schema '+(schema||'なし')+'・予定 '+NT;
  await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,raw]);
  const s=Date.now();await p.reload();await p.waitForFunction(READY,null,{timeout:20000});const ms=Date.now()-s;
  const r=await p.evaluate(()=>{const ds=Object.values(S.daily);return {schema:S.schema,t:S.tasks.length,e:(S.equipment||[]).length,i:S.issues.length,d:ds.length,mig:ds.filter(x=>x&&x.done).length}});
  await p.evaluate(()=>save());await p.waitForTimeout(300);
  const bar=await p.evaluate(()=>{const e=document.querySelector('#sysbar');return e&&e.style.display!=='none'?e.innerText:''});
  const len=await p.evaluate(k=>(localStorage.getItem(k)||'').length,KEY);
  const after=await p.evaluate(k=>{try{return JSON.parse(localStorage.getItem(k)).schema}catch(e){return -1}},KEY);
  console.log(label+'：開くまで '+ms+'ms・元 '+raw.length+' 字→保存 '+len+' 字'+(bar?'・帯「'+bar.slice(0,24)+'…」':'')+'・予定 '+r.t+'・設備 '+r.e+'・異常 '+r.i+'・日常点検 '+r.d+'（完了 '+r.mig+'）');
  if(ms>2000)bad.push(label+'：開くのが遅い '+ms+'ms');
  if(over){
   if(len!==raw.length)bad.push(label+'：上限を超えたのに元の記録が変わった '+len);
   if(!/保存できていません/.test(bar)||!/ファイルに保存/.test(bar))bad.push(label+'：上限を超えたのに赤い帯が出ない');
  }else{
   if(r.schema!==3||after!==3)bad.push(label+'：schema が 3 にならない '+r.schema+'/'+after);
   if(len>LIMIT)bad.push(label+'：保存し直すと上限を超える '+len);
   if(bar)bad.push(label+'：保存できるのに帯が出る '+bar.slice(0,40));
  }
  if(r.t!==o.tasks.length)bad.push(label+'：予定の件数が違う '+r.t);
  if(r.e!==o.equipment.length)bad.push(label+'：設備の件数が違う '+r.e);
  if(r.i!==o.issues.length)bad.push(label+'：異常の件数が違う '+r.i);
  if(r.d!==1095)bad.push(label+'：日常点検の日数が違う '+r.d);
  if(r.mig!==1095)bad.push(label+'：古い日常点検が「完了」に移らない '+r.mig);
  if(len<raw.length*0.5)bad.push(label+'：保存し直すと記録が減っている '+len);
  for(const v of ['home','month','day','hist','equip']){const w=await p.evaluate(v=>{go(v);return document.documentElement.scrollWidth},v);if(w>392)bad.push(label+'：画面 '+v+' が横にはみ出す '+w)}
  // 読み直しても残る
  await p.reload();await p.waitForFunction(READY,null,{timeout:20000});
  if(await p.evaluate(()=>S.tasks.length)!==o.tasks.length)bad.push(label+'：読み直すと予定が減る');
 }
 console.log(bad.slice(0,15).join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
