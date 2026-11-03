# 電気設備 総合保全管理

スマホ1台で使う、電気設備の保全管理の道具（単一 HTML）。決まりはリポジトリ直下の CLAUDE.md の「保全アプリの決まり」。
- 本体：index.html（v16.4 から改良を始めた）
- 確認：`node hozen/tools/check.js`
- 古い形・壊れた記録の確認：`node hozen/tools/oldcheck.js`（空・最小・項目欠け・JSON 破損・型違いの記録で開き、エラーなし・記録が残る・壊れた原本が残ることを確かめる）
