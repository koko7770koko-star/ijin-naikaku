// 復元テストの結果の窓：文字「大」「特大」・360px で、①閉じるボタンが 44px 以上②判定・件数の文字が漢字・かなの間で割れない③窓の外・画面の外へはみ出さない④閉じるが画面内に見える を確かめる。
// usage: node hozen/tools/restoretestxlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:740}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(async f=>{S.settings.fscale=f;
  for(let i=1;i<=6;i++)S.equipment.push({id:'er'+i,code:'HV-'+i,name:'高圧受電設備 変圧器 第'+i+'号（油入自冷式）',place:'',repairs:[]});
  save();applyFScale();
  const r=await buildBackup();const blob=r.blob||new Blob([r.text||JSON.stringify(r.data||r)],{type:'application/json'});
  const file=new File([blob],'電気設備スケジュール_2026-11-06_とても長いファイル名のバックアップ.json',{type:'application/json'});
  await restoreTest({files:[file],value:''})},fs);await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const CJK=/[぀-ヺー-ヿ一-鿿]/;const out=[],small=[];const m=document.querySelector('#modal');if(!m)return{out:['窓が無い'],small,vis:false};
  m.querySelectorAll('.btn').forEach(x=>{const q=x.getBoundingClientRect();if(q.width&&q.height<43.5)small.push(x.textContent.trim().slice(0,8)+' '+Math.round(q.height))});
  m.querySelectorAll('.item .ti,.item .meta,.al,.grp b').forEach(x=>{const q=x.getBoundingClientRect();if(q.width&&(q.right>innerWidth+1||q.left<-1))out.push('画面の外へ：'+x.textContent.trim().slice(0,12))});
  m.querySelectorAll('.item .ti,.al').forEach(x=>{const tw=document.createTreeWalker(x,NodeFilter.SHOW_TEXT);let t;while(t=tw.nextNode()){const s=t.textContent;let prev=null,pt=null;for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);if(!q)continue;if(pt!==null&&Math.abs(q.top-pt)>3&&prev==='✓')out.push('✓ のあとで割れる');prev=s[i];pt=q.top}}});
  const cl=[...m.querySelectorAll('.btn')].find(e=>/閉じる/.test(e.textContent));const q=cl&&cl.getBoundingClientRect();
  return{out:[...new Set(out)],small:[...new Set(small)],vis:!!q&&q.bottom<=innerHeight+1&&q.top>=0&&q.right<=innerWidth+1,items:m.querySelectorAll('.item').length,sw:document.documentElement.scrollWidth}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 if(!r.items)errs.push(tag+'：結果の行が無い '+JSON.stringify(r.out));
 r.out.forEach(x=>errs.push(tag+'：'+x));
 if(r.small.length)errs.push(tag+'：44px 未満 '+r.small.join(' | '));
 if(!r.vis)errs.push(tag+'：閉じるが画面内に見えない');
 if(r.sw>w+1)errs.push(tag+'：横にはみ出す '+r.sw);
 if(shot)await p.screenshot({path:shot+'-'+w+fs+'.png'});
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
