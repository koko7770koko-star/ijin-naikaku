# 偉人内閣シミュレータ

Android スマホで遊ぶ、歴史上の人物で内閣を作るシミュレーション（単一ページ）の元ソース。
公開先：Claude のアーティファクト https://claude.ai/artifact/62LfsthDAX8wZH5aARVQxy
（このリポジトリの index.html をそのままアーティファクトに公開する）

- `index.html` … ゲームの本体（約 0.8MB）。先頭の `<script src="img/gazou.js">` で絵を読む
- `img/gazou.js` … 人物の顔（`IMG`）と場面の絵（`BGI`）の webp data URL（約 7.6MB、2026-11-02 に index.html から移した）。絵を足すときはこのファイルに `Object.assign(IMG,{...});` の行を足す
- 公開するときは index.html と一緒に `img/gazou.js` も files で載せる
- `tools/check.js` … 390px で開いてエラーが無いかを確かめる
- `tools/play.js` … 自動対戦（seed 固定、約7分で12月まで）。`node tools/play.js $PWD/index.html 7 /tmp/s7`
- `tools/bench.js` … 自動対戦を N 回回して議席・支持・退陣の平均を出す（1回約3分）。`N=10 PAR=2 MODE=smart DIFF=hard node tools/bench.js`

最初のコミットは公開中の版 1793409002-6e37 をユーザーがダウンロードして上げたもの（2026-11-01、8,452,096 バイト）。
