# Llyn 実装刷新 計画

## ゴール

1. ランタイム実行
   - dev では生成ファイル（`dist/worker.js`）ではなく、ユーザーのサーバーコードと llyn 自体を直接実行する。
   - prod では静的コンパイルする
2. アイランドの単体ビルド
   - アイランドは呼び出し側（HTML）の情報なしで解決・ビルド・描画できる。
   - 呼び出し側が持つ情報（props、配置）はランタイムで与える
3. パスベースの設定
   - `build.ts` に散っているファイル収集ロジックを `llyn.config.ts` に集約し、 llyn 内蔵の収集器で扱う。

## 設計方針

### パッケージ境界

- `llyn/runtime`（公開）
  - ランタイムで用いる関数を高階
    - `serveIsland`: `(req: Request): Response`
    - `serveStaticForDev`: `(req: Request): Response` (dev 用の静的ファイルサーバー)
    - `isDev`: `boolean` dev mode では true (serveStaticForDev の切り替え用)
  - ビルド時はこのモジュール全体が生成コードに置き換わる
- `llyn/build`（公開）
  - prod build で使うスクリプト
- `llyn/core`（内部）
  - 設定ローダ、アイランド収集、ID 算出、コード生成、 ドキュメント処理（parse5 / marked）、prerender
- 旧 `llyn`（`index.ts` の `build()` / `startDevServer()`）は最終的に削除

### アイランドとインスタンス

アイランドの呼び出しをアイランドインスタンスとする

```ts
type IslandKind = "client" | "server" | "static";

type Island = {
  id: string; // specifier の SHA-1 の先頭 8 文字
  specifier: string; // root からの相対パス・区切り文字を `/` に置換
  url: URL; // 絶対 file URL
};

type IslandInstance = {
  island: Island;
  kind: IslandKind;
  domId: string; // ページ内で一意な ID
  props: Record<string, string>; // script タグの残余 attributes
};
```

- island id の衝突を検出したら例外を投げる（メッセージに衝突した 2 つの specifier を出す）。
- `_` 始まりの属性名はランタイム予約とし、script タグからは props に取り込まない。
- props はアイランドインスタンスからランタイムに注入する
  - client island: bootstrap のコードに JSON リテラルとして埋め込む
  - server island: `/_islands/<id>?<props をクエリ文字列展開>` で渡す

### プリレンダリングの識別

アイランドコンポーネントは props として `_prerender: boolean` を受け取る。
プリレンダリング時のみ `true` で、それ以外（client のハイドレーション後・server island の描画）は `false`。

```tsx
// routes/feed.tsx
type Props = { _prerender: boolean };

export default function Feed({ _prerender }: Props) {
  if (_prerender) return <FeedSkeleton />;
  // ...
}
```

### ビルドステップの識別

現行の import.meta に query をつけるハックを置き換え、`llyn/runtime` から `isDev` を提供する
ビルド時には定数が埋め込まれるため treeshake される

```ts
// src/main.ts
import { isDev, serveIsland, serveStaticForDev } from "llyn/runtime";

const app = new Hono<Bindings>()
  .use(logger())
  .all("/_islands/*", (c) => serveIsland(c.req.raw))
  .route("/api", apiRoute);

if (isDev) {
  app.all("*", (c) => serveStaticForDev(c.req.raw));
} else {
  app.get("*", serveStatic({ root: "/" }));
}
```

### 生成コード (サーバー)

`llyn/build` の esbuild plugin が `llyn/runtime` を次のような形に差し替える。
不要な island を入れても esbuild の treeshake で削除できるようにする

```ts
import * as React from "react";
import { renderToReadableStream } from "react-dom/server.edge";
import Island_a1b2c3d4 from "/abs/routes/feed.tsx";
import Island_deadbeef from "/abs/routes/contributionHistory.tsx";

export const isDev = false;

export function serveIsland(req: Request): Response {
  const url = new URL(req.url);
  const id = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  const props = { ...Object.fromEntries(url.searchParams), _prerender: false };
  switch (id) {
    case "a1b2c3d4":
      return render(Island_a1b2c3d4, props);
    case "deadbeef":
      return render(Island_deadbeef, props);
    default:
      return new Response("Not Found", { status: 404 });
  }
}
```

### 設定ファイル

```ts
// llyn.config.ts
import { defineConfig } from "llyn/core";

export default defineConfig({
  root: "./routes",
  dist: "./dist",
  documents: ["**/*.html", "**/*.md"], // root 相対
  documentsExclude: ["**/template.html"],
  islands: ["**/*.tsx"],
  islandsExclude: ["components/**/*.tsx"],
  public: "./public", // 静的に提供・ビルド時にコピーされるファイル群 (非 root 相対)
  worker: "./src/main.ts", // (非 root 相対)
});
```

### dev のライブリロード

2 系統を併用する。

- ユーザーのサーバーコード: `deno serve --watch` がプロセスを再起動する
- それ以外: `serveStaticForDev` が `Deno.watchFs` で `root` を監視し、SSE (`/__reload`) でブラウザに通知する。同時に「世代番号」を進め、アイランドの動的 import に `?v=<世代>` を付けてモジュールキャッシュを回避する。

---

## マイルストーン

各マイルストーンの完了時点で `deno task build` / `deno task dev` / `deno check`
/ `deno fmt --check` が 通ることを条件とする（常に動く状態を保つ）。

### M1. `llyn/core` の切り出しと ID のパス化（挙動不変）

- [x] `index.ts` / `processor.ts` / `resources/` / `util/` を `core/` 配下へ移動し、内部 import を整理
- [x] `Island` / `IslandInstance` 型を導入し、`props` を Instance 側へ移す
- [x] `idProvider.ts` を廃止し、specifier から Web Crypto API の SHA-1 ハッシュ（`core/islandId.ts`）を生成。アイランド登録時の衝突検出を入れる
- [x] `domId` を `${id}-${index}` に（同一ページに同じ島を複数置けるようにする）
- [x] 公開 API（`build()` / `startDevServer()`）とビルド出力は変えない

**完了条件**: 出力 HTML の差分が「island の `id` 属性の値」だけになる。

### M2. `llyn/runtime` の再定義と worker API 刷新

- [x] `llyn/runtime` を `isDev`, `serveIsland`, `serveStaticForDev`（この時点では 未実装スタブ）の 3 本に整理し、`renderIsland` は内部化
- [x] アイランド描画時に `_prerender` prop を注入する（prerender では `true`、それ以外は `false`）。`_` 始まりの属性を props から除外する
- [x] `routes/feed.tsx` / `routes/contributionHistory.tsx` を `_prerender` prop 利用へ書き換え
- [x] esbuild plugin を「`llyn/runtime` をモジュールごと差し替える」形に更新
- [x] `src/island.ts` を廃止し、`src/main.ts` から `serveIsland` を直接マウント
- [x] 生成コードを `switch` + 静的 import 形式にし、server island 以外が worker に入らないことを確認

**完了条件**: `dist/worker.js` に client/static
専用アイランドのコードが含まれない （`grep` またはバンドル解析で確認）。

### M3. `llyn.config.ts` と `llyn/build` CLI

- [ ] `core/config.ts`: スキーマ（valibot）、`defineConfig`、cwd からの探索ローダ
- [ ] `core/collect.ts`: documents / islands の glob 収集（同期版・非同期版）
- [ ] `llyn/build/main.ts` を CLI 化。収集 → ドキュメント処理 → 使用島の抽出 → 生成 → esbuild
- [ ] `public` のコピーを build に内蔵
- [ ] ルートに `llyn.config.ts` を追加し、`build.ts` を削除。`deno.json` の task を更新 （`build`: CLI 実行、`cp` の廃止）

**完了条件**: `deno task build` が `llyn.config.ts` だけを設定源として完結する。

### M4. dev ランタイム（`serveStaticForDev`）

- [ ] リクエストパス → ドキュメント解決（`.html` / ディレクトリ index / markdown 由来）
- [ ] ドキュメントの動的レンダリング（prerender・bootstrap 仮想パス・アセット URL 書き換えを含む）
- [ ] クライアント資産の on-demand ビルド（esbuild、メモリキャッシュ、世代番号で無効化）
- [ ] `public` の配信
- [ ] `Deno.watchFs` + SSE `/__reload` とライブリロードスクリプトの注入
- [ ] `src/main.ts` に `if (isDev)` 分岐を追加、`src/static.ts` を廃止
- [ ] `deno task dev` を `deno serve --watch --port=8080 ... src/main.ts` に変更

**完了条件**: dev が `dist` を一切生成せずに動く。`routes/**` の編集がブラウザに自動反映される。

### M5. 仕上げ

- [ ] ページ単位 bootstrap を静的 import + code splitting に切り替え
- [ ] 旧 API（`build()` / `startDevServer()` / `BuildOptions`）と旧ファイルを削除
- [ ] `package/llyn/readme.md` を新設計で全面改訂、`AGENTS.md` / `readme.md` を更新
- [ ] 本番バンドルに dev 依存（parse5 / marked / esbuild / 設定）が入っていないことを最終確認

---

## 検証手順（各マイルストーン共通）

```
deno check
deno fmt --check
```
