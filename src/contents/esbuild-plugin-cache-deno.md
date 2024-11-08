## esbuild-plugin-cache-deno

<gh-repo-card name="Tsukina-7mochi/esbuild-plugin-cache-deno"></gh-repo-card>

<!-- 使った言語・技術 -->
<tech-tags>
TypeScript, esbuild, Deno
</tech-tags>

<!-- 概要 -->

Deno 環境で実行される esbuild で HTTP/HTTPS/NPM インポートをバンドルできるようにするためのプラグインです。
このページでもこのプラグインを用いて Lit をバンドルしています。
仕組みとしては、Deno の lock ファイル (npm でいう package.lock) を用いて URL が具体的にインポートしているモジュールを突き止め、Deno 自体のグローバルキャッシュに対応付けています。
特に Node.js に関してはモジュール解決の仕組みが複雑で、一部の機能は完全に実装できていません (それでも React や lodash など主要ライブラリはバンドルできています)。
リファクタリングとともに lock ファイルのバージョン 3 に対応し、このバージョンではリダイレクト先や具体的に依存している npm モジュールのバージョンなどの特定が容易になったため実装がかなり簡潔になりました。

<!-- 作った理由 -->
開発当時には HTTP/HTTPS インポートをバンドルできるようにするプラグイン自体は存在しており、fetch API と特定ディレクトリへのキャッシュを用いて実装されていました。
しかし同じ URL のキャッシュがプロジェクト間で共有されないのが気に入らない (私が Node.js ではなく Deno を使う理由です) という点やあまりメンテナンスがされていないという問題点があったため自分で作ってしまったのが始まりです。
その後 Deno が npm モジュールのインポートに対応したこともあり npm モジュールにも対応しました。

<!-- 評価・予定 -->
かなり実装は大変でしたが実用的なものに仕上がって満足しています。
最近は他のプラグインに移行しましたが、小規模な Web のプロジェクトでは大体このプラグインを使用していました。

独自のセクションは設けませんが、Sass をビルドする拡張機能を機能追加するフォークやファイルをコピーする拡張機能、ビルド終了時にビルド時間とともにエラー数を報告するプラグインなども作っています。
最近規模が少し大きめのプロジェクトを作るにつれ、ビルドが esbuild 内で完結できない (公式に esbuild は「リンカ」と表現されています) という問題点が顕在化してきて、使いやすいタスクランナー (イメージとしては gulp) を探しています。
一部のプロジェクトはファイルの変更監視→再ビルド→Server Sent Events でライブリロードの仕組みを実装しているものもあるのでそれを切り出してもいいなと考えています。
