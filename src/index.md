---
title: Mooncake Sugar
---

<h1 class="visually-hidden">Mooncake Sugar</h1>
<pre aria-hidden="true" class="ascii-art">
█████╗███╗ ███████╗███████╗███╗ ██╗██████╗███████╗██╗ ██╗██████╗
██╔═██╔═██╗██╔══██║██╔══██║████╗██║██╔═══╝██╔══██║██║██╔╝██╔═══╝
██║ ██║ ██║██║  ██║██║  ██║██╔█║██║██║    ███████║████╔╝ ██████╗
██║ ██║ ██║██║  ██║██║  ██║██║████║██║    ██╔══██║██║██╗ ██╔═══╝
██║ ██║ ██║███████║███████║██║ ███║██████╗██║  ██║██║ ██╗██████╗
╚═╝ ╚═╝ ╚═╝╚═════╝╚══════╝╚═╝ ╚══╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═╝╚═════╝
</pre>
<pre aria-hidden="true" class="ascii-art">
██████╗██╗  ██╗██████╗███████╗██████╗
██╔═══╝██║  ██║██╔═══╝██╔══██║██╔══██
██████╗██║  ██║██║███╗███████║██████║
╚═══██║██║  ██║██║╚██║██╔══██║██╔══██╗
██████║███████║██████║██║  ██║██║  ██║
╚═════╝╚══════╝╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝
</pre>

**Kernel**: Humanity  
**Uptime**: <time id="uptime-display"></time>  
**Shell**: Zsh  
**Terminal**: Alacritty  
**Editor**: NeoVim  
**JS Runtime**: Deno  
**Locale**: ja_JP.UTF-8  

<div style="display: grid; grid-template-columns: repeat(8, 4ch); grid-template-rows: repeat(2, 1lh);">
<span style="background-color: var(--nord0);"></span>
<span style="background-color: var(--nord1);"></span>
<span style="background-color: var(--nord2);"></span>
<span style="background-color: var(--nord3);"></span>
<span style="background-color: var(--nord4);"></span>
<span style="background-color: var(--nord5);"></span>
<span style="background-color: var(--nord6);"></span>
<span style="background-color: var(--nord7);"></span>
<span style="background-color: var(--nord8);"></span>
<span style="background-color: var(--nord9);"></span>
<span style="background-color: var(--nord10);"></span>
<span style="background-color: var(--nord11);"></span>
<span style="background-color: var(--nord12);"></span>
<span style="background-color: var(--nord13);"></span>
<span style="background-color: var(--nord14);"></span>
<span style="background-color: var(--nord15);"></span>
</div>

---

## Social Links

<a is-="button" variant-="nord3" size-="small" href="https://github.com/Tsukina-7mochi">GitHub</a>
<a is-="button" variant-="nord3" size-="small" href="https://x.com/Tsukina_7mochi">Twitter / X</a>
<a is-="button" variant-="nord3" size-="small" href="https://qiita.com/Tsukina_7mochi">Qiita</a>

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

## Works

### このページ

<gh-repo-card name="Tsukina-7mochi/mypage-dev"></gh-repo-card>

<span is-="badge" variant-="nord7">esbuild</span>

自分の作成物などをまとめたポートフォリオです。
フレームワークを用いず素の esbuild を用いて作成されています。
スタイルには [WebTUI](https://webtui.ironclad.sh/) を用いています。

Vite などを用いてサクッと作っても良かったのですが、自分のポートフォリオということで esbuild 上にビルド環境を作ることにしました。
当初は `Tsukina-7mochi/esbuild-plugin-cache-deno` を用いており、後に `gjsify/esbuild-plugin-deno-loader` に移行したですが、更新がされなくなってしまったため CDN を用いて外部ファイル・ライブラリのバンドルを不要にしました。
GitHub のレポジトリカードも CDN 経由で読み込まれている自作ライブラリです。

## Intern
