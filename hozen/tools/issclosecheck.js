// 不具合を「対応済み（完了）」にする手順の確認：390px で、一覧の1件を開いて完了にするまでが
// 3タップ以内（行→5.完了→確認のチェック→保存 のうち状態ボタン以降）、確認欄と保存ボタンが同じ画面に見え、
// チェック欄が44px以上で押しやすく、保存すると完了日・確認者・処置が残る、横にはみ出さないことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.settings.operator='';S.issues.push({id:'ic1',src:'m:ic1',date:addD(TODAY,-3),title:'○○棟 2階 分電盤の端子の緩み',place:'○○棟 2F',detail:'',status:'対応中',action:'増し締めを実施',closed:'',photos:[],equipId:'',urgency:'中',log:[]});save();go('issues')});await p.waitForTimeout(400);
 let taps=0;
 await p.click('#app .item:has-text("分電盤の端子の緩み")');taps++;await p.waitForTimeout(400); // 行を開く（数えない）
 taps=0;
 await p.click('#is_steps button:has-text("完了")');taps++;await p.waitForTimeout(500);
 const g=await p.evaluate(()=>{const r=s=>{const e=document.querySelector(s);if(!e)return null;const q=e.getBoundingClientRect();return {t:q.top,b:q.bottom,l:q.left,r:q.right,h:q.height}};
  const foot=[...document.querySelectorAll('#modal button')].find(x=>x.textContent.trim()==='保存');const fq=foot&&foot.getBoundingClientRect();
  const chk=document.querySelector('#is_chk'),lab=chk&&chk.closest('label');
  return {chk:r('#is_chk'),lab:lab&&(q=>({h:q.height,l:q.left,r:q.right}))(lab.getBoundingClientRect()),save:fq&&{t:fq.top,b:fq.bottom,h:fq.height},vh:innerHeight,by:document.querySelector('#is_by').value,closed:document.querySelector('#is_closed').value,sw:document.documentElement.scrollWidth}});
 if(!g.chk)bad.push('確認のチェック欄が出ない');else{
  if(g.chk.t<0||g.chk.b>g.vh)bad.push('完了にした直後、確認のチェックが画面に見えない '+JSON.stringify(g.chk));
  if(g.save&&(g.save.b>g.vh+1||g.save.t<0))bad.push('保存ボタンが見えない');
  if(g.lab&&g.lab.h<44)bad.push('チェック欄の行が小さい '+g.lab.h);
  if(g.chk.h<24)bad.push('チェックの四角が小さい '+g.chk.h);}
 if(!g.closed)bad.push('完了日が空のまま');
 if(g.sw>392)bad.push('横にはみ出す '+g.sw);
 // 確認者が空でも、保存で理由が出て閉じない（名前を入れるまで）
 await p.fill('#is_by','');await p.click('#modal button:has-text("保存")');await p.waitForTimeout(300);
 if(!(await p.evaluate(()=>!!document.querySelector('#is_chk'))))bad.push('確認者が空なのに閉じた');
 await p.fill('#is_by','点検者');await p.tap?0:0;
 await p.click('#is_chk');taps++;
 await p.click('#modal button:has-text("保存")');taps++;await p.waitForTimeout(500);
 if(taps>3)bad.push('完了までのタップが多い '+taps);
 const s=await p.evaluate(()=>{const i=S.issues.find(x=>x.id==='ic1');return {st:i.status,by:i.confirmedBy,cl:i.closed,ac:i.action,open:!!(document.querySelector('#is_chk')&&document.querySelector('#is_chk').offsetParent)}});
 if(s.st!=='完了'||s.by!=='点検者'||!s.cl||s.ac!=='増し締めを実施')bad.push('保存が残らない '+JSON.stringify(s));
 if(s.open)bad.push('保存後に閉じない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
