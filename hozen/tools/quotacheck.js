// 保存できないとき（容量いっぱい・プライベートモード）：localStorage.setItem が QuotaExceededError を投げる状態で日常点検を保存し、
// (1) 画面上部に大きい赤い帯が出る (2) 帯に「ファイルに保存」の入口があり 44px 以上 (3) 古い記録（保存済みの原本）が消えない
// (4) 保存できるようになったら帯が消える (5) エラーを出さない・横にはみ出さない、を確かめる。保存の形は変えない。
// usage: node hozen/tools/quotacheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 // 保存済みの原本を作る
 await p.evaluate(()=>{S.notes=S.notes||{};S.notes['__q']='原本';save()});await p.waitForTimeout(300);
 const before=await p.evaluate(()=>localStorage.getItem('hospElecSched_v1'));
 // 以後の書き込みを失敗させる
 await p.evaluate(()=>{window.__fail=1;const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__fail&&/^hospElecSched_v1|^kinmuhyo_v1/.test(k)){const e=new Error('quota');e.name='QuotaExceededError';throw e}return o.apply(this,arguments)};go('day',{day:TODAY});quickOK()});
 await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const s=document.getElementById('sysbar');const bt=s&&s.querySelector('button');const sr=s&&s.getBoundingClientRect();
  return {show:!!s&&getComputedStyle(s).display!=='none',txt:s?s.innerText:'',btn:!!bt,bh:bt?bt.getBoundingClientRect().height:0,fs:s?parseFloat(getComputedStyle(s).fontSize):0,top:sr?sr.top:99,sw:document.documentElement.scrollWidth}});
 if(!r.show)bad.push('保存に失敗しても赤い帯が出ない');if(!/保存できていません/.test(r.txt))bad.push('帯の言葉 '+r.txt);
 if(!r.btn)bad.push('ファイルに保存する入口が無い');else if(r.bh<44)bad.push('入口のボタンが小さい '+r.bh);
 if(r.fs<14)bad.push('帯の文字が小さい '+r.fs);if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 const after=await p.evaluate(()=>localStorage.getItem('hospElecSched_v1'));if(after!==before)bad.push('失敗したのに保存済みの原本が変わった');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // 入力を続けても帯が出続ける・大きい知らせ
 await p.evaluate(()=>{S.notes['__q2']='x';save()});await p.waitForTimeout(300);
 if(!await p.evaluate(()=>getComputedStyle(document.getElementById('sysbar')).display!=='none'))bad.push('入力を続けると帯が消えた');
 // 直ったら消える
 await p.evaluate(()=>{window.__fail=0;save()});await p.waitForTimeout(300);
 if(await p.evaluate(()=>getComputedStyle(document.getElementById('sysbar')).display!=='none'))bad.push('保存できるようになっても帯が消えない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
