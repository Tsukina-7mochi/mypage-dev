## Simple HTML Element

<gh-card slug="Tsukina-7mochi/simple-html-element"></gh-card>

<!-- 使った言語・技術 -->
<tech-tags>
TypeScript
</tech-tags>

<!-- 概要 -->
<!-- 作った理由 -->
HTML 文字列を生成するための DOM-like API です。
SSG でのコンテンツの生成など HTML 文字列をレンダリングしたいけれど大きい文字列リテラルを作りたくないし JSX のような大げさなものを使いたくないというニーズがあり作成しました。

<!-- 評価・予定 -->
npm と deno.land へのモジュールの同時公開を行ったことがないため手探り状態で作成しており、ファイル構成が少々汚いです。
npm への公開を CI で行っているため、checkout 後にビルドコマンドを走らせるほうが適切だなあと思っています。
