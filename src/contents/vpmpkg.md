## vpmpkg

<gh-repo-card name="Tsukina-7mochi/vpmpkg"></gh-repo-card>

<!-- 使った言語・技術 -->
<tech-tags>
TypeScript, Hono, Vite, Lit, HTML, CSS
</tech-tags>

<!-- 概要 -->
<!-- 作った理由 -->
GitHub のレポジトリに対応する VPM (VRChat Package Manager) レポジトリのマニフェストを生成する API です。自作ライブラリの VPM パッケージを用意するのが面倒だったのと他人の VPM レポジトリに使用しないパッケージが入っているのが嫌だったため作成しました。
サーバーは Hono で記述されており、ディスク/インメモリキャッシュなどを使ってリクエストをさばいています。
静的サイトは Vite + Lit で作成されています。

<!-- 評価・予定 -->
Lit を使用するのはこのプロジェクトがほぼ初めてで、使用してみたら Web Components の属性変更などのインターフェースが抽象化されていて使用感が良かったです。
既に React などが使われている環境だと使い所が難しいですが、新規プロジェクトや Adobe の Spectrum Web Components のような使い方をするのにいいなあと感じました。
かつて https://vpmpkg.ts7m.net にデプロイされており、VPS 上の Deno で動いていたため Let's Encrypt の設定を手動で行ったりしたため勉強になることも多くありました。
現在は運用を終了しており、理由は静的にレポジトリのマニフェストをホストできることに気づいたことと、利用者が自分しかいなかったためです。
