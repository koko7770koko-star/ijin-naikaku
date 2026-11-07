// 作業指示の一覧：400 件（未完了 50・完了 350）で、「すべて」のとき未完了が上（予定順）・完了は下にたたまれ、「さらに100件表示」で最古の完了まで辿れ、去年の作業に年が付き、1 秒以内に出るか。
// 「未完了（予定順）」は未完了だけ。390px・文字「標準」「特大」ではみ出さない。保存の形は変えない（hz-v-works-list-more）。
// usage: node hozen/tools/worksoldcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;const T=TODAY;
  S.works=[...Array(400)].map((_,i)=>{const done=i>=50;return {id:'wk'+i,title:(done?'済んだ作業の試し':'残りの作業の試し')+i,kind:'修理',date:done?addD(T,-(i-50)*3-1):addD(T,i-10),status:done?'完了':'承認済み',cost:''}});save()},fs);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify(S.works));
 const st=()=>p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')].filter(x=>/の試し\d+/.test(x.textContent));const fin=document.querySelector('#wkFin');
  return {n:it.length,open:it.filter(x=>/残りの作業/.test(x.textContent)).map(x=>+x.textContent.match(/試し(\d+)/)[1]),done:it.filter(x=>/済んだ作業/.test(x.textContent)).map(x=>+x.textContent.match(/試し(\d+)/)[1]),
   firstIsOpen:it.length?/残りの作業/.test(it[0].textContent):false,finOpen:!!fin&&fin.open,finSum:fin?fin.querySelector('summary').textContent:'',
   more:[...document.querySelectorAll('#app button')].filter(x=>/さらに100件表示/.test(x.textContent)).map(x=>x.textContent.trim())[0]||'',sw:document.documentElement.scrollWidth}});
 const ms=await p.evaluate(()=>{const t=performance.now();V.wkF='open';V.wkQ='';V.wkMore=0;go('works');return performance.now()-t});await p.waitForTimeout(250);if(ms>1000)bad.push(tag+'出るまで '+Math.round(ms)+'ms');
 let r=await st();if(r.open.length!==50||r.done.length)bad.push(tag+'未完了だけにならない '+r.open.length+'/'+r.done.length);if(r.open.some((v,i)=>i&&v<r.open[i-1]))bad.push(tag+'未完了が予定順でない');
 await p.evaluate(()=>{V.wkF='all';V.wkMore=0;render()});await p.waitForTimeout(250);r=await st();
 if(!r.firstIsOpen)bad.push(tag+'すべて：未完了が上に来ない');if(!/完了・中止 350件/.test(r.finSum))bad.push(tag+'完了のたたみ '+r.finSum);if(!/残り 300件/.test(r.more))bad.push(tag+'ボタン '+r.more);
 for(let k=0;k<3;k++){await p.evaluate(()=>{[...document.querySelectorAll('#app button')].find(x=>/さらに100件表示/.test(x.textContent)).click()});await p.waitForTimeout(250)}
 await p.evaluate(()=>{const d=document.querySelector('#wkFin');if(d)d.open=true});await p.waitForTimeout(150);r=await st();
 if(r.more)bad.push(tag+'全部出たのにボタン');if(r.done.length!==350)bad.push(tag+'完了が全部出ない '+r.done.length);if(r.done[r.done.length-1]!==399)bad.push(tag+'最後が最古でない '+r.done[r.done.length-1]);
 const yr=await p.evaluate(()=>{const it=[...document.querySelectorAll('#wkFin .item')].pop();return {yr:(it.querySelector('.dt .yr')||{textContent:''}).textContent,want:addD(TODAY,-(349*3+1)).slice(0,4)+'/'}});if(yr.yr!==yr.want)bad.push(tag+'去年の作業に年が付かない '+yr.yr);
 if(r.sw>392)bad.push(tag+'はみ出す '+r.sw);
 const after=await p.evaluate(()=>JSON.stringify(S.works));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
