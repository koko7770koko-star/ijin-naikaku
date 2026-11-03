// 設備台帳CSVの往復の確認：書き出したCSVを（UTF-8 BOM付き・Excel で保存し直した Shift_JIS の両方で）そのまま読み込んでも、
// 設備が二重に増えない（設備IDの無い設備も、名前と設置場所が同じなら同じ設備とみなす）・名前・場所（4段）・設置年月・修理履歴が変わらない。
// 階層の区切り「›」は Shift_JIS に無く Excel では「?」になるが、それでも場所（4段）に結びつく。
// 同じ名前・場所の設備IDなしが2台あるときは、勝手に1台へ寄せない（2台とも残る）。保存の形・保存キーは変えない。
// usage: node hozen/tools/eqcsvroundcheck.js
const {chromium}=require('playwright');const path=require('path');const {execFileSync}=require('child_process');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const toSjis=t=>execFileSync('python3',['-I','-c','import sys;sys.stdout.buffer.write(sys.stdin.buffer.read().decode("utf-8").encode("cp932","replace"))'],{input:Buffer.from(t,'utf-8')});
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const setup=()=>p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});
  S.locs=[mk('b1','A棟','建屋',''),mk('f1','1階','階','b1'),mk('r1','第1電気室','電気室','f1'),mk('p1','動力盤-1','盤','r1')];
  S.equipment=[
   {id:'e0',code:'E-001',name:'受電盤',place:'A棟 1階',maker:'甲',model:'M1',serial:'S1',installed:'2015-04',cycle:'年1回',note:'',locId:'p1',photos:[],docs:[],repairs:[{id:'r1',date:'2026-01-05',kind:'修理',content:'端子の増し締め',vendor:'○○電気',cost:12000,photos:[]}],health:[]},
   {id:'e1',code:'',name:'照明分電盤',place:'A棟 1階 廊下',maker:'',model:'',serial:'',installed:'2010-10',cycle:'',note:'',locId:'r1',photos:[],docs:[],repairs:[{id:'r2',date:'2026-02-01',kind:'部品交換',content:'ブレーカー交換',vendor:'',cost:'',photos:[]}],health:[]},
   {id:'e2',code:'',name:'換気扇',place:'屋上',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[]},
   {id:'e3',code:'',name:'換気扇',place:'屋上',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[]}];
  save();go('equip')});
 const snap=()=>p.evaluate(()=>JSON.stringify(S.equipment.map(e=>[e.id,e.code,e.name,e.place,e.installed||'',e.locId||'',(e.repairs||[]).map(r=>r.date+r.content).join('|')])));
 const exportCsv=()=>p.evaluate(()=>{let t='';window.download=async(n,b)=>{t=await b.text();return true};try{download=window.download}catch(e){}exportEquipCsv();return new Promise(r=>setTimeout(()=>r(t),300))});
 const run=async(label,bytesOf)=>{
  await setup();await p.waitForTimeout(200);const before=await snap();const csv=await exportCsv();if(!csv){bad.push(label+'：書き出しが空');return}
  const buf=bytesOf(csv);
  const P=await p.evaluate(a=>{const t=csvDecode(new Uint8Array(a).buffer);const P=planEquipCsv(t);return {e:P.eqs.length,nNew:P.eqs.filter(x=>!x.ex).length,s:P.skip,noLoc:P.noLoc}},[...buf]);
  // 換気扇（IDなし・同じ名前と場所が2台）だけは見分けられないので新規 2 件になる。それ以外の 2 台は上書き
  if(P.e!==4||P.nNew!==2||P.s.length||P.noLoc)bad.push(label+'：読み込みの計画 '+JSON.stringify(P));
  await p.evaluate(a=>{PENDING_EQCSV=planEquipCsv(csvDecode(new Uint8Array(a).buffer));return applyEquipCsv()},[...buf]);await p.waitForTimeout(500);
  const after=await p.evaluate(()=>({n:S.equipment.length,ls:JSON.parse(localStorage.getItem('hospElecSched_v1')).equipment.length,
   e0:S.equipment.find(e=>e.id==='e0'),e1:S.equipment.find(e=>e.id==='e1'),fan:S.equipment.filter(e=>e.name==='換気扇').length}));
  // 受電盤・照明分電盤は 1 台ずつのまま（二重にならない）。換気扇は見分けられないので 2+2=4 台（勝手に寄せない）
  if(after.n!==6||after.ls!==6)bad.push(label+'：読み込み後の台数 '+after.n+'/'+after.ls+'（6 のはず）');
  if(after.fan!==4)bad.push(label+'：換気扇 '+after.fan);
  const chk=(e,exp,nm)=>{if(!e){bad.push(label+'：'+nm+' が消えた');return}
   for(const k of ['name','place','installed','locId'])if((e[k]||'')!==exp[k])bad.push(label+'：'+nm+' の '+k+' が変わった '+JSON.stringify([e[k],exp[k]]));
   if((e.repairs||[]).length!==exp.rep)bad.push(label+'：'+nm+' の修理履歴 '+(e.repairs||[]).length);};
  chk(after.e0,{name:'受電盤',place:'A棟 1階',installed:'2015-04',locId:'p1',rep:1},'受電盤');
  chk(after.e1,{name:'照明分電盤',place:'A棟 1階 廊下',installed:'2010-10',locId:'r1',rep:1},'照明分電盤（IDなし）');
  // 元に戻すと読み込み前と同じ
  await p.evaluate(()=>{document.querySelector('#undobar button').click()});await p.waitForTimeout(200);
  if(await snap()!==before)bad.push(label+'：元に戻しても同じにならない');
 };
 await run('UTF-8',t=>Buffer.from(t.startsWith('﻿')?t:'﻿'+t,'utf-8'));
 await run('Shift_JIS',t=>toSjis(t.replace(/^﻿/,'')));
 // 2 回続けて読み込んでも増えない（IDなしの 1 台）
 await setup();await p.waitForTimeout(200);const csv=await exportCsv();
 for(let i=0;i<2;i++){await p.evaluate(t=>{PENDING_EQCSV=planEquipCsv(t);return applyEquipCsv()},csv);await p.waitForTimeout(400)}
 const n2=await p.evaluate(()=>S.equipment.filter(e=>e.name==='照明分電盤').length);if(n2!==1)bad.push('2 回読み込むと照明分電盤が '+n2+' 台');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
