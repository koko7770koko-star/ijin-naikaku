// 仕様の単位（hz-spec-unit）：表示だけに単位を添え、保存の spec のキーは変えない。
//  編集画面のラベル「出力（kVA）」「燃料タンク容量（L）」（「燃料消費量（L/h）」は二重にしない）・遮断器は「定格電圧（kV）」、コンデンサは「定格電圧（V）」。
//  カルテは値が数だけなら見出しに単位、「990L」のように単位入りならそのまま。保存して読み直してもキーは同じ・燃料の時間の目安も今までどおり。390px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const eq=(id,kind,spec)=>({id,code:id,name:kind+id,kind,status:'稼働',locId:'',place:'',importance:'',spec});
 await p.evaluate(E=>{S.equipment=E;S.meas=[{id:'m1',equipId:'g1',date:TODAY,rows:[{name:'燃料残量',v:50,unit:'%',min:'',max:'',ck:false}],by:'確認者',name:'月次',type:'その他',cond:{},note:'',photos:[]}];save()},
  [eq('g1','発電機',{'出力':'500','燃料タンク容量':'1950','燃料消費量（L/h）':'65'}),eq('g2','発電機',{'燃料タンク容量':'990L'}),eq('v1','遮断器',{'定格電圧':'7.2'}),eq('c1','コンデンサ',{'定格電圧':'6600','自由な項目':'あいう'})]);
 const keys0=await p.evaluate(()=>JSON.stringify(S.equipment.map(e=>Object.keys(e.spec))));
 // 編集画面のラベル
 const lab=async id=>{await p.evaluate(id=>editEquip(id),id);await p.waitForSelector('#e_spec');await p.waitForTimeout(150);const r=await p.evaluate(()=>[...document.querySelectorAll('#e_spec .row span')].map(x=>x.textContent));await p.evaluate(()=>closeModal(true));return r};
 let L=await lab('g1');['出力（kVA）','電圧（V）','燃料タンク容量（L）','燃料消費量（L/h）'].forEach(t=>{if(!L.includes(t))bad.push('発電機のラベルに '+t+' が無い '+L.join('|'))});if(L.some(t=>/（L\/h）（/.test(t)))bad.push('単位が二重');
 L=await lab('v1');if(!L.includes('定格電圧（kV）'))bad.push('遮断器の定格電圧が kV でない '+L.join('|'));
 L=await lab('c1');if(!L.includes('定格電圧（V）'))bad.push('コンデンサの定格電圧が V でない '+L.join('|'));
 // 保存してもキーは同じ
 await p.evaluate(()=>editEquip('g1'));await p.waitForSelector('#e_spec');await p.waitForTimeout(150);await p.click('#modal button:text-is("保存")');await p.waitForTimeout(200);
 // カルテ
 const k=async id=>{await p.evaluate(id=>{closeModal(true);go('equipDetail',{eq:id,eqTab:'ov'})},id);await p.waitForTimeout(150);return p.evaluate(()=>[...document.querySelectorAll('#app th')].map(x=>x.textContent))};
 let th=await k('g1');if(!th.includes('燃料タンク容量（L）')||!th.includes('出力（kVA）'))bad.push('カルテに単位が付かない '+th.join('|'));
 th=await k('g2');if(!th.includes('燃料タンク容量')||th.includes('燃料タンク容量（L）'))bad.push('単位入りの値で単位を足した '+th.join('|'));
 th=await k('c1');if(!th.includes('自由な項目'))bad.push('自由な項目が出ない');
 if(!/約15時間/.test(await p.evaluate(()=>{go('equipDetail',{eq:'g1',eqTab:'ov'});return document.querySelector('#app').innerText})))bad.push('燃料の時間の目安が出なくなった');
 await p.evaluate(()=>{window.__t=Date.now();save()});await p.waitForFunction(()=>(MIRROR_AT.app||0)>=window.__t,null,{timeout:10000});await p.reload();
 await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.equipment)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 if(await p.evaluate(()=>JSON.stringify(S.equipment.map(e=>Object.keys(e.spec))))!==keys0)bad.push('spec のキーが変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
