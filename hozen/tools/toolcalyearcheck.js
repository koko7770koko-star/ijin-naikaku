// 工具・測定器の校正期限が年末年始・うるう年をまたぐとき、一覧とホームの「あと N 日」「期限切れ」が正しい（hz-v-tool-calib-yearend）
// usage: node hozen/tools/toolcalyearcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const CASES=[ // [今日, 校正期限, 期待: 日数]
 ['2026-12-30T10:00:00+09:00','2026-12-31',1],['2026-12-30T10:00:00+09:00','2027-01-01',2],['2027-01-02T10:00:00+09:00','2026-12-31',-2],
 ['2027-02-28T10:00:00+09:00','2027-03-01',1],['2028-02-28T10:00:00+09:00','2028-02-29',1],['2028-02-28T10:00:00+09:00','2028-03-01',2],['2028-02-29T10:00:00+09:00','2028-02-28',-1]];
(async()=>{const b=await chromium.launch();
 for(const [now,due,exp] of CASES){
  const ctx=await b.newContext({viewport:{width:390,height:780},timezoneId:'Asia/Tokyo'});const p=await ctx.newPage();
  p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.clock.setFixedTime(new Date(now));
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof MIRROR_READY!=='undefined'&&MIRROR_READY,null,{timeout:15000});
  const r=await p.evaluate(([due,exp])=>{const o=[];S.tools=[{id:'t1',name:'テスト測定器',kind:'測定器',code:'',maker:'',model:'',place:'',calDue:due,calCycleM:'',calHist:[],loans:[{to:'甲',due:due,back:''}]}];
   const left=diffD(due,TODAY);if(left!==exp)o.push(`diffD=${left} 期待${exp}`);
   go('stock',{stTab:'tools'});const t=document.body.innerText;
   if(exp<0&&!t.includes('期限切れ'))o.push('一覧に期限切れが出ない');
   if(exp>=0&&t.includes('期限切れ'))o.push('一覧に誤って期限切れ');
   if(exp>=0&&exp<=30&&!t.includes(`あと${exp}日`))o.push(`一覧に「あと${exp}日」が出ない`);
   if(exp<0&&!t.includes('貸出中'))o.push('貸出中が出ない');
   go('home');const h=document.body.innerText;
   if(exp<0&&!h.includes('校正期限切れ'))o.push('ホームに期限切れの知らせが出ない');
   if(exp>=0&&exp<=30&&!h.includes(`校正期限まであと${exp}日`))o.push(`ホームに「あと${exp}日」が出ない`);
   if(/NaN|Infinity|undefined/.test(t+h))o.push('NaN等が出る');
   return o},[due,exp]);
  r.forEach(x=>bad.push(`${now.slice(0,10)} 期限${due}：${x}`));await ctx.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
