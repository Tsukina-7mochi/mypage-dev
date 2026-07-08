---
title: aseprite-scripts
createdAt: 1970-01-01
updatedAt: 2026-07-08
---

# aseprite-scripts

<gh-repo-card name="Tsukina-7mochi/aseprite-scripts" no-avatar></gh-repo-card>

ドット絵エディタであるAsepriteの自作プラグインをまとめたレポジトリです。 スプライトのPSD (Photoshop File Format) 出力やWindows向けアイコン・カーソル出力、作品に効果を適用するフィルタなどがあります。 (現在リファクタ中でコードが汚いです)

PSD出力スクリプトはAsepriteにPSD入出力が欲しいというニーズがユーザーの間で一定数あり、知り合いや私自身もPSD出力を使いたかったため作成しました。ありがたいことに公式レポジトリやコミュニティなどで紹介してもらったりもしています。Luaでのバイナリファイルの操作自体に難があったり、PSDファイルの仕様の複雑さや情報が少ないことから開発には苦戦しました。現在自作バンドラやテストライブラリを使ってリファクタを進めています。
