// 夜勤シフト表：職員の名前に空白の無い長い英数字（60 字）や ' " < > & \ があるとき、390px・特大で表・印刷の用紙（cal・p11）・名前の窓が
// 画面の横にはみ出さず、押す所（onclick など）の命令が壊れず、<b> が太字にならないか（hz-v-longword-shift）。kinmuhyo_v1 の形は変えない。
// usage: node hozen/tools/shiftlongnamecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 for(const kind of ['long','quote']){const tag=(kind==='long'?'長い英数字':'記号')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.settings.fscale='xl';save();applyFScale()});
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 const k0=await p.evaluate(kind=>{const g=SHIFT.get(),k=Object.keys(g).sort().join(',');const N=i=>kind==='long'?('N'+i+'ABC123xyz').repeat(7).slice(0,60):'職員'+i+"の'名前\"<b>&amp;\\";
  g.members=g.members.map((m,i)=>({...m,name:N(i+1)}));SHIFT.set(g);return k},kind);
 await p.click('#nav button[data-v="home"]');await p.click('#nav button[data-v="shift"]');await p.waitForSelector('#shTable td.cell');await p.waitForTimeout(200);
 const scan=()=>p.evaluate(()=>{const o=[];document.querySelectorAll('*').forEach(e=>{for(const a of e.attributes){if(!/^on/.test(a.name))continue;try{new Function(a.value)}catch(x){o.push(a.name+'='+a.value.slice(0,80)+' → '+x.message)}}});
  return {o:o.slice(0,3),bold:[...document.querySelectorAll('b')].filter(b=>/^&amp;/.test(b.textContent)).length,sw:document.documentElement.scrollWidth}});
 const shown=await p.evaluate(kind=>document.body.innerText.includes(kind==='long'?'N1ABC123xyz':'の\'名前"<b>&amp;'),kind);if(!shown)bad.push(tag+'名前が表に出ていない（確かめの作りの誤り）');
 let r=await scan();if(r.sw>392)bad.push(tag+'表で横にはみ出す '+r.sw);r.o.forEach(x=>bad.push(tag+'表の押す所が壊れる '+x));if(r.bold)bad.push(tag+'名前の <b> が太字になる');
 // 名前の窓（名前を押す）
 const nm=await p.$('#shTable th.nm, #shTable td.nm, #shTable .name');if(nm){await nm.click().catch(()=>{});await p.waitForTimeout(300);r=await scan();if(r.sw>392)bad.push(tag+'名前の窓で横にはみ出す '+r.sw);r.o.forEach(x=>bad.push(tag+'名前の窓の押す所が壊れる '+x));await p.keyboard.press('Escape').catch(()=>{})}
 await p.click('#tabs button[data-p="sub"]').catch(()=>{});await p.waitForTimeout(800);r=await scan();if(r.sw>392)bad.push(tag+'印刷の用紙の画面で横にはみ出す '+r.sw);r.o.forEach(x=>bad.push(tag+'印刷の用紙の押す所が壊れる '+x));if(r.bold)bad.push(tag+'用紙で <b> が太字になる');
 const after=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1'))).sort().join(','));if(after!==k0)bad.push(tag+'kinmuhyo_v1 の形が変わった');
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
