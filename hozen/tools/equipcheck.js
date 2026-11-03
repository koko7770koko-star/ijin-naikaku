// 設備台帳の確認：設備を200台入れて 390px で開き、検索が打つだけで絞り込まれる・件数が出る・
// 並び順を変えられる・絞り込みをやめられる・はみ出さない・保存の項目が変わらないことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{const keys=Object.keys((S.equipment||[])[0]||{});for(let i=0;i<200;i++)S.equipment.push({id:'qq'+i,code:'EQ-'+String(i).padStart(3,'0'),name:(i%2?'変圧器':'受電盤')+i,place:'○○棟',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[],status:'稼働',kind:'',importance:'',locId:''});go('equip')});
 await p.waitForTimeout(500);
 const n0=await p.evaluate(()=>document.querySelectorAll('#app .item').length);
 await p.click('#eqQ');await p.keyboard.type('変圧器1');await p.waitForTimeout(900);
 const r=await p.evaluate(()=>({n:document.querySelectorAll('#app .item').length,foc:document.activeElement&&document.activeElement.id,txt:document.body.innerText.includes('絞り込み：'),val:document.querySelector('#eqQ').value}));
 if(!(r.n>0&&r.n<n0))bad.push('打つだけで絞り込まれない '+n0+'→'+r.n);if(r.foc!=='eqQ')bad.push('絞り込み後に検索欄からカーソルが外れる');if(!r.txt)bad.push('件数が出ない');if(r.val!=='変圧器1')bad.push('入力が消えた '+r.val);
 await p.selectOption('select[aria-label="並び順"]','name');await p.waitForTimeout(300);
 const first=await p.evaluate(()=>{const t=document.querySelector('#app .item .ti');return t?t.textContent:document.querySelector('#app').innerText.slice(0,300)});if(!first.includes('受電盤')&&!first.includes('変圧器'))bad.push('並び替えで表示が壊れた');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.click('text=絞り込みをやめる');await p.waitForTimeout(300);
 const n1=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(n1<n0)bad.push('絞り込みをやめても戻らない');
 const cut=await p.evaluate(()=>[...document.querySelectorAll('.eqf select')].filter(x=>{const t=x.options[x.selectedIndex].text;const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(x).font;return c.measureText(t).width>x.clientWidth-28}).length);if(cut)bad.push('選んだ値の文字が切れる '+cut);
 const lab=await p.evaluate(()=>[...document.querySelectorAll('.eqf label')].map(x=>x.firstElementChild.textContent).join());if(lab!=='場所,種別,重要度')bad.push('見出しが無い '+lab);
 // 稼働時間計：prompt ではなく小さい窓。前回より小さい値は赤く出る・保存できる・形は {date,value,by}
 let pr=0;p.removeAllListeners('dialog');p.on('dialog',d=>{pr++;d.dismiss().catch(()=>{})});
 await p.evaluate(()=>{S.equipment[0].run={meters:[{date:'2026-01-05',value:100,by:''}]};addMeter(S.equipment[0].id)});await p.waitForTimeout(300);
 const mm=await p.evaluate(()=>({v:!!document.querySelector('#mt_v'),t:document.querySelector('#mt_v')&&document.querySelector('#mt_v').type,im:document.querySelector('#mt_v')&&document.querySelector('#mt_v').inputMode,d:document.querySelector('#mt_d')&&document.querySelector('#mt_d').value===TODAY}));
 if(!mm.v)bad.push('稼働時間計の窓が出ない');else{if(mm.t!=='number'||mm.im!=='decimal')bad.push('読み値が数字キーボードにならない');if(!mm.d)bad.push('読んだ日の既定が今日でない');
  await p.fill('#mt_v','50');const wn=await p.evaluate(()=>document.querySelector('#mt_w').innerText);if(!wn.includes('前回より小さい'))bad.push('小さい値の赤い案内が出ない');
  await p.fill('#mt_v','');await p.click('text=記録する');await p.waitForTimeout(200);if(!await p.evaluate(()=>!!document.querySelector('#mt_v')))bad.push('空のまま保存できてしまう');
  await p.fill('#mt_v','50');await p.click('text=記録する');await p.waitForTimeout(300);
  const ms=await p.evaluate(()=>S.equipment[0].run.meters.map(m=>Object.keys(m).sort().join()+':'+m.value));if(ms.length!==2||ms[1]!=='by,date,value:50')bad.push('保存の形が違う '+ms);}
 if(pr)bad.push('prompt/confirm が出た '+pr);
 // 設備カルテ(概要)：名前・型式が長くても、カードのボタン(QRコード・測定記録・作業指示)の文字が2行に折れない・はみ出さない
 await p.evaluate(()=>{S.equipment.push({id:'zzL',code:'EQ-LONG-0001-ABCDEFGHIJKLMNOP',name:'非常用発電機設備ディーゼル機関付き高圧受電盤第一系統',place:'A棟地下1階第一電気室の南側奥',maker:'',model:'MODEL-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[],repairs:[],health:[],status:'稼働',kind:'',importance:'A',locId:''});go('equipDetail',{eq:'zzL',eqTab:'ov'})});await p.waitForTimeout(400);
 const wr=await p.evaluate(()=>[...document.querySelectorAll('#app .row .btn.grow')].filter(x=>x.getBoundingClientRect().height>46).map(x=>x.textContent.trim()));if(wr.length)bad.push('カルテのボタンの文字が折れる '+wr);
 await p.evaluate(()=>go('equip'));await p.waitForTimeout(300);
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 for(const k of ['due','issue']){await p.selectOption('select[aria-label="並び順"]',k);await p.waitForTimeout(300)}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
