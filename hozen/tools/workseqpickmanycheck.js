// 作業指示書の窓：設備 2000 台（場所 3400）・人員 200 人で、新しい作業の窓が 1 秒以内に開き、「設備を探す」欄で名前・場所（棟）から絞れて
// 選んだ設備は絞っても隠れず、保存すると選んだ設備だけが入る。設備が 20 台以下なら探す欄は出ない。390px・特大ではみ出さない（hz-v-works-eqpick-many）。
// 保存の形は変えない。usage: node hozen/tools/workseqpickmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E-'+i,name:'設備'+i,kind:'変圧器',locId:L[(i*7)%L.length].id,place:'',status:'稼働',photos:[],repairs:[],docs:[]}));
  S.settings.staff=[...Array(200)].map((_,i)=>'職員'+(i+1));save();applyFScale();go('works')},fs);await p.waitForTimeout(300);
 let s=Date.now();await p.evaluate(()=>editWork());await p.waitForSelector('#wk_eqs',{timeout:10000});const tOpen=Date.now()-s;if(tOpen>1000)bad.push(tag+'窓が開くのに '+tOpen+'ms');
 const q=await p.$('#wk_eqs');const box=await p.evaluate(()=>{const i=document.querySelector('#wk_eqs').previousElementSibling;return i&&i.classList.contains('eqmq')});if(!box){bad.push(tag+'探す欄が無い');await c.close();continue}
 const vis=()=>p.evaluate(()=>[...document.querySelectorAll('#wk_eqs label.chkl')].filter(l=>l.style.display!=='none').map(l=>l.textContent.trim()));
 const typ=async v=>{const t=Date.now();await p.evaluate(v=>{const i=document.querySelector('#wk_eqs').previousElementSibling;i.value=v;i.dispatchEvent(new Event('input'))},v);return Date.now()-t};
 let tq=await typ('設備1234');let v=await vis();if(v.length!==1||!/設備1234/.test(v[0]))bad.push(tag+'名前で探す '+v.length+'件 '+v.slice(0,3).join('|'));if(tq>1000)bad.push(tag+'探すのに '+tq+'ms');
 await p.evaluate(()=>{const l=[...document.querySelectorAll('#wk_eqs label.chkl')].find(l=>l.style.display!=='none');l.querySelector('input').click()});
 tq=await typ('ｃ棟');v=await vis();const want=await p.evaluate(()=>S.equipment.filter(e=>/^C棟/.test(locPath(e.locId))).length);
 if(v.length!==want+(v.some(x=>/設備1234$/.test(x))&&!/^C棟/.test(await p.evaluate(()=>locPath(S.equipment[1234].locId)))?1:0))bad.push(tag+'場所（棟・全角半角）で探す '+v.length+'（C棟 '+want+'）');
 if(!v.some(x=>/設備1234$/.test(x)))bad.push(tag+'選んだ設備が絞ると隠れる');
 await typ('');v=await vis();if(v.length!==2000)bad.push(tag+'空にすると全部に戻らない '+v.length);
 await p.fill('#wk_title','探す欄の確かめ').catch(()=>bad.push(tag+'件名の欄が無い'));
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push(tag+'はみ出す');
 const sw=await p.evaluate(()=>{const i=document.querySelector('#wk_eqs').previousElementSibling.getBoundingClientRect();return i.right<=390&&i.height>=40});if(!sw)bad.push(tag+'探す欄の大きさ・位置');
 s=Date.now();await p.evaluate(()=>saveWork(''));await p.waitForTimeout(200);const tSave=Date.now()-s-200;if(tSave>1000)bad.push(tag+'保存 '+tSave+'ms');
 const w=await p.evaluate(()=>{const w=(S.works||[]).find(x=>x.title==='探す欄の確かめ');return w?w.equipIds:null});if(!w||w.length!==1||w[0]!=='e1234')bad.push(tag+'保存した設備 '+JSON.stringify(w));
 // 20 台以下では探す欄を出さない
 await p.evaluate(()=>{S.equipment=S.equipment.slice(0,20);closeModal(true);editWork()});await p.waitForSelector('#wk_eqs');if(await p.evaluate(()=>!!document.querySelector('#modal .eqmq')))bad.push(tag+'20 台でも探す欄');
 console.log(tag+'窓 '+tOpen+'ms・保存 '+tSave+'ms');await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
