// CSV の文字コードの確認：Excel で保存した Shift_JIS の CSV（BOM 無し）・UTF-8（BOM あり／なし）のどれでも、設備台帳の読み込みで文字化けせず
// 「分電盤」「○○棟 1階」が読める。画面の「CSVを読み込む」から実際にファイルを渡して確かめる。保存の形は変えない。外への通信は足さない。
// usage: node hozen/tools/csvsjischeck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const SJIS_HEX='8be695aa2c90dd94f549442c90dd94f596bc8fcc2c90dd92758fea8f8a2c8381815b834a815b2c8c5e8eae2c90bb91a294d48d862c90dd9275944e8c8e2c935f8c9f8efc8afa2c93fa95742c8eed97de2c93e097652c8bc68ed2814591ce899e8ed22c94ef97702c94f58d6c2c8a4b91772c8eed95ca2c8f64977693782c8ff391d42c91cf9770944e90942c8d589056975c92e82c8d58905694ef97702c8e64976c0d0a90dd94f52c452d3930312c95aa936494d52c819b819b938f20318a4b2c2c2c2c323032302d30352c2c2c2c2c2c2c2c2c2c2c2c2c2c2c0d0a';
const sjis=Buffer.from(SJIS_HEX,'hex');
const utf='区分,設備ID,設備名称,設置場所,メーカー,型式,製造番号,設置年月,点検周期,日付,種類,内容,業者・対応者,費用,備考,階層,種別,重要度,状態,耐用年数,更新予定,更新費用,仕様\r\n設備,E-901,分電盤,○○棟 1階,,,,2020-05,,,,,,,,,,,,,,,\r\n';
const cases=[['Shift_JIS（BOM無し）',sjis],['UTF-8（BOM無し）',Buffer.from(utf,'utf8')],['UTF-8（BOMあり）',Buffer.concat([Buffer.from([0xEF,0xBB,0xBF]),Buffer.from(utf,'utf8')])]];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 for(const [nm,buf] of cases){
  await p.evaluate(()=>{S.equipment=[];save();go('equip');V.eqFo=true;render();PENDING_EQCSV=null});await p.waitForTimeout(300);
  const inp=p.locator('#app label.btn:has-text("CSVを読み込む") input[type=file]');
  await inp.setInputFiles({name:'eq.csv',mimeType:'text/csv',buffer:buf});await p.waitForTimeout(500);
  const r=await p.evaluate(()=>PENDING_EQCSV?{n:PENDING_EQCSV.eqs.length,name:PENDING_EQCSV.eqs[0]&&PENDING_EQCSV.eqs[0].o.name,place:PENDING_EQCSV.eqs[0]&&PENDING_EQCSV.eqs[0].o.place}:null);
  if(!r)bad.push(nm+'：読み込みの確認画面が出ない');else if(r.n!==1||r.name!=='分電盤'||r.place!=='○○棟 1階')bad.push(nm+'：文字が合わない '+JSON.stringify(r));
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
