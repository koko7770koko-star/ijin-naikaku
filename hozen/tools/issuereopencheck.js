// 不具合：完了にした案件を窓から 1 タップで「対応中」に戻せる・理由が無いと戻らない・戻すと closed が空になり履歴に残る・390px ではみ出さない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.issues.push({id:'rz1',src:'manual:rz1',date:addD(TODAY,-5),title:'確認用',place:'',detail:'',status:'完了',action:'交換',closed:TODAY,confirmedBy:'確認者',confirmedAt:new Date().toISOString(),photos:[],equipId:'',log:[]});
  S.issues.push({id:'rz2',src:'manual:rz2',date:TODAY,title:'未完了',place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]});save();go('issues');editIssue('rz2')});
 await p.waitForTimeout(400);
 ok(await p.evaluate(()=>!document.getElementById('is_reopen')),'未完了の案件に「戻す」が出る');
 await p.evaluate(()=>{closeModal(true);editIssue('rz1')});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const e=document.getElementById('is_reopen');if(!e)return null;const x=e.getBoundingClientRect();return {h:x.height,r:x.right,iw:innerWidth,sw:document.documentElement.scrollWidth}});
 ok(!!r,'完了の案件に「戻す」が出ない');
 if(r){ok(r.h>=44,'小さい '+r.h);ok(r.r<=r.iw&&r.sw<=r.iw,'はみ出す');
  await p.click('#is_reopen');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>document.getElementById('is_status').value==='対応中'),'状態が対応中にならない');
  await p.evaluate(()=>saveIssue('rz1'));await p.waitForTimeout(200); // 理由なし
  ok(await p.evaluate(()=>S.issues.find(i=>i.id==='rz1').status==='完了'),'理由なしで戻った');
  await p.evaluate(()=>{document.getElementById('is_memo').value='間違いで完了にした';saveIssue('rz1')});await p.waitForTimeout(300);
  const i=await p.evaluate(()=>S.issues.find(i=>i.id==='rz1'));
  ok(i.status==='対応中'&&i.closed===''&&!i.confirmedBy,'戻っていない '+JSON.stringify(i));
  ok((i.log||[]).some(l=>l.from==='完了'&&l.to==='対応中'&&/再開：間違いで完了にした/.test(l.note||'')),'履歴に残らない');
  ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).issues.find(i=>i.id==='rz1').status==='対応中'),'保存されない');}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
