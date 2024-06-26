## neblua

<gh-repo-card name="Tsukina-7mochi/neblua"></gh-repo-card>

<!-- 使った言語・技術 -->
<tech-tags>
Lua
</tech-tags>

<!-- 概要 -->
Lua で記述された Lua のバンドラです。
zero-dependency (他のライブラリに依存しない) になっており、持ち運び性が非常に高いことが特徴です。
そのため neblua を使って neblua 自身をバンドルすることもできます (動作確認に使っています)。
構文解析などを行わない設計になっているため非常に高速に動作します。

Lua は `require` 関数を用いてモジュールを読み込みますが、`require` の実際の振る舞いはカスタマイズ性が高く、hack 的な方法を使わなくてもバンドラを作成することができます。
Lua にはチャンクという概念があり、これは読み込んだモジュールを返す関数です (Common JS や UMD と似た概念だと思います)。
neblua では `require` の動作をカスタマイズし、優先的にバンドルによってハードコードされたチャンクを参照するように書き換えます。
グローバルの扱いに気をつければ、このようにして文字列レベルの処理でバンドルを行うことができます。
またエラー時の出力をわかりやすくするための工夫もされており、`xpcall` 関数を使うことでエラーの発生した行数を書き換えています。

<!-- 作った理由 -->
neblua は前述の Aseprite の PSD 出力スクリプトの作成の際、ファイルが巨大化しすぎてメンテナンスが困難になってきたため作られました。
Aseprite スクリプトは Lua ファイルを直接頒布するという形式のため、複数ファイルでの実装と相性が悪いためです。
バンドラ自体は既に存在していましたが Luarocks を使うのが面倒だったのとバンドラを作りたい気分だったので作りました。

<!-- 評価・予定 -->
個人的には速度や依存関係の少なさや技術的なおもしろさから、結構いいものになったと感じています。
現在はインポート対象のファイルを自動判別する機能を実装しており、少しインターフェースを整備すればバージョンを上げられそうです。
内部的に使っている Jest-like なテストライブラリも切り出して単体のライブラリにしたいなと考えています。
