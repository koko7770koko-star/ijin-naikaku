// 予備品の一覧と人員・資格の見出し：文字「大」「特大」・360px で、予備品の題の幅が狭くならず（1文字幅で縦に割れない）、−/＋が下の段に並び、「人員・資格」の見出しが言葉の途中で割れない。標準・390px は −/＋ が右に並ぶまま。hz-xl-review-7
// usage: node hozen/tools/stockxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();S.parts=[...Array(4)].map((_,i)=>({id:'pm'+i,code:'P-'+(1000+i),name:'端子台 M6 3極',spec:'定格 6.6kV',maker:'○○電機',place:'予備品庫 第3棚',unit:'個',qty:i?5:0,min:2,price:1200,equipIds:[],note:''}));save();go('stock',{stTab:'parts'})},fs);await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')].filter(x=>x.querySelector('.pqb'));return {n:it.length,bw:Math.min(...it.map(x=>x.querySelector('.bd').getBoundingClientRect().width)),below:it.every(x=>x.querySelector('.pqb').getBoundingClientRect().top>=x.querySelector('.bd').getBoundingClientRect().bottom-1),beside:it.every(x=>x.querySelector('.pqb').getBoundingClientRect().left>=x.querySelector('.bd').getBoundingClientRect().right-1),sw:document.documentElement.scrollWidth}});
 if(r.n<4)errs.push(tag+'：予備品の行が出ない');if(r.sw>w+2)errs.push(tag+'：横にはみ出す');
 if(fs){if(r.bw<150)errs.push(tag+'：予備品の題の幅が '+Math.round(r.bw)+'px しかない');if(!r.below)errs.push(tag+'：−/＋が題の下の段に並ばない')}else if(!r.beside)errs.push(tag+'：標準で −/＋ が右に並ばない');
 await p.evaluate(()=>{S.settings.staff=['職員1'];go('staff')});await p.waitForTimeout(300);
 const h=await p.evaluate(()=>{const e=[...document.querySelectorAll('#app .hd-row h2')].find(x=>x.textContent.includes('人員'));if(!e)return 'なし';const n=[...e.childNodes].filter(x=>x.nodeType===3)[0];const t=n.textContent;let pt=null,out='';for(let i=0;i<t.length;i++){const g=document.createRange();g.setStart(n,i);g.setEnd(n,i+1);const q=g.getClientRects()[0];if(!q)continue;if(pt!==null&&Math.abs(q.top-pt)>3&&!'・'.includes(t[i-1]))out=t.slice(0,i)+'/'+t.slice(i);pt=q.top}return out});
 if(h==='なし')errs.push(tag+'：人員・資格の見出しが無い');else if(h)errs.push(tag+'：見出しが「'+h+'」と割れる');
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
