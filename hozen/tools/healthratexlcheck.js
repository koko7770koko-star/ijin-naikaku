// 健全度の評価の窓：文字「大」「特大」・360px で、①評価の選び・評価日・評価者・所見の入力が窓の外へはみ出さない②入力・ボタンが 44px 以上③設備の名前が切れない④下のボタンが画面内 を確かめる。
// usage: node hozen/tools/healthratexlcheck.js [--shot 先頭名]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--shot'));
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:740}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;S.equipment.push({id:'eh1',code:'HV-TR-2026-001',name:'高圧受電設備 変圧器 第1号（油入自冷式 三相 500kVA）',place:'',repairs:[],health:[]});save();applyFScale();rateHealth('eh1')},fs);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const out=[],small=[];const m=document.querySelector('#modal');if(!m)return{out:['窓が無い'],small};const mr=m.getBoundingClientRect();
  m.querySelectorAll('select,input,textarea,.btn').forEach(x=>{const q=x.getBoundingClientRect();if(!q.width)return;if(q.right>mr.right+1||q.left<mr.left-1)out.push('窓の外へ：'+(x.id||x.textContent.trim().slice(0,8)));if(x.tagName!=='TEXTAREA'&&q.height<43.5)small.push((x.id||x.textContent.trim().slice(0,8))+' '+Math.round(q.height))});
  const s=m.querySelector('#hr_score');if(s){const o=s.options[s.selectedIndex].text;const sp=document.createElement('span');const cs=getComputedStyle(s);sp.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+cs.font;sp.textContent=o;document.body.appendChild(sp);const tw=sp.getBoundingClientRect().width,bw=s.getBoundingClientRect().width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-24;sp.remove();s.dataset.t=Math.round(tw)+'/'+Math.round(bw);if(tw>bw+1)out.push('評価の選びの文字が切れる '+s.dataset.t)}
  const h=m.querySelector('.muted');if(h&&h.scrollWidth>h.clientWidth+1)out.push('設備の名前が切れる');
  const ok=[...m.querySelectorAll('.btn')].find(e=>/記録/.test(e.textContent)),q=ok&&ok.getBoundingClientRect();
  return{out:[...new Set(out)],small:[...new Set(small)],vis:!!q&&q.bottom<=innerHeight+1&&q.top>=0,sw:document.documentElement.scrollWidth}});
 const tag=w+'px・'+(fs==='xl'?'特大':'大');
 r.out.forEach(x=>errs.push(tag+'：'+x));
 if(r.small.length)errs.push(tag+'：44px 未満 '+r.small.join(' | '));
 if(r.vis===false)errs.push(tag+'：記録ボタンが画面内に見えない');
 if(r.sw>w+1)errs.push(tag+'：横にはみ出す '+r.sw);
 if(shot)await p.screenshot({path:shot+'-'+w+fs+'.png'});
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
