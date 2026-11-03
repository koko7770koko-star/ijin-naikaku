// AI：つながらない・鍵が正しくない（401）・上限（429）・混み合い（529/500）・内容が受け付けられない（400）のとき、画面に出る知らせが
// 英語のエラー文のままではなく、次に何をすればよいか分かる日本語になる（文字の写真読み取り askClaude と、文章の下書き askClaudeText の両方）。
// 通信は route で作った偽の返事だけ（本物の送り先には出さない・鍵はダミー）。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let real=0,mode='ok';
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();
  if(/api\.anthropic\.com/.test(u)){const m={'401':[401,{type:'error',error:{type:'authentication_error',message:'invalid x-api-key'}}],'429':[429,{type:'error',error:{type:'rate_limit_error',message:'This request would exceed your rate limit'}}],'529':[529,{type:'error',error:{type:'overloaded_error',message:'Overloaded'}}],'500':[500,{type:'error',error:{type:'api_error',message:'Internal server error'}}],'400':[400,{type:'error',error:{type:'invalid_request_error',message:'messages.0.content.1.image.source.base64: image exceeds 5 MB maximum'}}]}[mode];
   if(mode==='net')return r.abort();if(m)return r.fulfill({status:m[0],contentType:'application/json',body:JSON.stringify(m[1])});
   if(mode==='badjson')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({content:[{type:'text',text:'{ これはJSONではない'}]})});
   return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({content:[{type:'text',text:'{"ok":1}'}]})})}
  real++;return r.abort()});
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{sessionStorage.setItem(KEYSTORE,'dummy-not-a-key');S.settings.apiMode='direct';S.settings.apiUrl=''});
 const EN=/invalid x-api-key|rate.?limit|Overloaded|Internal server|image exceeds|HTTP \d|Failed to fetch|NetworkError|Unexpected token|JSON/i;
 const run=async(m)=>{mode=m;return p.evaluate(async()=>{const o={};
   try{await askClaudeText('テスト');o.t='ok'}catch(e){o.t=String(e.message)}
   try{await askClaude([{type:'text',text:'x'}],'テスト');o.v='ok'}catch(e){o.v=String(e.message);o.net=e instanceof NetErr}
   return o})};
 const want={'401':/APIキー/,'429':/待って/,'529':/待って/,'500':/待って/,'400':/大きすぎる|受け付け/,'badjson':/解釈できませんでした/};
 for(const m of Object.keys(want)){const r=await run(m);
  if(m!=='badjson')ok(want[m].test(r.t)&&!EN.test(r.t),`${m}・文章：${r.t}`);
  ok(want[m].test(r.v)&&!EN.test(r.v),`${m}・写真：${r.v}`)}
 const n=await run('net');ok(/通信できませんでした/.test(n.t)&&!EN.test(n.t),'通信なし・文章：'+n.t);ok(n.net===true,'通信なし・写真が待ち行列になる NetErr でない');
 const g=await run('ok');ok(g.t==='ok'&&g.v==='ok','正常な返事が通らない '+JSON.stringify(g));
 ok(real===0,'本物の送り先に出ようとした '+real);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
