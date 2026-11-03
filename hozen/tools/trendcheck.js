// 測定の傾向（trendCross）：記録が0〜3件・傾き0・管理値が空/null/文字・値が文字や NaN でも NaN・Infinity・null を 0 とした予測を出さない。
// 正しい予測（直線近似で上限/下限に達する日数）は出る。保存の形は変えない。
// usage: node hozen/tools/trendcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const R=await p.evaluate(()=>{const d=n=>addD('2026-01-01',n);const S4=[[d(0),10],[d(10),9],[d(20),8],[d(30),7]];
  const c=(s,mn,mx)=>{try{return trendCross(s,mn,mx)}catch(e){return 'ERR '+e.message}};
  return {
   zero:c([], 1, ''), one:c([[d(0),1]],1,''), three:c(S4.slice(0,3),1,''),
   flat:c([[d(0),5],[d(10),5],[d(20),5],[d(30),5]],1,10),
   noLimit:c(S4,'',''), nullLimit:c(S4,null,null), undefLimit:c(S4,undefined,undefined),
   nullMinOnly:c(S4,null,''),            // 下がっていく列で min=null を 0 と読むと「下限に達する」と出てしまう
   strLimit:c(S4,'abc',''),
   strVals:c([[d(0),'10'],[d(10),'9'],[d(20),'8'],[d(30),'7']],'1',''),
   nanVals:c([[d(0),10],[d(10),NaN],[d(20),8],[d(30),7],[d(40),6]],1,''),
   sameDay:c([[d(0),10],[d(0),9],[d(0),8],[d(0),7]],1,''),
   down:c(S4,1,''), up:c([[d(0),1],[d(10),2],[d(20),3],[d(30),4]],'',10),
   already:c(S4,8,'')                      // 最後の予測値 7 はもう下限 8 を下回っている→予測は出さない
  }});
 for(const k of ['zero','one','three','flat','noLimit','nullLimit','undefLimit','nullMinOnly','strLimit','sameDay','already'])if(R[k]!==null)bad.push(k+' は null のはず → '+JSON.stringify(R[k]));
 if(!R.down||R.down.which!=='下限'||R.down.days!==Math.round((1-10)/(-0.1)-30))bad.push('下がる列の予測 '+JSON.stringify(R.down));
 if(!R.up||R.up.which!=='上限'||R.up.days!==Math.round((10-1)/0.1-30-0)&&R.up.days<1)bad.push('上がる列の予測 '+JSON.stringify(R.up));
 if(!R.strVals||R.strVals.days!==60)bad.push('文字の値でも数として読む '+JSON.stringify(R.strVals));
 if(!R.nanVals||R.nanVals.n!==4)bad.push('NaN の値は飛ばして4件で計算 '+JSON.stringify(R.nanVals));
 const txt=JSON.stringify(R);if(/NaN|Infinity/.test(txt))bad.push('NaN/Infinity が出た '+txt);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
