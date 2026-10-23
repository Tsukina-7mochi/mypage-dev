# Llyn 実装刷新 計画

## ゴール

1. ランタイム実行
   - dev でも prod と同じく、フルビルドで生成した `dist/worker.js` を `deno serve` で実行する。インクリメンタルビルドは行わない。
   - dev と prod の違いはビルドのオプション（最適化の有無、ライブリロードの有無）だけにする。
   - ファイルの監視は llyn の関心外とし、`deno run --watch` / `deno serve --watch` に任せる。
2. アイランドの単体ビルド
   - アイランドは呼び出し側（HTML）の情報なしで解決・ビルド・描画できる。
   - 呼び出し側が持つ情報（props、配置）はランタイムで与える
3. パスベースの設定
   - `build.ts` に散っているファイル収集ロジックを `llyn.config.ts` に集約し、 llyn 内蔵の収集器で扱う。
   - アイランドは設定で列挙せず、documents から収集する。

## 設計方針

### パッケージ境界

- `llyn/runtime`（公開）
  - ランタイムで用いる関数を提供する
    - `serveIsland`: `(req: Request): Promise<Response>`
    - `serveLiveReload`: `(req: Request): Response`
  - ソースのモジュールは宣言だけで、呼ぶと例外を投げる。esbuild によってモジュール全体が生成コードに置き換わる。ユーザーコードに dev と prod の分岐を持たせない
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
  specifier: string; // root からの相対パスを path.normalize したもの・区切り文字を `/` に置換
  url: URL; // 絶対 file URL
};

type IslandInstance = {
  island: Island;
  kind: IslandKind;
  domId: string; // ページ内で一意な ID
  props: Record<string, string>; // script タグの残余 attributes
};
```

- アイランドは documents の script タグから収集する。root 外を指していても llyn は制限しない。
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

### ユーザーのサーバーコード

ユーザーコードは dev と prod で同一で、常にバンドルされた `dist/worker.js` として実行される。

```ts
// src/main.ts
import { serveIsland, serveLiveReload } from "llyn/runtime";

const app = new Hono<Bindings>()
  .use(logger())
  .all("/_islands/*", (c) => serveIsland(c.req.raw))
  .get("/__reload", (c) => serveLiveReload(c.req.raw))
  .route("/api", apiRoute);
```

静的ファイルは worker の位置から `static/` を既存の `src/static.ts`（`hono/deno` の `serveStatic`）で配信する。

### dev ビルド

- `llyn/core/main.ts --dev --live-reload` でビルドする
  - `--dev`: minify せず、source map を inline にする
  - `--live-reload`: HTML にライブリロードスクリプトを注入し、生成コードの `serveLiveReload` にビルド ID を埋め込む
- 古い成果物は削除しない
- `deno task dev` は `deno run --watch=routes/,src/,llyn.config.ts` でビルドし、並行して `deno serve --watch=dist/` で `dist/worker.js` を配信する

### dev のライブリロード

- `serveLiveReload` は接続時に SSE でビルド ID（ビルドごとに生成する乱数）を一度だけ送る。`--live-reload` なしのビルドでは 404 を返す
- クライアントは最初に受け取ったビルド ID を保持し、再接続後に異なる ID を受け取ったら reload する

### 生成コード (サーバー)

`llyn/build` の esbuild plugin が `llyn/runtime` を次のような形に差し替える。
不要な island を入れても esbuild の treeshake で削除できるようにする

```ts
import * as React from "react";
import { renderToReadableStream } from "react-dom/server.edge";
import Island_a1b2c3d4 from "/abs/routes/feed.tsx";
import Island_deadbeef from "/abs/routes/contributionHistory.tsx";

const bootId: string | undefined = "<build id>"; // --live-reload なしでは undefined

export function serveLiveReload(): Response {
  // bootId がなければ 404、あれば SSE で bootId を送る
}

export function serveIsland(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  const props = { ...Object.fromEntries(url.searchParams), _prerender: false };
  switch (id) {
    case "a1b2c3d4":
      return render(Island_a1b2c3d4, props);
    case "deadbeef":
      return render(Island_deadbeef, props);
    default:
      return Promise.resolve(new Response("Not Found", { status: 404 }));
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
  public: "./public", // 静的に提供・ビルド時にコピーされるファイル群 (非 root 相対)
  worker: "./src/main.ts", // (非 root 相対)
});
```

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

- [x] `core/config.ts`: スキーマ（valibot）、`defineConfig`、cwd 直下からの設定ローダ
- [x] `core/collect.ts`: documents / islands の非同期 glob 収集
- [x] `llyn/build/main.ts` を CLI 化。収集 → ドキュメント処理 → 使用島の抽出 → 生成 → esbuild
- [x] `public` のコピーを build に内蔵
- [x] ルートに `llyn.config.ts` を追加し、`build.ts` を削除。`deno.json` の task を更新 （`build`: CLI 実行、`cp` の廃止）

**完了条件**: `deno task build` が `llyn.config.ts` だけを設定源として完結する。

### M4. アイランド収集の documents 起点化

- [x] config スキーマから `islands` / `islandsExclude` を削除し、`llyn.config.ts` を更新
- [x] documents の script タグからアイランドを収集する。specifier は root からの相対パスを `path.normalize` したもの（区切り文字は `/`）。root 外も制限しない
- [x] id の衝突検出を維持する

**完了条件**: `deno task build` の出力が M3 時点と変わらない。

### M5. dev ランタイム

- [x] `llyn/runtime` から `isDev` / `serveStaticForDev` を削除し、`startDevBuild` / `serveLiveReload` を追加。prod の置き換えはそれぞれ `async () => undefined` / 404 を返す関数
- [x] `startDevBuild`: `loadConfig()`、client のみの dev フルビルド（ライブリロードスクリプト注入）、`DevContext` を返す。失敗時は例外をそのまま投げる
- [x] `serveIsland(req, ctx)` の dev 実装: `ctx` からソースを引き、動的 import して描画
- [x] `serveLiveReload`: 起動 ID を SSE で送る。クライアントスクリプトを起動 ID 比較方式に更新
- [x] `src/main.ts` を `await startDevBuild()` 利用に更新し、`deno task dev` を `deno serve --watch=routes/ ... src/main.ts` に変更
- [x] 旧 dev 基盤を削除（`startBuildServer`、`llyn/build` CLI の `--dev`、`core/util/stream.ts`、core の `startDevServer`）
- [x] `--watch=<paths>` がモジュールグラフに加えて指定パスも監視することを確認
- [x] prod の worker に残る top-level の `await startDevBuild()` が Cloudflare Workers で問題ないことを確認

**完了条件**: `deno task dev` が `deno serve` で起動し、`routes/**` の編集がブラウザに自動反映される。ビルド失敗時も修正後に復帰する。

### M6. 仕上げ

- [x] ページ単位 bootstrap を静的 import + code splitting に切り替え
- [x] 旧 API（`build()` / `BuildOptions`）と旧ファイルを削除
- [x] `package/llyn/readme.md` を新設計で全面改訂、`AGENTS.md` / `readme.md` を更新
- [x] 本番バンドルに dev 依存（parse5 / marked / esbuild / 設定）が入っていないことを最終確認

### M7. dev を生成した worker で実行する

- [x] `runBuild` を `esbuild.build` の 1 回呼び出しに整理
- [x] `BuildOptions` を `{ dev, liveReload }` にし、worker を常にバンドルする。CLI に `--dev` / `--live-reload` を追加
- [x] 生成コードの `serveLiveReload` がビルド ID を SSE で送る
- [x] dev 実装（`startDevBuild`、`DevContext`、動的 import の `serveIsland`）を削除し、`llyn/runtime` を宣言だけにする
- [x] `src/main.ts` と `deno task dev` を更新

**完了条件**: `deno task dev` で `routes/**` の編集がブラウザに自動反映される。

---

## 検証手順（各マイルストーン共通）

```
deno check
deno fmt --check
```
