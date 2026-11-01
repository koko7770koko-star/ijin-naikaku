# 偉人内閣シミュレータ：チームの決まり

報告・記録・コミットの題はすべて日本語。表に出る名前は統合改良ボードの meta/naming に従う。

## 役
- **カナメ**（まとめ役、id: kaname）：作業員の提出（枝）を確かめて main に取り込み、アーティファクトに公開する。公開と main への push はカナメだけ。
- **作業員 A・B・C**：決まった担当なし。仕事の列（統合改良ボードの db `ijin_requests` の status:new → `ijin_backlog` の todo）から1つずつ取り、`wA/…`・`wB/…`・`wC/…` の枝に push して、ボードの db `ijin_patches/<枝名の / を - に>` に `{at, by, branch, base, title, files, tests, status:"submitted"}` を書く。取るときは backlog の項目に `owner` を書く。

## 直し方
- index.html は 8MB あり、絵の行（IMG・BGI）は1行が数 MB。直すときは Python で文字列を置き換え（rep で回数を確かめる）、絵の行は触らない。
- 新しい人物の顔・場面の絵は ijin-chara-gazou スキルのとおり。絵は OpenAI の画像 API（ボードの tools/oai_image.py、キーは db data/users/me の openai。キーはどこにも書かない）。
- 直したら `node tools/check.js`（390px で読み込み・エラーなし）を通し、自動対戦で最後まで進むか確かめる。

## 公開（カナメ）
1. 提出の枝を main に取り込み、確認を通す。
2. アーティファクト 62LfsthDAX8wZH5aARVQxy に index.html を publish。
3. main に push し、ボードの `ijin_meta/head` に `{head, version, at}`、`ijin_log` に1件。
