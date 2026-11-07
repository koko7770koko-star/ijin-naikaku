// 印刷（PDF）で、名前・内容の絵文字・異体字（𠮷・髙・葉＋異体字の印 U+E0100）・丸数字が □ や豆腐にならず、字として紙に出るか（hz-v-print-emoji）。
// 日報（dailyRep）・異常の報告書（printDoc issue）・作業報告書（printDoc work）を A4 の PDF にし、pdftotext で字が残るか、pdffonts で字の形が埋め込まれているかを見る。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/printemojipdfcheck.js   （pdftotext・pdffonts を使う）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execSync}=require('child_process');
// この端末（試す側）の字の形に無い字は、端末の都合なので数えない（Android は Noto Sans CJK・Noto Color Emoji で 𠮷 も出る）
const hasFont=ch=>{try{return execSync(`fc-list ':charset=${ch.codePointAt(0).toString(16)}' family`).toString().trim().length>0}catch(e){return true}};
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const CH=['🔥','⚡','𠮷','髙','①','⑳','葉','\u{E0100}'];const MK='印🔥⚡𠮷髙①⑳葉\u{E0100}末';
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S);await p.waitForTimeout(200);
 const views=[['日報',`V.day=TODAY;go('dailyRep')`],['異常の報告書',`go('printDoc',{doc:{t:'issue',id:'i_em1'}})`],['作業報告書',`go('printDoc',{doc:{t:'work',id:'w_em1'}})`]];
 await p.evaluate(M=>{window.save=()=>{};const T=TODAY;
  S.daily[T]=Object.assign(S.daily[T]||{},{note:'備考'+M,by:'点検'+M});S.handover=Object.assign(S.handover||{},{[T]:{text:'申し送り'+M,by:'',at:''}});
  S.issues.push({id:'i_em1',date:T,title:'異常'+M,place:'場所'+M,status:'対応中',priority:'高',action:'処置'+M,detail:'内容'+M,photos:[]});
  S.works=S.works||[];S.works.push({id:'w_em1',date:T,start:'09:00',end:'10:00',title:'作業'+M,no:'W-1',place:'場所'+M,status:'予定',note:'メモ'+M,ky:[],staff:['担当'+M],equipIds:[]});
  const v=validateData(clone(S));if(v.ok){S.works=v.data.works;S.issues=v.data.issues}else throw new Error('validateData '+v.fatal)},MK);
 for(const [name,js] of views){
  await p.emulateMedia({media:'screen'});await p.evaluate(js);await p.waitForTimeout(250);
  const shown=await p.evaluate(M=>document.querySelector('#app').innerText.includes(M),MK);
  if(!shown){bad.push(name+'：画面に印の文が出ていない（作り方の確かめが要る）');continue}
  const f=path.join(os.tmpdir(),'hz-emoji-'+Date.now()+'.pdf');await p.emulateMedia({media:'print'});await p.pdf({path:f,format:'A4',printBackground:true});
  const t=execSync(`pdftotext -enc UTF-8 "${f}" -`).toString('utf8'),fonts=execSync(`pdffonts "${f}"`).toString('utf8');
  const miss=CH.filter(ch=>ch!=='\u{E0100}'&&hasFont(ch)&&!t.includes(ch));const tofu=(t.match(/[□�]/g)||[]).length;const notEmb=fonts.split('\n').slice(2).filter(l=>l.trim()&&/\bno\s+(yes|no)\s+(yes|no)\s+\d+/.test(l)).length;
  console.log(name,JSON.stringify({miss,tofu,fonts:[...new Set(fonts.split('\n').slice(2).filter(Boolean).map(l=>l.split(/\s+/)[0].replace(/^[A-Z]{6}\+/,'')))]}));
  if(miss.length)bad.push(name+'：PDF に出ない字 '+miss.join(' '));if(tofu)bad.push(name+'：PDF に □／� が '+tofu+' 字');if(notEmb)bad.push(name+'：埋め込まれていない字の形 '+notEmb);
  fs.unlinkSync(f)}
const skip=CH.filter(ch=>!hasFont(ch));if(skip.length)console.log('この端末に字の形が無いので数えない字：'+skip.join(' '));
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
