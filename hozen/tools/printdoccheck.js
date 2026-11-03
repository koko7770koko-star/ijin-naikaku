// 報告書（点検・修理・作業）の印刷の確認：A4縦（794px幅）の印刷表示で、表が紙の幅に収まる・見出しの列が1字ずつ折れない・
// 空欄ばかり（最小の記録）でも・長い文章でも形が崩れない・エラーなし。
// usage: node hozen/tools/printdoccheck.js [画像の出力先の前半（例 /tmp/pd）]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const LONG='長い文章の例。'.repeat(30)+'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.repeat(4);
 const ids=await p.evaluate(LONG=>{
  const eq={id:'eqp',code:'T-1',name:'確認用変圧器',kind:'変圧器',status:'稼働',locId:'',place:'',run:{meters:[]}};S.equipment=[eq];
  S.meas=[{id:'m1',equipId:'eqp',date:TODAY,by:'',name:'',type:'その他',cond:{},rows:[{name:'電圧',v:'',unit:'V',min:'',max:'',ck:false}],note:'',photos:[]},
          {id:'m2',equipId:'eqp',date:TODAY,by:'確認者',name:'月次点検',type:'絶縁抵抗',cond:{tplCond:LONG,temp:'20',hum:'50',weather:'晴'},rows:[{name:'電圧',v:200,unit:'V',min:190,max:210,ck:false},{name:'外観',v:'○',unit:'',min:'',max:'',ck:true}],note:LONG,photos:[]}];
  S.issues=[{id:'i1',date:TODAY,status:'対応中',title:'確認',place:'',equipId:'',detail:'',action:'',photos:[],approvals:[]},{id:'i2',date:TODAY,status:'完了',closed:TODAY,title:LONG,place:'',equipId:'eqp',detail:LONG,action:LONG,cause:LONG,prevent:LONG,urgency:'高',downH:2,cost:1000,photos:[],approvals:[]}];
  const w=(id,x)=>Object.assign({id,no:'W-'+id,title:'作業',kind:'点検',status:'予定',date:TODAY,endDate:'',start:'',end:'',place:'',equipIds:[],staff:[],vendor:'',vendorStaff:'',content:'',result:'',pre:[],post:[],outage:{on:false},approvals:[],hist:[],photos:[],checks:{},cost:'',resp:'',needQuals:[],needN:0},x);
  S.works=[w('w1',{}),w('w2',{title:LONG,content:LONG,result:LONG,place:LONG,staff:['職員甲','職員乙'],vendor:'○○電気工事株式会社',pre:[{text:LONG,done:true,by:'甲'}],post:[{text:'確認',done:false}]})];
  return ['meas:m1','meas:m2','issue:i1','issue:i2','work:w1','work:w2']},LONG);
 for(const k of ids){const [t,id]=k.split(':');
  const ok=await p.evaluate(([t,id])=>{try{go('printDoc',{doc:{t,id}});return true}catch(e){console.error(e.message);return e.message}},[t,id]);
  if(ok!==true){bad.push(k+'：開けない '+ok);continue}
  await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const rep=document.querySelector('.rep');if(!rep)return null;const bx=rep.getBoundingClientRect();
   const narrow=[...rep.querySelectorAll('th')].filter(x=>{const s=x.textContent.trim();return s.length>=3&&x.getBoundingClientRect().width<34}).map(x=>x.textContent.trim().slice(0,8));
   const over=[...rep.querySelectorAll('table,td,th,p,div')].filter(x=>x.getBoundingClientRect().right>bx.right+2||x.getBoundingClientRect().right>796).length;
   return{right:bx.right,sw:document.documentElement.scrollWidth,narrow,over,cells:rep.querySelectorAll('td').length}});
  if(!r)bad.push(k+'：報告書が出ない');else{if(r.sw>796)bad.push(k+'：紙の幅をはみ出す '+r.sw);if(r.over)bad.push(k+'：はみ出す部品が'+r.over+'個');if(r.narrow.length)bad.push(k+'：見出しが狭くて折れる '+r.narrow.join('、'))}
  if(process.argv[2])await p.screenshot({path:process.argv[2]+'_'+t+id+'.png',fullPage:true});
  await p.emulateMedia({media:'screen'});
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
