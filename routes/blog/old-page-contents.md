---
title: Test
createdAt: 2026-07-08
updatedAt: 2026-07-08
---

# 昔のページ

昔のこのサイトに記載していた内容です。

## About Mooncake Sugar

主に Web (フロントエンド, バックエンド) と Android の開発をしています。

### 使用経験がある技術

- Web
  - React (Vanilla, Next.js, Remix)
  - Lit/Web Components
  - Vanilla JS/TS
  - Ruby on Rails
  - Hono
  - esbuild, Webpack
  - Cloudflare Workers
  - AWS EC2, ECR, ECS (少し)
  - ...
- Web backend with Golang
  - Gin
  - SQLBoiler
  - Wire
  - ...
- Android
  - Jetpack Compose
  - Hilt (Dagger)
  - Retrofit
  - ...
- Git/GitHub
- CI/CD
  - GitHub Actions
- Containers
  - Docker, Compose
- Unity
  - Shader LAB, HLSL (Cg)
  - C# (少し)
  - VRChat Udon Sharp
- 組み込み
  - Arduino
  - ESP32 with Free RTOS
  - STM32
- コンパイラ・言語処理系

## Repositories

### このページ

<gh-repo-card name="Tsukina-7mochi/mypage-dev"></gh-repo-card>

<span is-="badge" variant-="nord7">esbuild</span>

自分の作成物などをまとめたポートフォリオです。
スタイルに [WebTUI](https://webtui.ironclad.sh/) を用いています。
`hjkl` で Vim っぽい移動もできます。

このページは Deno 上で esbuild を動かして Markdown からビルドしています。
Vite などを用いてサクッと作っても良かったのですが、ビルド環境を作るのが好きなので一から実装しました。
現状はホットリロードで事足りてますがそのうち HMR や React のサーバーサイドレンダリング (with Cloudflare Worker) も実装したいなあと思っています。
GitHub のレポジトリカードも CDN 経由で読み込まれている自作ライブラリです。

### aseprite-scripts

<gh-repo-card name="Tsukina-7mochi/aseprite-scripts"></gh-repo-card>

<span is-="badge" variant-="nord7">Lua</span>

ドット絵エディタである Aseprite の自作プラグインをまとめたレポジトリです。
スプライトの PSD (Photoshop File Format) 出力や Windows 向けアイコン・カーソル出力、作品に効果を適用するフィルタなどがあります。
(現在リファクタ中でコードが汚いです)

PSD 出力スクリプトは Aseprite に PSD 入出力が欲しいというニーズがユーザーの間で一定数あり、知り合いや私自身も PSD 出力を使いたかったため作成しました。
ありがたいことに公式レポジトリやコミュニティなどで紹介してもらったりもしています。
Lua でのバイナリファイルの操作自体に難があったり、PSD ファイルの仕様の複雑さや情報が少ないことから開発には苦戦しました。
現在自作バンドラやテストライブラリを使ってリファクタを進めています。

### aseprite-type-definition

<gh-repo-card name="Tsukina-7mochi/aseprite-type-definition"></gh-repo-card>

<span is-="badge" variant-="nord7">Lua</span>

Aseprite Lua API の lua-language-server 用の型定義です。

前述の Aseprite でアイコン・カーソルを出力するスクリプトを作るときに型支援が欲しかったので作りました。
公式 docs を手動で書き写して型定義と説明のデータを作りました。
‾‾膨大な作業量‾‾

### esbuild-plugin-cache-deno

<gh-repo-card name="Tsukina-7mochi/esbuild-plugin-cache-deno"></gh-repo-card>

<span is-="badge" variant-="nord7">TypeScript</span>
<span is-="badge" variant-="nord7">esbuild</span>
<span is-="badge" variant-="nord7">Deno</span>

このパッケージはアーカイブされました。
Deno 環境で実行される esbuild で HTTP/HTTPS/NPM インポートをバンドルできるようにするためのプラグインです。
Deno の lock ファイル を用いてモジュールを Deno のグローバルキャッシュ内の具体的なファイルに紐づけています。
特に Node.js に関してはモジュール解決の仕組みが複雑で、一部の機能は完全に実装できていません (それでも React や lodash など主要ライブラリはバンドルできています)。
リファクタリングとともに lock ファイルのバージョン 3 に対応し、このバージョンではリダイレクト先や具体的に依存している npm モジュールのバージョンなどの特定が容易になったため実装がかなり簡潔になりました。

開発当時には HTTP/HTTPS インポートをバンドルできるようにするプラグイン自体は存在しており、fetch API と特定ディレクトリへのキャッシュを用いて実装されていました。
しかし同じ URL のキャッシュがプロジェクト間で共有されないのが気に入らない (私が Node.js ではなく Deno を使う理由です) という問題点があったため自分で作ってしまったのが始まりです。
その後 Deno が npm モジュールのインポートに対応したこともあり npm モジュールにも対応しました。
JSR モジュールへの対応を検討していましたが同様の機能を持つ他のプラグインに任せることにしました。

かなり実装は大変でしたが実用的なものに仕上がって満足しています。
最近は他のプラグインに移行しましたが、小規模な Web のプロジェクトでは大体このプラグインを使用していました。

### GitHub Cards

<gh-repo-card name="Tsukina-7mochi/github-cards"></gh-repo-card>

<span is-="badge" variant-="nord7">TypeScript</span>
<span is-="badge" variant-="nord7">esbuild</span>
<span is-="badge" variant-="nord7">Lit</span>

GitHub のカードをウェブサイトに埋め込むための custom component です。
Lit を使用して Web Components として作成しました。

GitHub のカードを提供するプロダクトは既に複数存在していましたが、ニーズに合わなかったため作りました。
画像として返却する API は解像度が低いという問題があり、DOM を書き換える API を使うものでは Shadow DOM で使えなず、さらに GitHub の API 上限にすぐに当たるという問題がありました。
そのため DOM を書き換える API のものを参考にし、Web Components を使って再実装とキャッシュを実装しました。
もとの機能に加えカスタマイズ性を向上させたりユーザーのアイコンを表示するなど機能が拡張されています。
キャッシュ機構では Cache API と Lock API を駆使して重複したリクエストの送信を排除しています。

このプロジェクトでは試験的に npm, JSR, CDN への配信を行ってみました。
配信する側としては全部 JSR にしてしまったほうが (npm でも使えるので) 楽なのですが使う側としては npm では npm パッケージを使いたいなあと思いました。

### neblua

<gh-repo-card name="Tsukina-7mochi/neblua"></gh-repo-card>

<span is-="badge" variant-="nord7">Lua</span>

Lua で記述された Lua のバンドラです。
zero-dependency (他のライブラリに依存しない) になっており、持ち運び性が非常に高いことが特徴です。
構文解析などを行わない設計になっているため非常に高速に動作します。

Lua は `require` 関数を用いてモジュールを読み込みますが、require の実際の振る舞いはカスタマイズ性が高く、hack 的な方法を使わなくてもバンドラを作成することができます。
Lua にはチャンクという概念があり、これは読み込んだモジュールを返す関数です (Common JS や UMD と似た概念だと思います)。
neblua では `require` の動作をカスタマイズし、優先的にバンドルによってハードコードされたチャンクを参照するように書き換えます。
グローバルの扱いに気をつければ、このようにして文字列レベルの処理でバンドルを行うことができます。
またエラー時の出力をわかりやすくするための工夫もされており、`xpcall` 関数を使うことでエラーの発生した行数を書き換えています。

neblua は前述の Aseprite の PSD 出力スクリプトの作成の際、ファイルが巨大化しすぎてメンテナンスが困難になってきたため作られました。
Aseprite スクリプトは Lua ファイルを直接頒布するという形式のため、複数ファイルでの実装と相性が悪いためです。
バンドラ自体は既に存在していましたが Luarocks を使うのが面倒だったのとバンドラを作りたい気分だったので作りました。

個人的には速度や依存関係の少なさや技術的なおもしろさから、結構いいものになったと感じています。
最近は Tree-shaking や minify も行いたいため Rust などで構文解析ベースの実装を行いたいなと思っています。
ちなみに本題の Aseprite スクリプトのリファクタは進んでいません。

### 日本語グライド入力システム

(大学の実習で作成したプロジェクトのため公開できません)

<span is-="badge" variant-="nord7">TypeScript</span>
<span is-="badge" variant-="nord7">HTML</span>
<span is-="badge" variant-="nord7">Sass</span>
<span is-="badge" variant-="nord7">Webpack</span>
<span is-="badge" variant-="nord7">Python</span>
<span is-="badge" variant-="nord7">FastAPI</span>
<span is-="badge" variant-="nord7">pipenv</span>
<span is-="badge" variant-="nord7">Docker</span>

キーボード上をなぞって (指をスライドさせて) 入力することができるキーボードの実装です。
英語では Gboard などがありますが日本語で作成している例はほとんどなかったため、グループワークの題材として採用しました。
実際に仮想キーボードとして実装するというよりは機能の実証という形で作成しています。
そのためフロントには Web, バックエンドには Python を使用しています。
Python を利用した理由はグループワークで他の人が使えるという条件で他に選択肢がなかったためです。
Python の環境作成には pipenv を使用していますが、他のメンバーが CLI に慣れていなかったため docker で環境を固めています。
アルゴリズムは指でなぞった軌跡からの特徴抽出、特徴点からのラティス生成、ラティス上での探索という順で実装されています。
機械学習を用いる方法も考えられましたが、時間的な制約で行うことができませんでした。

古典的なアルゴリズムの組み合わせで作成されているため技術的には難しい部分はあまりありませんでした。
ただグループのメンバーとの技術的なギャップが大きく、グループワークとして進めるという点でかなり苦労しました。
実際フロントや API に関してはほとんど自分で実装してしまい、ビジネスロジックの実装をしてもらう (アルゴリズムは全員で考える) という形で行っていました。
開発のための環境構築が一番の問題点だと考えていたため、docker を使って極力シンプルに環境を共有できるように工夫するなどもしました。 実際に動作するものができてそこそこの精度も出たので作成物にはある程度満足しています。
最近はこれを機械学習ベースで再実装して VR 上の入力システムを構築したいなあと考えています。

### AtCoder CLI

<gh-repo-card name="Tsukina-7mochi/atcoder-cli"></gh-repo-card>

<span is-="badge" variant-="nord7">Rust</span>

AtCoder の問題提出・ワークスペース初期化のための CLI アプリケーションです。
ヘッドレスブラウザを使用せず ureq パッケージを使った HTTP リクエストで動作しているため非常に高速で、キャッシュ操作によりログイン情報を扱っています。
既存の CLI アプリケーションもありますがそれ自体が別のアプリケーションに依存していること、そのアプリケーションがヘッドレスブラウザを使っているために動作が遅いことが気に入らなかったため作成しました。
Rust で作った理由は Rust でアプリを書く練習をしたかったためです。

Rust でちゃんとしたアプリケーションを書くのはこれが初めてでしたが、得られた知見がいくつかありました。
Rust でプログラムを書く場合は自然ときれいな設計になる (きれいな設計にしないと書くのがつらい) のですが、アプリの構造の設計にだいぶ頭を悩ませる事になりました。
特に CLI とビジネスロジックを分けるかどうかも大きな問題で、公式チュートリアルの grep は分けていましたが今回は最終的に分けるのをやめることになりました。
これは CLI での操作自体がビジネスロジックであるため、不可分であるという判断からです。
また、最初からパフォーマンスを考えたら負けだということを痛感しました。
Rust の所有権・ライフタイムシステムが複雑というよりかはソフトウェアの設計がそもそも複雑で、本来はこのレベルのことを人間が手動で管理しないといけないと考えるとパフォーマンスを犠牲にして簡潔性得るのが妥当に思えます。

ちなみにこれを作るのに満足して全然 AtCoder をやっていません。

### Turing Complete Unofficial

<gh-repo-card name="Tsukina-7mochi/turing-complete-unofficial"></gh-repo-card>

<span is-="badge" variant-="nord7">TypeScript</span>
<span is-="badge" variant-="nord7">HTML</span>
<span is-="badge" variant-="nord7">Sass</span>
<span is-="badge" variant-="nord7">Webpack</span>

Turing Complete というゲームの日本語解説です。
Turing Complete は NAND 素子などから出発してデコーダやマルチプレクサ、状態回路などを経てカウンタやレジスタ、 ALU などを実装し最終的にはチューリング完全な計算機を作るというゲームです。
完全に自分で計算機を組んでオレオレ ISA も作れる他、高速性や回路の小ささのために論理回路に回帰してアクセラレータを作る (FPGA のように) という面白いゲームです。

この解説ページは Webpack 駆動の SSG となっています (Webpack がスタンダードだった時代に作りました)。
コントリビュータが Markdown で記事を書いて main ブランチに取り込まれると CI でビルドされて GitHub Pages にデプロイされるという仕組みになっています。
メタファイルから Markdown を読み込んで HTML を出力するため、独自の Webpack プラグインを実装しています。
Markdown パーサには markdown-wasm、後処理などに katex や DOMPurify などを 使っています。

最初は CSR していましたがパフォーマンスの問題から SSG に切り替わったという経緯があります。
今作るなら Astro か Lume を使うと思います。

### Simple HTML Element

<gh-repo-card name="Tsukina-7mochi/simple-html-element"></gh-repo-card>

<span is-="badge" variant-="nord7">TypeScript</span>

HTML 文字列を生成するための DOM-like API です。
SSG でのコンテンツの生成など HTML 文字列をレンダリングしたいけれど大きい文字列リテラルを作りたくないし JSX のような大げさなものを使いたくないというニーズがあり作成しました。

### vpmpkg

<gh-repo-card name="Tsukina-7mochi/vpmpkg"></gh-repo-card>

<span is-="badge" variant-="nord7">TypeScript</span>
<span is-="badge" variant-="nord7">Hono</span>
<span is-="badge" variant-="nord7">Lit</span>

GitHub のレポジトリに対応する VPM (VRChat Package Manager) レポジトリのマニフェストを生成する API です。
自作ライブラリの VPM パッケージを用意するのが面倒だったのと他人の VPM レポジトリに使用しないパッケージが入っているのが嫌だったため作成しました。
サーバーは Hono で記述されており、ディスク/インメモリキャッシュなどを使ってリクエストをさばいています。
静的サイトは Vite + Lit で作成されています。

Lit を使用するのはこのプロジェクトがほぼ初めてで、使用してみたら Web Components の属性変更などのインターフェースが抽象化されていて使用感が良かったです。
既に React などが使われている環境だと使い所が難しいですが、新規プロジェクトや Adobe の Spectrum Web Components のような使い方をするのにいいなあと感じました。
かつて https://vpmpkg.ts7m.net にデプロイされており、VPS 上の Deno で動いていたため Let's Encrypt の設定を手動で行ったりしたため勉強になることも多くありました。
現在は運用を終了しており、理由は静的にレポジトリのマニフェストをホストできることに気づいたことと、利用者が自分しかいなかったためです。
もし今作るなら Cloudflare Workers で作ります。

### Glitch Shader

<gh-repo-card name="Tsukina-7mochi/glitch-shader"></gh-repo-card>

<span is-="badge" variant-="nord7">Unity</span>
<span is-="badge" variant-="nord7">HLSL</span>
<span is-="badge" variant-="nord7">C#</span>

Unity で post processing を使わずにマテリアルに設定するだけでグリッチ・走査線・色収差エフェクトを得られるシェーダーです。
HLSL で記述されており、マルチパスレンダリングや Stencil などを駆使して疑似半透明表示や色収差の実装を行っています。
基本的な光源計算には OpenLit を使っており、効果の実装に集中しています。
最初のバージョンでは RGB チャンネルごとに別のパスで描画していたのを 2 パスだけを使うように改修できたことで表示品質の向上と描画負荷の減少を同時に達成しました。

現状グリッチエフェクトは vertex ステージで頂点座標をずらすことで実装しているためメッシュが荒い場合に表示の崩れが気になってしまう問題があります。
そのため geometry ステージでの処理に改修したいという気持ちがあります。

## Gists

[Tsukina-7mochi/bf-in-type.ts](https://gist.github.com/Tsukina-7mochi/181bc612b8633f0f5d84cee7c03c866f)

<span is-="badge" variant-="nord7">TypeScript</span>

TypeScript の**型で** Brainf\*ck を実装したものです。
`Executed<"+++.">` のようにしてプログラムの実行結果を文字列に評価します。
2024 年の TSKaigi Kansai を見に行って感化されたので書きました。

整数や整数の加算の実装は既存の記事を参考にしました。
プログラムの評価はプログラムの実行機械の状態を再帰的に評価する (処理終了時には stdout の文字列に評価する) ことで実現しています。
TypeScript の型ってチューリング完全ということは評価が停止しない型を実装しているわけで、よくそんなことをしようと思ったなあと思いました。
ちなみにコードを書き換えるたびに再評価が走るためコーディングをしていると PC が爆熱になります。

## Intern

### Qiita 株式会社

qiita.com の開発業務に参加させていただきました。
初めてのことが多くて大変でしたが、スキルアップできたのと働くということが少しだけわかった気がします。
自分の特異な仕事や苦手な仕事の種類がわかったのがとてもためになりました。

- https://qiita.com/release-notes/2024-10-29
- https://qiita.com/release-notes/2024-10-31
- https://qiita.com/release-notes/2024-11-20
