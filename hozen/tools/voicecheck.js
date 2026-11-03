// 日常点検の音声入力 parseVoice：数字・全角・「点」・漢数字（十二点五など）・単位や項目名で受電電圧・最大需要電力・変圧器温度に振り分ける。
// 「異常なし」で全部良。音声認識が無い端末では押したときに理由の窓が出る（固まらない）。外へ送らない。
// usage: node hozen/tools/voicecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const ids=await p.evaluate(()=>numDefs().map(n=>n.id));
 const T=async s=>JSON.stringify(await p.evaluate(s=>parseVoice(s).nums,s));
 const exp=(o)=>JSON.stringify(Object.fromEntries(Object.entries(o).map(([i,v])=>[ids[i],v])));
 const cases=[['電圧6.6キロボルト デマンド120キロワット 温度45度',{0:6.6,1:120,2:45}],
  ['電圧 十二点五 キロボルト',{0:12.5}],['デマンド三百五十キロワット',{1:350}],['温度四十五度',{2:45}],['電圧六点六キロボルト デマンド百二十キロワット',{0:6.6,1:120}],
  ['６．６ 120 45',{0:6.6,1:120,2:45}],['電圧六点六',{0:6.6}],['異常なし',{}]];
 for(const [t,o] of cases){const r=await T(t);if(r!==exp(o))bad.push(t+' → '+r+'（正：'+exp(o)+'）')}
 if(!await p.evaluate(()=>parseVoice('異常なし').allOK))bad.push('異常なし が全部良にならない');
 const kn=await p.evaluate(()=>['十','十二','百','百五','二百三十四','〇','一〇','三点一四'].map(kanjiToNum).join(','));if(kn!=='10,12,100,105,234,0,10,3.14')bad.push('漢数字 '+kn);
 // 音声認識が無い端末
 await p.evaluate(()=>{window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;voiceInput()});await p.waitForTimeout(200);
 if(!/音声入力が使えません/.test(await p.evaluate(()=>document.querySelector('#modal').innerText)))bad.push('使えない端末で理由の窓が出ない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
