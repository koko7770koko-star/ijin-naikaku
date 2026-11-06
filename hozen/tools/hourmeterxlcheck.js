// 文字「大」「特大」・360px：稼働時間計を記録の窓（前回・読み値・読んだ日・「前回より小さい」の注意・ボタン）が、割れず・切れず・横にはみ出さず・押しやすい（44px 以上）ことを確かめる（hz-l-hourmeter）。
// usage: node hozen/tools/hourmeterxlcheck.js [スクリーンショットの出力先]   （外部への通信は止める。名前は「設備1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const fsc of ['l','xl']){
 const c=await b.newContext({viewport:{width:360,height:780},hasTouch:true});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(fsc=>{S.settings.fscale=fsc;applyFScale();S.equipment=[{id:'eqh1',code:'G-1',name:'設備1',kind:'発電機',photos:[],docs:[],repairs:[],run:{meters:[{date:addD(TODAY,-60),value:1250.5,by:'職員1'},{date:addD(TODAY,-30),value:123456.75,by:'職員1'}]}}];
  addMeter('eqh1')},fsc);
 await p.waitForTimeout(400);await p.fill('#mt_v','5');await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const m=document.querySelector('#modal'),z=parseFloat(document.documentElement.style.zoom)||1;const H=e=>{const a=e.getBoundingClientRect();return {h:a.height/z,r:a.right,b:a.bottom,sw:e.scrollWidth,cw:e.clientWidth}};
  const ctl=[...m.querySelectorAll('input,button')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({t:(e.id||e.textContent).slice(0,8),...H(e)}));
  const txt=[...m.querySelectorAll('.muted,#mt_w,h3,label')].map(e=>({t:e.textContent.slice(0,10),...H(e)}));
  return {ctl,txt,msw:m.scrollWidth,mcw:m.clientWidth,sw:document.documentElement.scrollWidth,iw:innerWidth,warn:document.querySelector('#mt_w').textContent.length}});
 const tag='['+fsc+'] ';
 if(!r.warn)bad.push(tag+'「前回より小さい」の注意が出ない');
 r.ctl.forEach(x=>{if(x.h<44)bad.push(tag+'押す物が44px未満 '+JSON.stringify(x));if(x.sw>x.cw+1&&x.t)bad.push(tag+'中身が切れる '+JSON.stringify(x));if(x.r>r.iw+1)bad.push(tag+'画面の右に出る '+JSON.stringify(x))});
 r.txt.forEach(x=>{if(x.sw>x.cw+1)bad.push(tag+'文字がはみ出す '+JSON.stringify(x))});
 if(r.msw>r.mcw+1)bad.push(tag+'窓が横にはみ出す '+r.msw+'>'+r.mcw);if(r.sw>r.iw+2)bad.push(tag+'横にはみ出す '+r.sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2].replace(/(\.\w+)?$/,'-'+fsc+'$1')});
 await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
