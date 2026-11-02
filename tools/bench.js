// 自動対戦を N 回回して、議席・支持・退陣・エラー・時間を1行ずつと平均で出す（bal2 の測り直しなどの土台）。
// usage: node tools/bench.js [index.htmlのパス]   env: N=回数（既定5、seed 1〜N） SEED0=最初の seed（既定1） MODE=auto|smart（既定 auto）
//   DIFF=easy|normal|hard（既定 normal） RULE・TAG・GOAL・VOW=play.js にそのまま渡る（その札を選ぶ） PAR=並列数（既定1、最大2） FAST=play.js に渡す（既定8） LIM=1回の上限ミリ秒（既定600000） OUT=撮影の置き場（既定 /tmp/bench）
// play.js と index.html は変えない。難易度と最後の支持は、play.js に node -r でこのファイルを読ませて足す（BENCH_HOOK=1 のとき）。
if (process.env.BENCH_HOOK) {
  // ---- フック：play.js の中で動く ----
  const pw = require('playwright');
  const launch = pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch = async (...a) => {
    const b = await launch(...a);
    const np = b.newPage.bind(b);
    b.newPage = async (...o) => {
      const p = await np(...o);
      const ev = p.evaluate.bind(p);
      p.evaluate = async (fn, arg) => {
        const src = String(fn);
        if (src.includes('faWait')) { // 読み込み直後の1回：難易度を入れる
          const D = process.env.DIFF || 'normal';
          await ev(`try{diff=${JSON.stringify(D)}}catch(e){}`);
        }
        const r = await ev(fn, arg);
        if (src.includes('imgk:')) { // 最後の集計：支持・難易度・退陣の月を足す
          const x = await ev(() => ({ sup: Math.round(S.st.sup), diff: S.diff, fallM: S.fall ? S.month : 0 }));
          console.log('BENCHX ' + JSON.stringify(x));
        }
        return r;
      };
      return p;
    };
    return b;
  };
  return;
}
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const N = +process.env.N || 5, S0 = +process.env.SEED0 || 1, PAR = Math.min(2, Math.max(1, +process.env.PAR || 1));
const MODE = process.env.MODE || 'auto', DIFF = process.env.DIFF || 'normal', OUT = process.env.OUT || '/tmp/bench';
fs.mkdirSync(OUT, { recursive: true });
const one = seed => new Promise(res => {
  const t0 = Date.now(); let out = '';
  const c = spawn(process.execPath, ['-r', __filename, path.join(__dirname, 'play.js'), file, String(seed), path.join(OUT, `s${seed}`)],
    { env: { ...process.env, BENCH_HOOK: '1', MODE, DIFF, FAST: process.env.FAST || '8' } });
  c.stdout.on('data', d => out += d); c.stderr.on('data', d => out += d);
  c.on('close', code => {
    let j = null, x = {};
    for (const l of out.split('\n')) {
      if (l.startsWith('BENCHX ')) try { x = JSON.parse(l.slice(7)) } catch (e) { }
      else if (l.startsWith('{"seed"')) try { j = JSON.parse(l) } catch (e) { }
    }
    const secs = Math.round((Date.now() - t0) / 1000);
    if (!j) return res({ seed, bad: 'play.js が結果を出さなかった（code ' + code + '）: ' + out.trim().split('\n').pop().slice(0, 120), secs });
    const f = j.fin || {};
    res({ seed, seats: f.seats, sup: x.sup, diff: x.diff, fall: f.fall || '', fallM: x.fallM || 0, month: f.month, done: !!f.done, errs: j.errs || [], secs,
      bad: !f.done ? '12月まで進まず（' + f.month + '月、最後 ' + j.last + '）' : (j.errs || []).length ? 'エラー ' + j.errs[0].slice(0, 100) : '' });
  });
});
(async () => {
  const seeds = Array.from({ length: N }, (_, i) => S0 + i), rows = [];
  console.log(`自動対戦 ${N}回  MODE=${MODE}  DIFF=${DIFF}  PAR=${PAR}  ${file}`);
  console.log('seed\t議席\t支持\t退陣\t秒\t印');
  let k = 0;
  await Promise.all(Array.from({ length: PAR }, async () => {
    while (k < seeds.length) {
      const r = await one(seeds[k++]); rows.push(r);
      console.log([r.seed, r.seats ?? '-', r.sup ?? '-', r.fall ? r.fall + '(' + r.fallM + '月)' : '-', r.secs, r.bad ? '✗ ' + r.bad : (r.diff && r.diff !== DIFF ? '✗ 難易度が ' + r.diff + ' のまま' : '')].join('\t'));
    }
  }));
  const ok = rows.filter(r => r.seats != null), avg = a => a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length * 10) / 10 : '-';
  const sum = { n: rows.length, mode: MODE, diff: DIFF, seats: avg(ok.map(r => r.seats)), sup: avg(ok.filter(r => r.sup != null).map(r => r.sup)),
    falls: rows.filter(r => r.fall).length, bad: rows.filter(r => r.bad).map(r => r.seed), secs: avg(rows.map(r => r.secs)) };
  console.log(`平均\t${sum.seats}\t${sum.sup}\t${sum.falls}回\t${sum.secs}\t${sum.bad.length ? '✗ seed ' + sum.bad.join(',') : '落ちなし'}`);
  console.log('BENCH ' + JSON.stringify(sum));
  process.exit(sum.bad.length ? 1 : 0);
})();
