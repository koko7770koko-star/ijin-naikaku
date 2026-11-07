// CSV を読み込むときの確かめの窓（設備台帳・予備品）：名前に < > & ' " \ や空白の無い長い英数字（60 字）があっても、窓にそのままの文字で出て
// （太字にならない）、押す所（onclick など）が壊れず、幅 360px・特大で窓が横にはみ出さないか（hz-v-csv-import-marks）。保存の形は変えない。usage: node hozen/tools/csvimportmarkscheck.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:360,height:780}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const L=('ABC123xyz').repeat(7).slice(0,60),Q="の'名前\"<b>&amp;\\";
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cim-'));
 // 書き出しの形をそのまま使い、名前を入れ替えて読み込む
 const files=await p.evaluate(async([L,Q])=>{window.save=()=>{};S.settings.fscale='xl';applyFScale();
  S.equipment=[{id:'e1',code:'E-1',name:'盤'+Q,place:L,maker:L,kind:'変圧器',status:'稼働'},{id:'e2',code:L,name:L,place:'',kind:'変圧器',status:'稼働'}];
  S.parts=[{id:'p1',code:'P-1',name:'部品'+Q,spec:L,maker:L,place:L,qty:1,unit:'個',min:'',price:'',equipIds:[]},{id:'p2',code:L,name:L,qty:1,unit:'個',min:'',price:'',equipIds:[]}];
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);S.equipment=m.equipment;S.parts=m.parts}
  const grab=async f=>{let t='';const o=window.download;window.download=async(n,bl)=>{t=await bl.text();return true};try{download=window.download}catch(e){}f();await new Promise(r=>setTimeout(r,300));try{download=o}catch(e){}return t};
  const eq=await grab(()=>exportEquipCsv()),st=await grab(()=>exportStockCsv());S.parts=[];return {eq,st}},[L,Q]);
 fs.writeFileSync(path.join(tmp,'eq.csv'),files.eq);fs.writeFileSync(path.join(tmp,'st.csv'),files.st);
 for(const [lab,view,sel,f] of [['設備台帳',"V.eqFo=true;go('equip')",'input[onchange^="importEquipCsv("]','eq.csv'],['予備品',"V.stTab='parts';go('stock')",'input[onchange^="importStockCsv("]','st.csv']]){
  await p.evaluate(v=>eval(v),view);const inp=await p.$(sel);if(!inp){await p.evaluate(()=>go('set'));}
  const ok=await p.$(sel);if(!ok){bad.push(lab+'：読み込みの欄が見つからない');continue}
  await p.setInputFiles(sel,path.join(tmp,f));await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{const m=document.querySelector('#modal');if(!m||!m.innerText.trim())return {none:1};const o=[];m.querySelectorAll('*').forEach(e=>{for(const a of e.attributes){if(!/^on/.test(a.name))continue;try{new Function(a.value)}catch(x){o.push(a.name+' → '+x.message)}}});
   return {o,bold:[...m.querySelectorAll('b')].filter(b=>/^&amp;/.test(b.textContent)).length,sw:document.documentElement.scrollWidth,ms:m.scrollWidth-m.clientWidth,txt:m.innerText.slice(0,60)}});
  if(r.none){bad.push(lab+'：確かめの窓が出ない');continue}
  r.o.forEach(x=>bad.push(lab+'：押す所が壊れる '+x));if(r.bold)bad.push(lab+'：名前の <b> が太字になる');if(r.sw>362||r.ms>2)bad.push(lab+'：窓が横にはみ出す '+r.sw+'/'+r.ms);
  console.log(lab+'：'+r.txt.replace(/\n/g,' / '));await p.evaluate(()=>{try{closeModal(true)}catch(e){}})}
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
