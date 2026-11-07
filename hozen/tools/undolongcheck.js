// 「元に戻す」の帯（undoBar）と知らせ（toast）：名前が空白の無い長い英数字（60 字）でも、幅 360px・文字「特大」で帯と知らせが画面の外へ出ず、
// 文字が箱からはみ出さず、「元に戻す」ボタンが画面の中で 44px 以上あって押せるか（hz-v-undo-longword）。保存の形は変えない。usage: node hozen/tools/undolongcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:360,height:780}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const r=await p.evaluate(fs=>{window.save=()=>{};S.settings.fscale=fs;applyFScale();go('home');const W=('ABC123xyz').repeat(7).slice(0,60);const vw=innerWidth,out={};let undone=0;
  undoBar(`作業「${W}」を完了にしました`,()=>{undone=1},'x');const e=document.querySelector('#undobar'),rc=e.getBoundingClientRect(),bt=e.querySelector('button'),br=bt.getBoundingClientRect(),sp=e.querySelector('span');
  out.undo={l:Math.round(rc.left),r:Math.round(rc.right),btR:Math.round(br.right),btH:Math.round(br.height),spill:sp.scrollWidth>sp.clientWidth+1};
  const hit=document.elementFromPoint(br.left+br.width/2,br.top+br.height/2);out.undo.hit=hit===bt;if(hit===bt)bt.click();out.undo.done=undone;
  toast(`設備「${W}」を保存しました`);const t=document.querySelector('#toast'),tr=t.getBoundingClientRect();out.toast={l:Math.round(tr.left),r:Math.round(tr.right),spill:t.scrollWidth>t.clientWidth+1};out.vw=vw;out.doc=document.documentElement.scrollWidth;return out},fs);
 console.log(tag+JSON.stringify(r));const vw=r.vw;
 if(r.undo.l<0||r.undo.r>vw)bad.push(tag+'元に戻すの帯が画面の外へ出る '+r.undo.l+'〜'+r.undo.r);if(r.undo.btR>vw)bad.push(tag+'「元に戻す」が画面の外 '+r.undo.btR);if(r.undo.btH<44)bad.push(tag+'「元に戻す」が低い '+r.undo.btH);
 if(r.undo.spill)bad.push(tag+'帯の文字が箱からはみ出す');if(!r.undo.hit||!r.undo.done)bad.push(tag+'「元に戻す」が押せない');
 if(r.toast.l<0||r.toast.r>vw)bad.push(tag+'知らせが画面の外へ出る '+r.toast.l+'〜'+r.toast.r);if(r.toast.spill)bad.push(tag+'知らせの文字が箱からはみ出す');if(r.toast.r-r.toast.l<vw*0.7)bad.push(tag+'知らせが細すぎる（長い文が細い柱になる） '+(r.toast.r-r.toast.l));if(r.doc>vw+2)bad.push(tag+'横にはみ出す '+r.doc)}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
