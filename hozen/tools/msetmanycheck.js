// 保全の設定（go('mset')）：作業前・作業後のチェックリストに 300 行（1 行 68 字）を入れても 40 行までにそろえて保存し（1 行は 200 字まで）、画面が 1 秒以内、
// 健全度の重みは 0〜100 だけ受け付け（-5・101・空は戻す。空にしただけで 0＝使わない、にならない）、設備 2000 台・異常 5000 件でも重みを変えた後の画面が 1 秒以内、390px・文字「特大」ではみ出さないか（hz-v-mset-many）。
// 保存の形は変えない。usage: node hozen/tools/msetmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{const T=TODAY;S.settings.fscale=f;
  S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',installed:'2005-04',life:20,photos:[],repairs:[],docs:[],health:[]}));
  S.issues=[...Array(5000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%900)),equipId:'e'+(i%2000),title:'異常'+i,status:i%3?'完了':'対応中',failure:i%2===0,downH:'1',closed:addD(T,-(i%900)),cost:''}));save();applyFScale()},fs);
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 let s=Date.now();await p.evaluate(()=>go('mset'));await raf();const tOpen=Date.now()-s;if(tOpen>LIM)bad.push(tag+'開くのに '+tOpen+'ms');
 const long=[...Array(300)].map((_,i)=>'確認'+(i+1)+'：'+'あ'.repeat(60)+'おわり').join('\n');
 await p.evaluate(v=>{const t=document.querySelectorAll('#app textarea')[0];t.value=v;t.dispatchEvent(new Event('change'))},long);await p.waitForTimeout(400);
 const pre=await p.evaluate(()=>({n:S.chkPre.length,mx:Math.max(...S.chkPre.map(x=>x.length)),first:S.chkPre[0].slice(0,4)}));
 if(pre.n!==40||pre.mx!==68||pre.first!=='確認1：')bad.push(tag+'チェックリストのそろえ方 '+JSON.stringify(pre));
 s=Date.now();await p.evaluate(()=>render());await raf();const tR=Date.now()-s;if(tR>LIM)bad.push(tag+'40 行の後の画面 '+tR+'ms');
 for(const [v,ok] of [['-5',false],['101',false],['',false],['35',true]]){const before=await p.evaluate(()=>S.healthCfg.age);
  s=Date.now();await p.evaluate(v=>{const i=document.querySelector('#app input[type=number]');i.value=v;i.dispatchEvent(new Event('change'))},v);await raf();const tW=Date.now()-s;if(tW>LIM)bad.push(tag+'重み '+v+' に '+tW+'ms');
  const after=await p.evaluate(()=>S.healthCfg.age);if(ok&&after!==35)bad.push(tag+'重み 35 が入らない '+after);if(!ok&&after!==before)bad.push(tag+'重み '+v+' が入ってしまう '+after)}
 s=Date.now();await p.evaluate(()=>go('diag',{dgTab:'health'}));await raf();const tD=Date.now()-s;if(tD>LIM)bad.push(tag+'重みを変えた後の健全度 '+tD+'ms');
 await p.evaluate(()=>go('mset'));await raf();
 const ov=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cut:[...document.querySelectorAll('#app button,#app label.f')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent.trim().slice(0,12))}));
 if(ov.sw>392)bad.push(tag+'はみ出す '+ov.sw);if(ov.cut.length)bad.push(tag+'文字が切れる '+ov.cut.join('|'));
 await p.waitForTimeout(400);const sv=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return [o.chkPre.length,o.healthCfg.age]});if(sv[0]!==40||sv[1]!==35)bad.push(tag+'保存 '+sv);
 console.log(tag+'開く '+tOpen+'ms・健全度 '+tD+'ms');await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
