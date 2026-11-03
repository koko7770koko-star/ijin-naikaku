// 設備のカルテ：写真が24枚あっても、先頭の6枚だけ出て「ほか 18枚の写真を見る」で開け、「写真をたたむ」で戻せる。8枚以下は今までどおり全部出る。
// ボタンは44px以上・390pxで横にはみ出さない・写真の記録（photos）は変わらない。写真は小さい単色の画像をコードで作る。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const setN=n=>p.evaluate(n=>{const mk=i=>{const cv=document.createElement('canvas');cv.width=80;cv.height=60;const x=cv.getContext('2d');x.fillStyle='hsl('+(i*20)+',50%,60%)';x.fillRect(0,0,80,60);return cv.toDataURL('image/png')};
  const ids=[...Array(n)].map((_,i)=>{PH['ep'+i]=mk(i);return 'ep'+i});S.equipment=[{id:'e1',code:'E-1',name:'試験設備',kind:'変圧器',status:'稼働',locId:'',place:'',photos:ids,docs:[],repairs:[],run:{meters:[]}}];V.eqPhAll_e1=false;go('equipDetail',{eq:'e1'});return JSON.stringify(S.equipment[0].photos)},n);
 const get=()=>p.evaluate(()=>{const btn=[...document.querySelectorAll('#app button')].find(x=>/枚の写真を見る|写真をたたむ/.test(x.textContent));return {imgs:document.querySelectorAll('#app .phs img').length,bt:btn?btn.textContent:'',h:btn?btn.getBoundingClientRect().height:0,sw:document.documentElement.scrollWidth,iw:innerWidth}});
 let before=await setN(24);await p.waitForTimeout(500);let r=await get();
 ok(r.imgs===6,'24枚のとき先頭6枚だけにならない '+r.imgs);ok(/ほか 18枚の写真を見る/.test(r.bt),'「ほか 18枚」のボタン '+r.bt);ok(r.h>=44,'ボタンが小さい '+r.h);ok(r.sw<=r.iw,'横にはみ出す');
 await p.evaluate(()=>[...document.querySelectorAll('#app button')].find(x=>/枚の写真を見る/.test(x.textContent)).click());await p.waitForTimeout(400);r=await get();
 ok(r.imgs===24&&/たたむ/.test(r.bt),'開いても24枚にならない '+r.imgs+r.bt);ok(r.sw<=r.iw,'開いて横にはみ出す');
 await p.evaluate(()=>[...document.querySelectorAll('#app button')].find(x=>/写真をたたむ/.test(x.textContent)).click());await p.waitForTimeout(300);r=await get();ok(r.imgs===6,'たたんでも戻らない '+r.imgs);
 ok(await p.evaluate(()=>JSON.stringify(S.equipment[0].photos))===before,'写真の記録が変わった');
 for(const n of [8,3]){await setN(n);await p.waitForTimeout(300);r=await get();ok(r.imgs===n&&!r.bt,`${n}枚のとき全部出てボタンは出ない ${r.imgs} ${r.bt}`)}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
