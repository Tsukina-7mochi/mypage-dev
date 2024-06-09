## Turing Complete Unofficial

<gh-repo-card name="Tsukina-7mochi/turing-complete-unofficial"></gh-repo-card>

<!-- 使った言語・技術 -->
<tech-tags>
TypeScript, HTML, Sass, Webpack
</tech-tags>

<!-- 概要 -->
<!-- 作った理由 -->
 Turing Complete というゲームの日本語解説です。
 Turing Complete は NAND 素子などから出発してデコーダやマルチプレクサ、状態回路などを経てカウンタやレジスタ、 ALU などを実装し最終的にはチューリング完全な計算機を作るというゲームです。
 完全に自分で計算機を組んでオレオレ ISA も作れる他、高速性や回路の小ささのために論理回路に回帰して高性能なシステムを作ることができるなど非常に楽しいゲームとなっています。
 この解説ページは Webpack 駆動の SSG となっています (Webpack がスタンダードだった時代に作りました)。
 コントリビュータが Markdown で記事を書いて main ブランチに取り込まれると CI でビルドされて GitHub Pages にデプロイされるという仕組みになっています。
 メタファイルから Markdown を読み込んで HTML を出力するため、独自の Webpack プラグインを実装しています。
 Markdown パーサには markdown-wasm、後処理などに katex や DOMPurify などを 使っています。
 
<!-- 評価・予定 -->
最初は CSR していましたがパフォーマンスの問題から SSG に切り替わったという経緯があります。
今作るなら Astro か Lume を使うと思います。
