# このリポジトリのチーム（2026-11-03 から）

**今の仕事は `hozen/` の「電気設備 総合保全管理」（保全アプリ）。** 偉人内閣シミュレータ（ルートの index.html・img/・tools/）は完成して止めたので触らない。
予約の名前は「偉人　カナメ／作業員A・B・C」のままだが、中身は保全アプリのチーム。db の ijin_ で始まる場所（ijin_requests・ijin_backlog・ijin_patches・ijin_state・ijin_meta・ijin_log・ijin_notices・ijin_teach）もそのまま使う。決まりの正は統合改良ボードの ijin_meta/start。

## 保全アプリの決まり
- 本体は `hozen/index.html` の1ファイル（約580KB、絵なし）。病院などの電気設備の点検予定・日常点検・設備台帳・報告書・夜勤シフト表を、スマホ1台で扱う仕事の道具。
- **使う人の記録を壊さない。** 記録は端末の localStorage（`hospElecSched_v1`・`kinmuhyo_v1` ほか）にあり、形の版は `SCHEMA=3`。保存キー・項目の名前・形を変えない。どうしても形を足すときは、古い記録をそのまま読める（足りない項目は初期値で補う）ようにし、その確かめを tests に書く。
- 人の名前・施設名・住所・電話番号を例や初期値に入れない（例は「○○総合病院」のような形だけ）。キーを書かない。
- 外への通信（天気 open-meteo・気象庁の警報・Claude API）は、つながらなくても他の機能が動くようにする。新しい外部の送り先は足さない。
- 機能を増やすより、不具合直し・使いやすさ・入力の手間を減らす・報告書の見た目を先に。大きく画面の配置を変えるときは ijin_requests のお願いか、窓口の決めた backlog の項目があるときだけ。
- 直したら `node hozen/tools/check.js`（390px で全画面を開いてエラーなし・保存して読み直すと残る・横にはみ出さない・保存キーと SCHEMA が同じ）を通す。
- 絵は描かない（画像 API は使わない）。

## 公開（カナメ）
1. 提出の枝を main に取り込み、`node hozen/tools/check.js` を通す。
2. 保全アプリのアーティファクト（ijin_meta/start の artifact）に `hozen/index.html` を publish。
3. main に push し、ボードの `ijin_meta/head` に `{head, version, at}`、`ijin_log` に1件。

---
（以下は完成した偉人内閣シミュレータの決まり。参考に残す）

# 偉人内閣シミュレータ：チームの決まり

報告・記録・コミットの題はすべて日本語。表に出る名前は統合改良ボードの meta/naming に従う。

## 役
- **カナメ**（まとめ役、id: kaname）：作業員の提出（枝）を確かめて main に取り込み、アーティファクトに公開する。公開と main への push はカナメだけ。
- **作業員 A・B・C**：決まった担当なし。仕事の列（統合改良ボードの db `ijin_requests` の status:new → `ijin_backlog` の todo）から1つずつ取り、`wA/…`・`wB/…`・`wC/…` の枝に push して、ボードの db `ijin_patches/<枝名の / を - に>` に `{at, by, branch, base, title, files, tests, status:"submitted"}` を書く。取るときは backlog の項目に `owner` を書く。

## 直し方
- 絵（IMG・BGI）は img/gazou.js（7.6MB、1行が数 MB）。index.html は約 0.8MB。直すときは Python で文字列を置き換え（rep で回数を確かめる）、絵の行は触らない。公開のときは img/gazou.js も files に入れる。
- 新しい人物の顔・場面の絵は ijin-chara-gazou スキルのとおり。絵は OpenAI の画像 API（ボードの tools/oai_image.py、キーは db data/users/me の openai。キーはどこにも書かない）。
- 直したら `node tools/check.js`（390px で読み込み・エラーなし）を通し、自動対戦で最後まで進むか確かめる。

## 公開（カナメ）
1. 提出の枝を main に取り込み、確認を通す。
2. アーティファクト 62LfsthDAX8wZH5aARVQxy に index.html を publish。
3. main に push し、ボードの `ijin_meta/head` に `{head, version, at}`、`ijin_log` に1件。
