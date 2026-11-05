// 不具合の編集窓（editIssue）：状態を6回動かし（発見→対応中→完了→再開…）、処置・経過に長い文を入れた不具合で、文字「大」「特大」・360px：
// 履歴の日付・状態の札・人が割れない／状態のボタンが44px以上／窓が横にはみ出さない（hz-l-issue-hist）
// usage: node hozen/tools/issuehistxlcheck.js   （外部への通信は止める。名前は「設備1」「職員1」の形だけ）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fsc of ['xl','l','']){const ctx=await b.newContext({viewport:{width:360,height:780}});const p=await ctx.newPage();p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  await p.evaluate(fsc=>{const T=TODAY,S6=['発見','対応中','完了','対応中','完了','対応中'];
   S.equipment=[{id:'e1',code:'E-1',name:'設備1',kind:'変圧器',place:'',status:'',photos:[],docs:[],repairs:[]}];
   S.issues=[{id:'is1',date:addD(T,-20),title:'設備1の異音（長い内容のテストの文章）',place:'A棟 › 1階 › 第1電気室 › 動力盤-1',detail:'長い詳細の文。'.repeat(20),status:'対応中',action:'処置・経過の長い文：業者手配、部品交換、増し締め、再確認。'.repeat(12),closed:'',photos:[],equipId:'e1',confirmedBy:'職員1',
    log:S6.map((s,k)=>({at:new Date(Date.now()-(7-k)*864e5).toISOString(),from:k?S6[k-1]:'',to:s,by:'職員1',note:k?'状態を「'+s+'」に変更':'手入力で登録'}))}];
   S.settings.fscale=fsc;save()},fsc);
  await p.reload();await p.waitForFunction(()=>typeof S==='object'&&document.querySelector('#app').children.length>0);await p.waitForTimeout(500);
  await p.evaluate(()=>{try{closeModal(true)}catch(e){};go('issues');editIssue('is1')});await p.waitForTimeout(500);
  await p.evaluate(()=>{document.querySelectorAll('#modal details').forEach(d=>d.open=true);const m=document.querySelector('#modal');if(m)m.scrollTop=m.scrollHeight});await p.waitForTimeout(200);
  if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+'/is-'+(fsc||'n')+'.png'});
  const m=await p.evaluate(fsc=>{const o=[],modal=document.querySelector('#modal');if(!modal)return['窓なし'];const W=document.documentElement.clientWidth;
   if(modal.scrollWidth>modal.clientWidth+1)o.push('窓が横にはみ出す '+modal.scrollWidth+'>'+modal.clientWidth);
   modal.querySelectorAll('button,input,select,textarea').forEach(x=>{const r=x.getBoundingClientRect();if(!r.width)return;const nm=(x.id||x.textContent||'').trim().slice(0,14);if(r.right>W+1||r.left<-1)o.push('はみ出す「'+nm+'」');if(x.tagName==='BUTTON'&&r.height<43.5)o.push('44px未満「'+nm+'」'+Math.round(r.height))});
   if(fsc)modal.querySelectorAll('.isacts .btn').forEach(x=>{const rg=document.createRange();rg.selectNodeContents(x);const tops=new Set([...rg.getClientRects()].filter(q=>q.width>0).map(q=>Math.round(q.top/4)));if(tops.size>1)o.push('操作ボタンが言葉の途中で割れる「'+x.textContent.trim()+'」')});
   if(fsc){const tw=document.createTreeWalker(modal,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){const t=n.data,el=n.parentElement;if(!el||el.closest('textarea,input,select,option,script,style'))continue;
     const re=/\d+[/／.]\d+|\d{4}-\d\d-\d\d|職員1|発見|対応中|完了|再開/g;let mm;while(mm=re.exec(t)){const rg=document.createRange();rg.setStart(n,mm.index);rg.setEnd(n,mm.index+mm[0].length);const tops=new Set([...rg.getClientRects()].filter(q=>q.width>0).map(q=>Math.round(q.top)));if(tops.size>1)o.push('割れる「'+mm[0]+'」（'+el.tagName.toLowerCase()+'.'+el.className+'）')}}}
   return o},fsc);
  [...new Set(m)].forEach(x=>bad.push((fsc==='xl'?'特大':fsc==='l'?'大':'標準')+'・360px：'+x));await ctx.close()}
 console.log(bad.slice(0,20).join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
