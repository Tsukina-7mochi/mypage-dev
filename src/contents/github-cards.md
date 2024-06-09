## GitHub Cards

<gh-repo-card name="Tsukina-7mochi/github-cards"></gh-repo-card>

<!-- 使った言語・技術 -->
<tech-tags>
Lit, esbuild, TypeScript, babel
</tech-tags>

<!-- 概要 -->
GitHub のカードをウェブサイトに埋め込むための custom component です。
Lit を使用して [Web Components](https://developer.mozilla.org/ja/docs/Web/API/Web_components) を使って作られています。
そのため `<script>` タグで読み込み `<gh-repo-card>` のような要素を置くだけで使用できます。
esbuild でビルドしているのですが、現在のバージョンではデコレータを変換してくれないため babel を使用しています。
そのため TypeScript の experimental decorator が使えず、JavaScript のデコレータを使っています (勝手に esbuild が TS→JS のデコレータ変換をしてくれると思っていました; JS デコレータがブラウザに広く実装されたら esbuild に実装されるらしいです)。

<!-- 作った理由 -->
GitHub のカードを提供するプロダクトは既に複数存在していましたが、ニーズに合わなかったため作りました。
画像として返却する API は解像度が低いという問題があり、DOM を書き換える API を使うものでは Shadow DOM で使えなず、さらに GitHub の API 上限にすぐに当たるという問題がありました。
そのため DOM を書き換える API のものを参考にし、Web Components を使って再実装しました。
もとの機能に加えカスタマイズ性を向上させたりユーザーのアイコンを表示するなど機能が拡張されています。
API 上限に関しては Cache API と Lock API を駆使して重複したリクエストの送信を排除することで対応しています。
この機能の実装には `fetch` をラップする方法や Service Worker を使う方法がありますが、後者は全リクエストを snooping してしまいオーバースペックかつ利用範囲が限られるため前者の方法を利用しています。

<!-- 評価・予定 -->
数日で作ったにしては悪くないと思っていますが、詰めきれていないエッジケースも多いので直したいと思っています。
レポジトリにも書いてあるとおりユーザーのカードも追加する予定です。
npmjs に公開したら自動で気に esm.sh (CDN) で使えるようになり、簡単に再利用できて便利だなあと思いました。
