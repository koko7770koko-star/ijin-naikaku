// 数の欄の型：金額・数量・時間・年・費用などの欄が type=number のままか（全角数字・カンマはブラウザの数値欄が受けず、文字欄に変わると「１２．５」「1,200」が黙って 0 や空になりうる）。
// 取り込み（CSV）側の全角・カンマは zenkakucheck.js が見る。保存の形は変えない。
// usage: node hozen/tools/numtypecheck.js
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8');
const bad=[];
const inputs=src.match(/<input\b[^>]*>/g)||[];
const NUMISH=/id="[^"]*(cost|amount|qty|price|life|hour|downH|renew|pt_min|pt_max|mt_v|sm_n"|n_\$\{)/i;
let n=0;
for(const t of inputs){
  if(!NUMISH.test(t))continue;
  if(/type="(checkbox|radio|file|date|month|time|hidden)"/.test(t))continue;
  n++;
  if(!/type="number"/.test(t))bad.push('数の欄が type=number でない：'+t.slice(0,140));
  else if(!/inputmode="(decimal|numeric)"/.test(t))bad.push('数の欄に inputmode が無い（スマホの数字キーボードが出ない）：'+t.slice(0,140));
}
if(n<8)bad.push('数の欄が見つからない（探し方が古い）：'+n);
console.log(bad.join('\n')||'NO ERRORS（数の欄 '+n+' 個）');process.exit(bad.length?1:0);
