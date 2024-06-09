## このページ

<gh-repo-card name="Tsukina-7mochi/mypage-dev"></gh-repo-card>

<!-- 使った言語・技術 -->
<tech-tags>
Lit, esbuild, HTML, Sass, TypeScript
</tech-tags>

<!-- 概要 -->
技術系のプロダクトをまとめるためのポートフォリオページです。
このページはプロダクトをまとめているだけでなく、作成物のショーケースでもあります。
このページ自体は HTML, Sass (SCSS), TypeScript で記述されており、ライブラリとして Lit を使用しています。
ビルドには esbuild を使用し、ランタイムには Deno を使用しています。

esbuild は主に Node.js 環境向けに作られているため、Deno で使用できる機能は一部制限されています。
特に `node_modules` 配下のライブラリを自動でバンドルしてくれない (そもそも `node_modules` が存在しない) などの問題があるため、これを解決するために[自作のプラグイン](#esbuild-plugin-cache-deno)を使用しています。
(独立したプロジェクトにはしていませんが、ライブリロードするためのプラグインもこのために作成しています。)
まだまだ実際のプロダクトで Deno 環境の esbuild を使用するには至りませんが、このような実践的なページも十分作ることができます。
また、各セクションにある GitHub のレポジトリのカードは[独立したライブラリ](#github-cards)として公開しているものです。

ページを作る中でそこそこの量の文章を書くにあたり、各セクションを Markdown で書けるようにしています。
HTML ファイルはテンプレートとして扱われ、リンクされたファイル名の Markdown ファイルを marked でコンパイルした内容が挿入される仕組みになっています。
これは HTML ファイルの読み込みをフックするプラグインで実現されています。

<!-- 作った理由 -->
きちんとプロダクトの説明をまとめたものを作りたいと思ったため作成しました。
ついでに今まで GitHub Pages を使っていたので Cloudflare Pages も使ってみたいと思い使ってみました。
「このページを作るのに自作ソフトウェアがたくさん動いているんだぜ！」と言いたかったのでVite や Astro などのメジャーなフレームワークを使わずに作りました。

<!-- 評価・予定 -->
