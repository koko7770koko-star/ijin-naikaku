// 削除の「元に戻す」：設備・予備品（入出庫つき）・工具・図面（印つき）・資料・作業標準を削除して「元に戻す」を押すと、
// 並びの位置・中身が削除前と同じに戻り、保存→読み直しでも残る。保存の形は変えない。通信は止める。
// usage: node hozen/tools/undoallcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);await p.waitForTimeout(200);
 // 3件ずつ入れて、真ん中を消して戻す（並びの位置も見る）
 const r=await p.evaluate(async()=>{
  const out=[];const snap=()=>JSON.stringify({eq:S.equipment,parts:S.parts,moves:S.moves,tools:S.tools,dwg:S.drawings,lib:S.library,stds:S.stds,items:S.items,works:S.works});
  const mk=(pre,n)=>[...Array(n)].map((_,k)=>pre+k);
  S.equipment=[];S.parts=[];S.moves=[];S.tools=[];S.drawings=[];S.library=[];S.stds=[];
  const eq=mk('eqt',3).map((id,k)=>({...(S.equipment[0]||{}),id,name:'設備'+k,status:'稼働',repairs:[{id:'rp'+k,date:'2026-01-0'+(k+1),kind:'修理',content:'増し締め'+k,vendor:'',cost:1000*(k+1),photos:[]}],docs:[],health:[],run:{meters:[]},spec:{}}));
  S.equipment.push(...eq);
  S.parts.push(...mk('pta',3).map((id,k)=>({id,name:'予備品'+k,code:'P'+k,spec:'',maker:'',place:'',unit:'個',qty:k+2,min:1,price:100,equipIds:[],note:''})));
  S.moves.push(...S.parts.flatMap(pp=>[1,2].map(n=>({id:'mv'+pp.id+n,partId:pp.id,date:'2026-02-0'+n,type:'入庫',qty:n,after:n,ref:'',by:'',note:''}))));
  S.tools.push(...mk('tla',3).map((id,k)=>({id,kind:'工具',code:'T'+k,name:'工具'+k,loans:[{id:'ln'+k,who:'職員'+k,date:'2026-01-01'}],cal:[]})));
  S.drawings.push(...mk('dwa',3).map((id,k)=>({id,name:'図面'+k,vers:[{id:'v'+k,ver:'A',date:'2026-01-01',file:''}],pins:[{id:'pin'+k,x:.1*(k+1),y:.2,equipId:''}]})));
  S.library.push(...mk('lba',3).map((id,k)=>({id,title:'資料'+k,equipIds:[]})));
  S.stds.push(...mk('sda',3).map((id,k)=>({id,name:'標準'+k,steps:[]})));
  const cases=[['設備',()=>delEquip0('eqt1',true)],['予備品',()=>delPart('pta1')],['工具',()=>delTool('tla1')],['図面',()=>delDwg('dwa1')],['資料',()=>delLib('lba1')],['作業標準',()=>delStd('sda1')]];
  for(const [nm,f] of cases){
   const before=snap();
   try{await f()}catch(e){out.push([nm,'例外 '+e.message]);continue}
   await new Promise(r=>setTimeout(r,150));
   const mid=snap();
   const bt=document.querySelector('#undobar button');
   if(!bt){out.push([nm,'元に戻すが出ない']);continue}
   if(mid===before){out.push([nm,'削除されていない']);continue}
   bt.click();await new Promise(r=>setTimeout(r,200));
   const after=snap();
   if(after!==before){
    // どこが違うか
    const A=JSON.parse(before),B=JSON.parse(after);const d=Object.keys(A).filter(k=>JSON.stringify(A[k])!==JSON.stringify(B[k]));
    out.push([nm,'戻した結果が違う：'+d.join(',')]);
   }
   await new Promise(r=>setTimeout(r,100));
  }
  return out;
 });
 r.forEach(([nm,m])=>bad.push(nm+'：'+m));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
