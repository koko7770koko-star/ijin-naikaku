// 押せる物の大きさの確認：全画面を 390px で開き、ボタン・リンク・入力が 40px 未満の高さ/幅になっていないこと（設備の詳細まで）。
// usage: node hozen/tools/tapcheck.js
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'..','index.html'));await p.waitForTimeout(1500);
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','A棟','建屋',''),mk('f1','1F','階','b1'),mk('p1','盤1','盤','f1')];
  S.equipment=[{id:'e1',code:'E-1',name:'非常用発電機 1号',place:'A棟',kind:'発電機',status:'稼働',importance:'A',locId:'f1',photos:[],docs:[],repairs:[],health:[]}];
  S.tasks=[{id:'t1',date:TODAY,time:'10:00',kind:'臨時',cat:S.settings.cats[0],title:'試験点検',place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]}];save()});
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 const all=new Map();
 for(const v of views){await p.evaluate(x=>{try{go(x,x==='equipDetail'?{eq:'e1'}:undefined)}catch(e){}},v);await p.waitForTimeout(200);
  const r=await p.evaluate(()=>[...document.querySelectorAll('#app button, #app a, #app select, #app input:not([type=hidden]), #nav button')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&!e.disabled&&(r.height<40||r.width<40)&&!(e.type==='checkbox'&&e.closest('label'))}).map(e=>(e.textContent||e.getAttribute('aria-label')||e.type||e.tagName).trim().slice(0,14)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)));
  all.set(v,[...new Set(r)].slice(0,8));}
 let n=0;for(const [v,l] of all)if(l.length){n++;console.log(v+': 小さい '+l.join(' / '))}
 console.log(n?'':'NO ERRORS');await b.close();process.exit(n?1:0)})();
