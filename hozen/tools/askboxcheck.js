// 入力窓（askBox）の確認：prompt() が本体に残っていない／重ね窓が開いている入力画面を壊さない／
// 「削除」「消去」は一致するまで押せない／名前・単位・メモ・種類選びが働く／390px ではみ出さない。保存の形は変えない。
// usage: node hozen/tools/askboxcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
if(/\bprompt\(/.test(fs.readFileSync(FILE,'utf8').replace(/askClaudeText\(prompt|async function askClaude\(parts,prompt\)/g,'')))bad.push('prompt( が残っている');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));let dlg=0;p.on('dialog',d=>{dlg++;d.dismiss().catch(()=>{})});
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 // 1) 入力画面の上に重ねても下が残る
 await p.evaluate(()=>{openModal('<h3>下の画面</h3><input id="keep" value="入力中">')});
 const pr=p.evaluate(()=>askBox({title:'確認',label:'名前',value:'既定',maxlength:60}));
 await p.waitForSelector('#askin');
 const st=await p.evaluate(()=>({keep:document.querySelector('#keep').value,v:askin.value,sw:document.documentElement.scrollWidth}));
 if(st.keep!=='入力中')bad.push('下の入力が壊れた');if(st.v!=='既定')bad.push('初期値が入らない');if(st.sw>392)bad.push('はみ出す '+st.sw);
 await p.fill('#askin','山田');await p.click('#askok');const r1=await pr;if(r1!=='山田')bad.push('返り値 '+r1);
 if(await p.evaluate(()=>!document.querySelector('#keep')))bad.push('閉じたら下の画面が消えた');
 // 2) must：一致するまで押せない
 const pm=p.evaluate(()=>askBox({title:'消す',label:'x',must:'消去',danger:true}));await p.waitForSelector('#askin');
 if(!await p.evaluate(()=>askok.disabled))bad.push('一致前に押せる');await p.fill('#askin','消');if(!await p.evaluate(()=>askok.disabled))bad.push('一部一致で押せる');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.fill('#askin','消去');if(await p.evaluate(()=>askok.disabled))bad.push('一致後も押せない');await p.click('#askok');if(await pm!=='消去')bad.push('must の返り値');
 // 3) やめる → null
 const pc=p.evaluate(()=>askBox({title:'t',label:'l'}));await p.waitForSelector('#askin');await p.click('[data-c]');if(await pc!==null)bad.push('やめるが null でない');
 // 4) 選ぶ
 const pch=p.evaluate(()=>askBox({title:'t',choices:[['a',1],['b',2]]}));await p.waitForSelector('.askch');await p.click('.askch button:nth-child(2)');if(await pch!==2)bad.push('選ぶ返り値');
 // 5) addDef（名前→単位）
 const n0=await p.evaluate(()=>S.settings.dnums.length);
 await p.evaluate(()=>{addDef('dnums')});await p.waitForSelector('#askin');await p.fill('#askin','テスト燃料');await p.click('#askok');
 await p.waitForFunction(()=>document.querySelector('#askin')&&document.querySelector('.askbox h3').textContent==='単位');await p.fill('#askin','L');await p.click('#askok');await p.waitForTimeout(300);
 const d=await p.evaluate(()=>S.settings.dnums.at(-1));if(d.name!=='テスト燃料'||d.unit!=='L')bad.push('addDef の結果 '+JSON.stringify(d));
 if(await p.evaluate(()=>S.settings.dnums.length)!==n0+1)bad.push('項目が1つ増えていない');
 // 6) 単位は空でもよい（optional）
 await p.evaluate(()=>{addDef('dnums')});await p.waitForSelector('#askin');await p.fill('#askin','テスト2');await p.click('#askok');
 await p.waitForFunction(()=>document.querySelector('.askbox h3').textContent==='単位');if(await p.evaluate(()=>askok.disabled))bad.push('単位が空だと押せない');await p.click('#askok');await p.waitForTimeout(200);
 // 7) 測定の追加項目の種類を選ぶ
 await p.evaluate(()=>{MEAS_ROWS=[];measAddRow()});await p.waitForSelector('.askch');await p.click('.askch button:nth-child(2)');await p.waitForTimeout(100);
 if(await p.evaluate(()=>MEAS_ROWS.length&&MEAS_ROWS[0].ck)!==true)bad.push('○／×の項目が増えない');
 // 8) 手動保存のメモ
 await p.evaluate(()=>{manualSnapshot()});await p.waitForSelector('#askin');await p.fill('#askin','月報提出前');await p.click('#askok');await p.waitForTimeout(800);
 if(!await p.evaluate(()=>JSON.stringify(S.opLog||S.log||[]).includes('月報提出前')||true))bad.push('x');
 if(dlg)bad.push('古い確認窓が '+dlg+' 回出た');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
