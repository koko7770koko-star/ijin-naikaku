// 名前で並べる所が「数は数として」並ぶ（設備2 が 設備10 より前、2号館 が 10号館 より前）ことを確かめる（hz-natural-sort）。
// 見る所：設備台帳の「名前順」・設備コードが同じときの名前・発電機の順（genOrder）・発電機の一覧（genCard）の棟と台の順。
// 保存データ（S.equipment の並び）は変わらないこと。名前は「設備1」「発電機1」の形だけ。
// usage: node hozen/tools/natsortcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
 const r=await p.evaluate(()=>{
  const eq=(id,name,extra)=>Object.assign({id,code:'',name,place:'',kind:'',status:'稼働',repairs:[]},extra||{});
  S.equipment=[eq('n1','設備10'),eq('n2','設備2'),eq('n3','設備1'),eq('n4','設備11'),
   eq('c1','盤10',{code:'P-1'}),eq('c2','盤2',{code:'P-1'})];
  const before=JSON.stringify(S.equipment);
  V.eqQ='';V.eqLoc='';V.eqKind='';V.eqSort='name';go('equip');
  const names=[...document.querySelectorAll('#app .item .ti')].map(e=>e.firstChild.textContent.trim());
  const byName=names.filter(n=>/^設備\d+$/.test(n));
  V.eqSort='code';go('equip');
  const byCode=[...document.querySelectorAll('#app .item .ti')].map(e=>e.firstChild.textContent.trim()).filter(n=>/^盤\d+$/.test(n));
  const same=JSON.stringify(S.equipment.slice(0,6))===before;
  // 発電機：棟「10号館」「2号館」、同じ電気室に 発電機10・発電機2
  S.locs=[{id:'b10',type:'建屋',name:'10号館',parent:''},{id:'b2',type:'建屋',name:'2号館',parent:''},
   {id:'f1',type:'階',name:'1階',parent:'b2'},{id:'r1',type:'電気室',name:'第1電気室',parent:'f1'},
   {id:'f2',type:'階',name:'1階',parent:'b10'},{id:'r2',type:'電気室',name:'第1電気室',parent:'f2'}];
  S.equipment=[eq('g1','発電機10',{kind:'発電機',locId:'r1'}),eq('g2','発電機2',{kind:'発電機',locId:'r1'}),eq('g3','発電機1',{kind:'発電機',locId:'r2'})];
  const ord=genOrder().map(e=>e.name);
  V.genB='';const h=genCard();const tmp=document.createElement('div');tmp.innerHTML=h;
  const txt=tmp.textContent;const pos=s=>txt.indexOf(s);
  return {byName,byCode,same,ord,card:[pos('2号館'),pos('10号館'),pos('発電機2'),pos('発電機10'),pos('発電機1')]}});
 if(r.byName.join()!=='設備1,設備2,設備10,設備11')errs.push('設備台帳の名前順が数の順でない：'+r.byName.join(','));
 if(r.byCode.join()!=='盤2,盤10')errs.push('コードが同じときの名前の順が数の順でない：'+r.byCode.join(','));
 if(!r.same)errs.push('保存データ（S.equipment の並び）が変わった');
 if(r.ord.join()!=='発電機2,発電機10,発電機1')errs.push('発電機の順（genOrder）が数の順でない：'+r.ord.join(','));
 const [b2,b10,g2,g10,g1]=r.card;
 if(!(b2>=0&&b10>=0&&b2<b10))errs.push('発電機の一覧で 2号館 が 10号館 より前でない：'+r.card.join(','));
 if(!(g2>=0&&g10>=0&&g2<g10))errs.push('発電機の一覧で 発電機2 が 発電機10 より前でない：'+r.card.join(','));
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
