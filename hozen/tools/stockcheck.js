// 在庫画面の確認：予備品を入れて 390px で開き、在庫不足の物が上に出る・−/＋ が44px以上で1タップで数が変わり
// 入出庫履歴に残る・読み直しても残る・押しても編集画面が開かない・横にはみ出さない・エラーなしを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=(id,name,qty,min)=>({id,code:'',name,spec:'',maker:'',place:'',unit:'個',qty,min,price:'',equipIds:[],note:''});
  S.parts=[mk('p1','ヒューズ 10A',8,2),mk('p2','電球 LED 40形 長い名前の予備品の例として入れる',1,2),mk('p3','端子 R2-4',5,'')];save();go('stock',{stTab:'parts'})});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')].filter(x=>x.querySelector('.pqb'));const bs=[...document.querySelectorAll('.pqb button')];
  return {first:it[0]&&it[0].textContent,n:it.length,minH:Math.min(...bs.map(x=>x.getBoundingClientRect().height)),minW:Math.min(...bs.map(x=>x.getBoundingClientRect().width)),sw:document.documentElement.scrollWidth}});
 if(r.n!==3)bad.push('予備品の行が3つでない '+r.n);if(!/電球/.test(r.first||''))bad.push('在庫不足が上に来ない');if(r.minH<44||r.minW<44)bad.push('−/＋が小さい '+r.minH+'x'+r.minW);if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // ヒューズの − を2回、端子の ＋ を1回
 const tap=async(name,sign)=>{await p.evaluate(([name,sign])=>{const it=[...document.querySelectorAll('#app .item')].find(x=>x.querySelector('.pqb')&&x.textContent.includes(name));it.querySelector(`.pqb button[aria-label="${sign}"]`).click()},[name,sign]);await p.waitForTimeout(150)};
 await tap('ヒューズ','1つ出庫');await tap('ヒューズ','1つ出庫');await tap('端子','1つ入庫');
 if(await p.evaluate(()=>!!document.querySelector('#pt_name')))bad.push('−/＋で編集画面が開いた');
 const s=await p.evaluate(()=>({f:partById('p1').qty,t:partById('p3').qty,mv:S.moves.filter(m=>['p1','p3'].includes(m.partId)).map(m=>m.type+m.qty+'>'+m.after).join(',')}));
 if(s.f!==6||s.t!==6)bad.push('数が合わない '+JSON.stringify(s));if(s.mv!=='出庫1>7,出庫1>6,入庫1>6')bad.push('入出庫履歴が違う '+s.mv);
 await p.reload();await p.waitForTimeout(1500);
 const s2=await p.evaluate(()=>({f:partById('p1').qty,n:S.moves.length}));if(s2.f!==6||s2.n<3)bad.push('読み直しで消えた '+JSON.stringify(s2));
 // 在庫 0 で − は記録しない
 await p.evaluate(()=>{partById('p2').qty=0;save();go('stock',{stTab:'parts'})});await p.waitForTimeout(300);const n0=await p.evaluate(()=>S.moves.length);
 await tap('電球','1つ出庫');if(await p.evaluate(()=>[partById('p2').qty,S.moves.length].join()) !== '0,'+n0)bad.push('0 から出庫できてしまう');
 // 窓での出庫・貸出・校正：prompt が出ない・数字キーボード・日付は type=date・保存の形が同じ
 let pr=0;p.removeAllListeners('dialog');p.on('dialog',d=>{pr++;d.dismiss().catch(()=>{})});
 await p.evaluate(()=>{go('stock',{stTab:'parts'});stockMove('p1','出庫')});await p.waitForTimeout(300);
 const m1=await p.evaluate(()=>({t:document.querySelector('#sm_n')&&document.querySelector('#sm_n').type,im:document.querySelector('#sm_n')&&document.querySelector('#sm_n').inputMode}));
 if(m1.t!=='number'||m1.im!=='decimal')bad.push('出庫の数が数字キーボードにならない '+JSON.stringify(m1));
 await p.fill('#sm_n','99');if(!(await p.evaluate(()=>document.querySelector('#sm_w').innerText)).includes('多い出庫'))bad.push('在庫より多い出庫の案内が出ない');
 await p.fill('#sm_n','2');await p.fill('#sm_note','確認用');await p.click('text=出庫を記録');await p.waitForTimeout(300);
 const mv=await p.evaluate(()=>{const m=S.moves.filter(x=>x.partId==='p1').pop();return {k:Object.keys(m).sort().join(),q:m.qty,a:m.after,t:m.type,n:m.note}});
 if(mv.k!=='after,by,date,id,note,partId,qty,ref,type'||mv.q!==2||mv.t!=='出庫'||mv.n!=='確認用')bad.push('出庫の記録の形・値が違う '+JSON.stringify(mv));
 await p.evaluate(()=>{S.tools=[{id:'tx1',code:'',name:'確認用測定器',kind:'測定器',maker:'',model:'',serial:'',place:'',calDue:'',calCycleM:'12',calHist:[],loans:[],note:''}];save();go('stock',{stTab:'tools'});editTool('tx1');toolLoan('tx1')});await p.waitForTimeout(300);
 const m2=await p.evaluate(()=>({d:document.querySelector('#tn_due')&&document.querySelector('#tn_due').type}));if(m2.d!=='date')bad.push('返却予定日が日付の入力でない');
 await p.fill('#tn_to','確認');await p.fill('#tn_due','2030-01-31');await p.click('text=貸出を記録');await p.waitForTimeout(300);
 const ln=await p.evaluate(()=>{const l=S.tools[0].loans[0];return l?Object.keys(l).sort().join()+':'+l.to+':'+l.due:''});if(ln!=='back,due,id,note,out,to:確認:2030-01-31')bad.push('貸出の記録が違う '+ln);
 await p.evaluate(()=>{toolCal('tx1')});await p.waitForTimeout(300);
 const nx=await p.evaluate(()=>document.querySelector('#tc_next')&&document.querySelector('#tc_next').value);if(!/^\d{4}-\d\d-\d\d$/.test(nx||''))bad.push('次回の校正期限の既定（周期から）が出ない '+nx);
 await p.fill('#tc_by','確認機関');await p.click('text=校正を記録 >> nth=-1');await p.waitForTimeout(300);
 const cl=await p.evaluate(()=>{const c=S.tools[0].calHist[0];return c?Object.keys(c).sort().join()+':'+c.by:''});if(cl!=='by,date,next,result:確認機関')bad.push('校正の記録が違う '+cl);
 if(pr)bad.push('prompt/confirm が出た '+pr);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
