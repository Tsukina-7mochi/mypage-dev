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
esbuild は `node_modules` ディレクトリ以下のライブラリを自動でバンドルしてくれますが、Deno のグローバルキャッシュは参照してくれません。
当初この問題を解決するために[自作のプラグイン](#esbuild-plugin-cache-deno)を使用していましたが、メンテンナンスのコストを割けなくなったため別のライブラリに移行しました。
Sass のコンパイルには Deno/Node.js の両方に対応したプラグインを作成して使用しています。
また、各セクションにある GitHub のレポジトリのカードは[独立したライブラリ](#github-cards)として公開しているものです。

ページを作る中でそこそこの量の文章を書くにあたり、各セクションを Markdown で書けるようにしています。
HTML ファイルはテンプレートとして扱われ、リンクされたファイル名の Markdown ファイルを marked でコンパイルした内容が挿入される仕組みになっています。
これは HTML ファイルの読み込みをフックするプラグインで実現されています。

<!-- 評価・予定 -->
正直 Vite や Astro などのメジャーなフレームワークを用いたほうが簡単にサイトを構築することができます。
それでも自分のポートフォリオを作るなら技術的に思想を強くして行こうということで esbuild を直に使ってビルド環境を構築しています。
