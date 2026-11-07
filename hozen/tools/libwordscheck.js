// 技術資料（go('lib')）の検索：2 語（並びが逆・全角空白）・半角カナ・全角英数で同じく絞れ、0 件のとき「見つかりませんでした」と「クリア」（44px 以上）が出て、
// 押すと一覧に戻り、390px・特大で横にはみ出さないか（hz-v-search-words-lib）。保存の形は変えない。外への通信は止める。usage: node hozen/tools/libwordscheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{window.save=()=>{};S.library=[...Array(40)].map((_,i)=>({id:'lb'+i,title:'資料'+i,tags:'',text:(i%2?'VCB 開閉回数 ':'バッテリー 交換 ')+(i%3?'A棟':'B棟')+' の手順'}));{const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);S.library=m.library}}
  S.settings.fscale='xl';applyFScale();const R={};const n=q=>libSearch(q).length;
  for(const q of ['VCB','ｖｃｂ','バッテリー','ﾊﾞｯﾃﾘｰ','Ａ棟 vcb','b棟　ﾊﾞｯﾃﾘｰ','無い語 vcb'])R[q]=n(q);
  V.libQ='無い語ｘｙｚ';go('lib');const t=document.querySelector('#app').innerText,bt=[...document.querySelectorAll('#app button')].find(b=>b.textContent.trim()==='クリア');
  R.empty=/見つかりませんでした/.test(t);R.btnH=bt?bt.getBoundingClientRect().height:0;R.sw=document.documentElement.scrollWidth;if(bt)bt.click();R.after={q:V.libQ||'',items:document.querySelectorAll('#app .item').length};return R});
 console.log(JSON.stringify(r));
 if(!r['VCB'])bad.push('VCB が見つからない');if(r['ｖｃｂ']!==r['VCB'])bad.push('全角小文字の件数が違う');if(r['ﾊﾞｯﾃﾘｰ']!==r['バッテリー'])bad.push('半角カナの件数が違う');
 if(!(r['Ａ棟 vcb']>0&&r['Ａ棟 vcb']<r['VCB']))bad.push('2 語（逆）で絞れない');if(!(r['b棟　ﾊﾞｯﾃﾘｰ']>0&&r['b棟　ﾊﾞｯﾃﾘｰ']<r['バッテリー']))bad.push('全角空白の 2 語で絞れない');
 if(r['無い語 vcb'])bad.push('無い語を含む 2 語で見つかる');if(!r.empty)bad.push('0 件のとき「見つかりませんでした」が出ない');
 if(r.btnH<44)bad.push('「クリア」が無いか 44px 未満 '+r.btnH);if(r.sw>392)bad.push('横にはみ出す '+r.sw);if(r.after.q||!r.after.items)bad.push('「クリア」で一覧に戻らない '+JSON.stringify(r.after));
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
