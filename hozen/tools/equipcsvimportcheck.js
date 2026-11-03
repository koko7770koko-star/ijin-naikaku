// 設備台帳CSVの読み戻しの確認：書き出したCSVをそのまま読み戻して件数が変わらない（修理履歴も重複しない）・
// BOMあり／なし・壊れた行（列不足・名称なし）は飛ばして理由を出す・新規は新しいID・上書きは書いてある項目だけ・元に戻せる・
// 古い形の設備（kind/spec/repairs 無し）でも読める・390px ではみ出さない。保存の形は変えない。
// usage: node hozen/tools/equipcsvimportcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 // 古い形の設備を含む台帳
 await p.evaluate(()=>{S.equipment=[
  {id:'e0',code:'E-001',name:'分電盤',place:'○○棟 1F',maker:'甲',model:'M1',serial:'S1',installed:'2015-04',cycle:'年1回',note:'備考,"引用符"\n改行',kind:'配電盤・分電盤',status:'稼働',importance:'B',spec:{'定格電圧':'200V'},life:20,photos:[],docs:[],repairs:[{id:'r1',date:'2026-01-05',kind:'修理',content:'端子の増し締め',vendor:'○○電気',cost:12000,photos:[]}],health:[{x:1}]},
  {id:'e1',code:'E-002',name:'古い形の設備',place:'',maker:'',model:'',serial:'',installed:'',cycle:'',note:'',photos:[],docs:[]}];save();go('equip')});
 await p.evaluate(()=>{V.eqFo=true;render()});
 await p.waitForTimeout(300);
 const sw=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,btn:[...document.querySelectorAll('#app label.btn')].filter(x=>x.textContent.includes('CSVを読み込む')).map(x=>{const r=x.getBoundingClientRect();return {w:r.width,h:r.height,r:r.right}})}));
 if(sw.btn.length!==1)bad.push('読み込みボタンが '+sw.btn.length);else if(sw.btn[0].h<40||sw.btn[0].r>390)bad.push('読み込みボタンの大きさ/位置 '+JSON.stringify(sw.btn[0]));if(sw.sw>392)bad.push('台帳が横にはみ出す '+sw.sw);
 // 書き出したCSV文字列をそのまま計画に通す
 const csv=await p.evaluate(()=>{let t='';const orig=download;window.download=async(n,b)=>{t=await b.text();return true};try{download=window.download}catch(e){}exportEquipCsv();return new Promise(r=>setTimeout(()=>r(t),300))});
 if(!csv)bad.push('書き出しが空');
 const r1=await p.evaluate(t=>{const P=planEquipCsv(t);return {e:P.eqs.length,r:P.reps.length,s:P.skip.length,up:P.eqs.filter(x=>x.ex).length,note:P.eqs[0].o.note}},csv||'');
 if(r1.e!==2||r1.r!==1||r1.s!==0||r1.up!==2)bad.push('読み戻しの計画 '+JSON.stringify(r1));if(r1.note!=='備考,"引用符"\n改行')bad.push('引用符・改行を戻せない '+JSON.stringify(r1.note));
 // BOM付きでも同じ
 const r2=await p.evaluate(t=>{const P=planEquipCsv(t.replace(/^﻿/,''));return P.eqs.length+'/'+P.reps.length},csv||'');if(r2!=='2/1')bad.push('BOM付き '+r2);
 // 実際に読み込む（UI経由）：件数が変わらず履歴も増えない
 await p.evaluate(t=>{const P=planEquipCsv(t);PENDING_EQCSV=P;return applyEquipCsv()},csv||'');await p.waitForTimeout(500);
 const a=await p.evaluate(()=>({n:S.equipment.length,rep:S.equipment[0].repairs.length,h:(S.equipment[0].health||[]).length,id:S.equipment[0].id,ls:JSON.parse(localStorage.getItem('hospElecSched_v1')).equipment.length}));
 if(a.n!==2||a.rep!==1||a.h!==1||a.id!=='e0'||a.ls!==2)bad.push('読み戻し後 '+JSON.stringify(a));
 // 壊れた行・新規・上書き
 const t2='区分,設備ID,設備名称,設置場所,メーカー,型式,製造番号,設置年月,点検周期,日付,種類,内容,業者・対応者,費用,備考,階層,種別,重要度,状態,耐用年数,更新予定,更新費用,仕様\r\n'+
  '設備,E-001,分電盤,別の場所,,,,,,,,,,,,,,,,,,,\r\n設備,E-100,新しい設備,A棟,,,,2020-13,,,,,,,,,,,,,,,\r\n設備,E-101,新しい設備,A棟,,,,2020-05,,,,,,,,,,,,,,,\r\n設備,E-102,,B棟\r\n履歴,E-101,新しい設備,,,,,,,2026-02-03,故障,停電,,,,,,,,,,,\r\n履歴,E-999,無い設備,,,,,,,2026-02-03,故障,x,,,,,,,,,,,\r\n履歴,E-001,分電盤,,,,,,,2026-01-05,修理,端子の増し締め,,,,,,,,,,,\r\n';
 const r3=await p.evaluate(t=>{const P=planEquipCsv(t);return {e:P.eqs.length,r:P.reps.length,s:P.skip}},t2);
 if(r3.e!==2||r3.r!==3||r3.s.length!==2)bad.push('壊れた行の扱い '+JSON.stringify(r3));
 await p.evaluate(t=>{PENDING_EQCSV=planEquipCsv(t);return applyEquipCsv()},t2);await p.waitForTimeout(500);
 const d=await p.evaluate(()=>({n:S.equipment.length,e0:S.equipment[0],nw:S.equipment.find(x=>x.code==='E-101')}));
 if(d.n!==3)bad.push('新規1台で3台になるはず '+d.n);if(d.e0.place!=='別の場所'||d.e0.maker!=='甲'||d.e0.repairs.length!==1)bad.push('上書きが項目だけでない '+JSON.stringify([d.e0.place,d.e0.maker,d.e0.repairs.length]));
 if(!d.nw||!d.nw.id||d.nw.repairs.length!==1)bad.push('新規の設備と履歴');
 // 元に戻す
 await p.evaluate(()=>{document.querySelector('#undobar button').click()});await p.waitForTimeout(200);
 const u=await p.evaluate(()=>S.equipment.length);if(u!==2)bad.push('元に戻しても '+u);
 // 階層が見つからない設備は件数を知らせる（新規は場所を空のまま・既存の場所は消さない）
 const tl='区分,設備ID,設備名称,設置場所,メーカー,型式,製造番号,設置年月,点検周期,日付,種類,内容,業者・対応者,費用,備考,階層\r\n設備,E-300,場所不明の設備,A棟,,,,,,,,,,,,存在しない棟 › 3階\r\n';
 const nl=await p.evaluate(t=>{const P=planEquipCsv(t);return {noLoc:P.noLoc,loc:P.eqs[0].o.locId||''}},tl);
 if(nl.noLoc!==1||nl.loc!=='')bad.push('階層なしの数え方 '+JSON.stringify(nl));
 // 画面（確認の窓）の幅
 await p.evaluate(t=>{const P=planEquipCsv(t);PENDING_EQCSV=P;openModal('<h3>x</h3>')},t2);
 // ファイルを選ぶ経路（確認の窓が出る・件数が見える）
 await p.setInputFiles('#app input[type=file][accept*=csv]',{name:'e.csv',mimeType:'text/csv',buffer:Buffer.from(t2,'utf-8')});await p.waitForTimeout(500);
 const m=await p.evaluate(()=>({t:$('#modal').textContent,sw:document.documentElement.scrollWidth,mw:$('#modal').getBoundingClientRect().width}));
 if(!m.t.includes('新規 1件')||!m.t.includes('読み飛ばす行：2件'))bad.push('確認の窓 '+m.t.slice(0,160));if(m.sw>392||m.mw>390)bad.push('窓がはみ出す '+JSON.stringify(m));
 await p.evaluate(()=>closeModal(true));
 await p.setInputFiles('#app input[type=file][accept*=csv]',{name:'l.csv',mimeType:'text/csv',buffer:Buffer.from(tl,'utf-8')});await p.waitForTimeout(400);
 if(!(await p.evaluate(()=>$('#modal').textContent)).includes('見つからない設備が 1件'))bad.push('窓に階層の案内が出ない');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 // 違うCSVは理由を出して止まる
 await p.evaluate(()=>closeModal(true));
 await p.setInputFiles('#app input[type=file][accept*=csv]',{name:'x.csv',mimeType:'text/csv',buffer:Buffer.from('a,b\r\n1,2\r\n')});await p.waitForTimeout(400);
 const x=await p.evaluate(()=>$('#modal').textContent);if(!x.includes('設備台帳のCSVではありません'))bad.push('別のCSVの案内 '+x.slice(0,80));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
