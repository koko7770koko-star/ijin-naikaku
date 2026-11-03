// 確かめの道具の時間を測る（hz-tools-slow）：hozen/tools の *check.js を 1 本ずつ（並べずに）走らせて、かかった秒と結果を一覧にし、
//  20 秒を超えた物を「遅い」として出す。check.js 自体は変えない。ほかの道具も変えない（読むだけ）。
// usage: node hozen/tools/timecheck.js [上限秒=20] [名前の一部で絞る]
const {spawnSync}=require('child_process');const fs=require('fs');const path=require('path');
const LIM=+(process.argv[2]||20),Q=process.argv[3]||'';
const files=fs.readdirSync(__dirname).filter(f=>/check\.js$/.test(f)&&f!=='timecheck.js'&&(!Q||f.includes(Q))).sort();
const out=[];
for(const f of files){const t=Date.now();const r=spawnSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8',timeout:300000});
 const sec=(Date.now()-t)/1000,last=String((r.stdout||'')+(r.stderr||'')).trim().split('\n').pop()||'';
 out.push({f,sec,ok:r.status===0,last:last.slice(0,60)});process.stdout.write(`${sec.toFixed(1).padStart(6)}s ${r.status===0?'OK':'NG'} ${f}\n`)}
const slow=out.filter(x=>x.sec>LIM).sort((a,b)=>b.sec-a.sec),tot=out.reduce((n,x)=>n+x.sec,0);
console.log(`\n合計 ${tot.toFixed(0)} 秒（${out.length} 本）`);
console.log(slow.length?`遅い（${LIM}秒超）：\n`+slow.map(x=>`  ${x.sec.toFixed(1)}s ${x.f}`).join('\n'):`${LIM}秒を超える物はありません`);
const ng=out.filter(x=>!x.ok);if(ng.length)console.log('NG：\n'+ng.map(x=>`  ${x.f}：${x.last}`).join('\n'));
console.log(ng.length?'（NG があります）':'NO ERRORS');process.exit(0);
