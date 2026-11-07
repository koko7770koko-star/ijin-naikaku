// 作業管理：作業 1000 件（承認待ち 100 件）で、承認待ちの絞り込みが 1 秒以内に出て、1 件ずつ承認（窓→名前→「承認を記録」）するたびに
// 1 秒以内に一覧へ戻り、承認した物が承認待ちから消え、数（札・ホーム）が正しく減り、承認の記録の形が同じか。390px・標準・特大（hz-v-works-approve-many）。
// usage: node hozen/tools/worksapprovemanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const N=1000,NW=100,LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();editWork('')},fs);await p.waitForTimeout(300);await p.fill('#wk_title','確認用の作業');await p.evaluate(()=>saveWork(''));await p.waitForTimeout(200);
 await p.evaluate(([N,NW])=>{const base=S.works[S.works.length-1];base.pre=[];base.post=[];const ST=['完了','起案','承認済み','実施中','中止','保留'];
  S.works=[...Array(N)].map((_,i)=>({...clone(base),id:'wk'+i,no:'W-'+String(i).padStart(4,'0'),title:'試しの作業'+i+' 受変電設備の定期点検（長い件名の例）',date:addD(TODAY,(i%60)-30),status:i<NW?'承認待ち':ST[i%ST.length],hist:[],approvals:[]}));closeModal(true);save()},[N,NW]);
 await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const cnt=()=>p.evaluate(()=>({rows:[...document.querySelectorAll('#app .item')].filter(x=>/試しの作業\d+/.test(x.textContent)).length,tile:(()=>{const t=[...document.querySelectorAll('#app .wkt .tile')].find(x=>/承認待ち/.test(x.textContent));const m=t&&t.textContent.match(/(\d+)/);return m?+m[1]:-1})(),sw:document.documentElement.scrollWidth}));
 const t0=await p.evaluate(()=>{const s=performance.now();go('works',{wkF:'承認待ち'});return performance.now()-s});if(t0>LIM)bad.push(tag+'承認待ちの一覧が出るまで '+Math.round(t0)+'ms');
 let r=await cnt();if(r.tile!==NW)bad.push(tag+'承認待ちの札の数 '+r.tile+'/'+NW);if(r.rows<Math.min(NW,50))bad.push(tag+'承認待ちの行が足りない '+r.rows);if(r.sw>392)bad.push(tag+'横にはみ出す '+r.sw);
 const times=[];
 for(let k=0;k<3;k++){const id='wk'+k;
  await p.evaluate(id=>editWork(id),id);await p.waitForTimeout(250);
  await p.evaluate(id=>workAct(id,'ok'),id);await p.waitForSelector('#sg_by',{timeout:3000}).catch(()=>bad.push(tag+'承認の窓が出ない'));
  await p.fill('#sg_by','確認者');const s=Date.now();await p.click('#modal button:has-text("承認を記録")');
  await p.waitForFunction(id=>workById(id).status==='承認済み',id,{timeout:5000}).catch(()=>bad.push(tag+id+' が承認済みにならない'));times.push(Date.now()-s);
  await p.evaluate(()=>{if(document.querySelector('#mask').classList.contains('on'))closeModal(true);go('works',{wkF:'承認待ち'})});await p.waitForTimeout(150)}
 if(Math.max(...times)>LIM)bad.push(tag+'承認を記録するたび '+times.join('/')+'ms');
 r=await cnt();if(r.tile!==NW-3)bad.push(tag+'承認した後の札の数 '+r.tile+'/'+(NW-3));
 const gone=await p.evaluate(()=>![...document.querySelectorAll('#app .item')].some(x=>/試しの作業[012] /.test(x.textContent)));if(!gone)bad.push(tag+'承認した物が承認待ちに残る');
 const ap=await p.evaluate(()=>{const a=workById('wk0').approvals[0]||{};return Object.keys(a).sort().join(',')+'|'+a.by+'|'+a.act});if(ap!=='act,at,by,method,note,role|確認者|承認')bad.push(tag+'承認の記録の形が違う '+ap);
 const home=await p.evaluate(()=>{go('home');const m=document.querySelector('#app').innerText.match(/承認待ちの作業\s*(\d+)/);return m?+m[1]:-1});if(home!==NW-3)bad.push(tag+'ホームの承認待ちの数 '+home+'/'+(NW-3));
 const kept=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return o.works.filter(w=>w.status==='承認待ち').length});if(kept!==NW-3)bad.push(tag+'保存された承認待ちの数 '+kept);
 console.log(tag+'一覧 '+Math.round(t0)+'ms、承認 '+times.join('/')+'ms');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
