# Llyn 実装刷新 計画

現行 Llyn の 3
つの構造的な課題を解消するための設計と、実装マイルストーンをまとめる。

## ゴール

1. **ランタイム実行**: dev
   では生成ファイル（`dist/worker.js`）ではなく、ユーザーのサーバーコードと llyn
   自体を直接実行する。
2. **アイランドの単体ビルド**:
   アイランドは呼び出し側（HTML）の情報なしで解決・ビルド・描画できる。
   呼び出し側が持つ情報（props、配置）は「アイランドインスタンス」側に寄せる。
3. **パスベースの設定**: `build.ts` に散っているファイル収集ロジックを
   `llyn.config.ts` に集約し、 llyn 内蔵の収集器で扱う。

---

## 設計方針（決定事項）

### 実行モデル

|                  | dev                                                                  | build / production                                                                   |
| ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 起動             | `deno serve --watch src/main.ts`（ユーザーの worker をそのまま実行） | `deno -A package/llyn/build/main.ts` → `dist/worker.js` を Cloudflare Workers で実行 |
| `llyn/runtime`   | 実ソースがそのまま動く                                               | esbuild plugin が**モジュールごと**生成コードに差し替える                            |
| ドキュメント     | リクエスト時に動的レンダリング                                       | 事前に静的 HTML を出力                                                               |
| クライアント資産 | リクエスト時に on-demand ビルド（メモリキャッシュ）                  | `dist/static/` へ出力                                                                |
| dist             | 作らない                                                             | 作る                                                                                 |

dev で `dist` を経由しないので、「生成物を実行する」経路は build 専用になる。

### パッケージ境界

- `llyn/runtime`（公開）— サーバーランタイム。`serveIsland` /
  `serveStaticForDev` / `isBuild` /
  `isPrerender`。ビルド時はこのモジュール全体が生成コードに置き換わる。
- `llyn/build`（公開）— ビルドエントリ。CLI (`main.ts`) と esbuild plugin 群。
- `llyn/core`（内部）— 両者の共通部分。設定ローダ、アイランド収集、ID
  算出、コード生成、 ドキュメント処理（parse5 / marked）、prerender。
- 旧 `llyn`（`index.ts` の `build()` / `startDevServer()`）は最終的に削除する。

### アイランドとインスタンス

```ts
// llyn/core
type IslandKind = "client" | "server" | "static";

type Island = {
  id: string; // specifier から算出（後述）
  specifier: string; // root からの相対パス "routes/feed.tsx"
  url: URL; // 絶対 file URL（dev / build のみ）
};

type IslandInstance = {
  island: Island;
  kind: IslandKind; // 呼び出し側の <script type> で決まる
  domId: string; // `${island.id}-${index}`（同一ページ内で一意）
  props: Record<string, string>; // 呼び出し側の属性
};
```

- **Island** は単体で成立する。ファイルパスだけから ID・ビルド・描画ができる。
- **Instance** は「Island + props + 配置」。prerender・bootstrap・server island
  の fetch URL 生成は すべて Instance の仕事。
- 種別（client/server/static）は呼び出し側指定のまま維持する（同じアイランドを別種別で使い回せる）。

### アイランド ID

- `id = hash(specifier)` の短縮 16 進（8
  桁）。**同期実行できる非暗号ハッシュ**（FNV-1a 32bit 等）を使う。 dev
  の同期パス解決（`expandGlobSync`）で
  ID→パスの逆引きを行うため、`crypto.subtle`（非同期）は使わない。
- ビルド間で安定するので、`/_islands/<id>` の URL がビルドのたびに変わらない。
- 収集時に衝突を検出したらビルドを失敗させる（メッセージに衝突した 2 つの
  specifier を出す）。

### props の受け渡し

- 型は `Record<string, string>` のまま（HTML 属性由来）。
- client island: bootstrap のコードに JSON リテラルとして埋め込む。
- server island: `/_islands/<id>?<props をクエリ文字列展開>` で渡す。
- static island: ビルド時に描画して埋め込むだけなので runtime には出ない。

> **注意**: server island の props
> はクライアントから任意に指定できる外部入力になる。 アイランド側は未知・不正な
> props で落ちないよう防御的に書く。将来必要になれば
> `export const propsSchema`（valibot）を任意で受け付ける拡張余地を残す。

### prerender の識別

prerender は「ビルド時」と「dev の動的ビルド時」に起きる。dev
では同一プロセス内で prerender
とサーバー描画の両方が走るため、モジュール定数だけでは区別できない。 そこで
**prerender 時だけ別モジュールインスタンスを使う**：

- llyn は prerender 時に `import(`${url}?llyn-prerender`)`
  で別インスタンスを読み込む。
- アイランド側はクエリの存在を知らず、`isPrerender(import.meta)` を呼ぶだけ。

```ts
// アイランド側の書き方（現行の import.meta.url ハックを置き換える）
import { isPrerender } from "llyn/runtime";

export default function Feed() {
  if (isPrerender(import.meta)) return <Fallback />;
  return (
    <Suspense fallback={<Fallback />}>
      <FeedBody />
    </Suspense>
  );
}
```

- 本番 worker では prerender は起きないので、生成コードでは
  `isPrerender = () => false` となり、 分岐ごと treeshake される。
- 別インスタンスなのでモジュールスコープの状態は二重化する（副作用のあるトップレベル初期化に注意）。

### `isBuild`

`llyn/runtime` は `isBuild: boolean` を公開する。ソースのままなら
`false`、生成コードでは `true`。 ユーザーはこれで dev 専用経路を切り分ける。

```ts
// src/main.ts
import { isBuild, serveIsland, serveStaticForDev } from "llyn/runtime";

const app = new Hono<Bindings>()
  .use(logger())
  .all("/_islands/*", (c) => serveIsland(c.req.raw))
  .route("/api", apiRoute);

if (!isBuild) {
  app.all("*", (c) => serveStaticForDev(c.req.raw));
}
```

`isBuild` が定数 `true` に畳まれることで、`serveStaticForDev` とその依存（parse5
/ marked / esbuild / 設定ローダ）は本番バンドルから完全に消える。

### ランタイム API

```ts
// llyn/runtime
export const isBuild: boolean;
export function isPrerender(meta: ImportMeta): boolean;

// アイランドのルーター。/_islands/<id>?<props> を処理する。
// 未知の ID は 404。描画は非同期だが body をストリームで返すためシグネチャは同期。
export function serveIsland(req: Request): Response;

// dev 専用。ドキュメント・クライアント資産・public・ライブリロードを処理する。
export function serveStaticForDev(req: Request): Promise<Response>;
```

- `serveIsland` は dev では設定を cwd から自動探索し、islands glob
  を同期スキャンして ID を逆引きする
  （結果はキャッシュし、ウォッチャの世代番号で無効化）。
- 本番では生成コードに置き換わり、静的 import + `switch`
  になるため探索もファイルシステムも不要。

### 生成コード（treeshake 可能な形）

`llyn/build` の esbuild plugin が `llyn/runtime` を次の形に差し替える。

```ts
import * as React from "react";
import { renderToReadableStream } from "react-dom/server.edge";
// サイト内で server island として使われているものだけを静的 import
import Island_a1b2c3d4 from "/abs/routes/feed.tsx";
import Island_deadbeef from "/abs/routes/contributionHistory.tsx";

export const isBuild = true;
export const isPrerender = () => false;

export function serveIsland(req: Request): Response {
  const url = new URL(req.url);
  const id = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  const props = Object.fromEntries(url.searchParams);
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

これで treeshake の 4 目的を満たす。

1. worker に不要な島を入れない — client/static としてしか使われない島は import
   されない。
2. ページ単位でクライアント JS を最小に — ページごとの bootstrap
   仮想ファイルがそのページの島だけを 静的 import する（React 等は code
   splitting で共有チャンクへ）。
3. サイト内で未使用の島を落とす — glob
   で収集した島のうち、ドキュメント走査で参照が確認できたものだけを
   生成コードに載せる。
4. ビルド専用コードの除去 — `llyn/runtime` がモジュールごと差し替わるので、dev
   実装は依存ごとバンドルに入らない。

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
  public: "./routes/public",
  worker: "./src/main.ts",
});
```

- 探索: `llyn/core` のローダが cwd から上へ `llyn.config.ts` を探して動的 import
  する （dev と build のみ。本番 worker には入らない）。
- markdown のテンプレートは現行どおり「同ディレクトリの
  `template.html`」の規約固定。
- URL 規則は現行維持（`routes/blog/test.md` → `/blog/test.html`、ディレクトリは
  `index.html`）。
- `public` は llyn が扱う（dev は直接配信、build は `dist/static/`
  へコピー）。`deno task` の `cp` は廃止。

### dev のライブリロード

2 系統を併用する。

- **ユーザーのサーバーコード**（`src/**`）: `deno serve --watch`
  がプロセスを再起動する。
- **ドキュメント・アイランド・CSS**（`routes/**`）: モジュールグラフ外なので
  Deno は検知しない。 `serveStaticForDev` が `Deno.watchFs` で `root`
  を監視し、SSE (`/__reload`) でブラウザに通知する。
  同時に「世代番号」を進め、アイランドの動的 import に `?v=<世代>`
  を付けてモジュールキャッシュを回避する。

---

## マイルストーン

各マイルストーンの完了時点で `deno task build` / `deno task dev` / `deno check`
/ `deno fmt --check` が 通ることを条件とする（常に動く状態を保つ）。

### M1. `llyn/core` の切り出しと ID のパス化（挙動不変）

- [ ] `index.ts` / `processor.ts` / `resources/` / `util/` を `core/`
      配下へ移動し、内部 import を整理
- [ ] `Island` / `IslandInstance` 型を導入し、`props` を Instance 側へ移す
- [ ] `idProvider.ts` を廃止し、specifier
      からの同期ハッシュ（`core/islandId.ts`）に置換。衝突検出を入れる
- [ ] `domId` を `${id}-${index}` に（同一ページに同じ島を複数置けるようにする）
- [ ] 公開 API（`build()` / `startDevServer()`）とビルド出力は変えない

**完了条件**: 出力 HTML の差分が「island の `id` 属性の値」だけになる。

### M2. アイランドの単体化（呼び出し側情報の剥離）

- [ ] `isPrerender(import.meta)` を `llyn/runtime` に追加。llyn 側の prerender
      は `?llyn-prerender` 付き import に統一
- [ ] `routes/feed.tsx` / `routes/contributionHistory.tsx` を `isPrerender`
      利用へ書き換え
- [ ] bootstrap 生成を Instance ベースに変更（client は props
      をリテラル埋め込み、 server は `/_islands/<id>?<props>` を fetch）
- [ ] worker 側 renderIsland 生成を「ID → コンポーネント」に変更（props
      は実行時にクエリから）
- [ ] prerender / server 描画で同じ props 解釈になることを確認

**完了条件**:
アイランドのソースが呼び出し側の存在を前提にしない。`/_islands/<id>?a=1` を
直接叩いて描画できる。

### M3. `llyn/runtime` の再定義と worker API 刷新

- [ ] `llyn/runtime` を `isBuild` / `isPrerender` / `serveIsland` /
      `serveStaticForDev`（この時点では 未実装スタブ）の 4
      本に整理し、`renderIsland` は内部化
- [ ] esbuild plugin を「`llyn/runtime` をモジュールごと差し替える」形に更新し、
      `isBuild = true` を出力
- [ ] `src/island.ts` を廃止し、`src/main.ts` から `serveIsland` を直接マウント
- [ ] 生成コードを `switch` + 静的 import 形式にし、server island 以外が worker
      に入らないことを確認

**完了条件**: `dist/worker.js` に client/static
専用アイランドのコードが含まれない （`grep` またはバンドル解析で確認）。

### M4. `llyn.config.ts` と `llyn/build` CLI

- [ ] `core/config.ts`: スキーマ（valibot）、`defineConfig`、cwd
      からの探索ローダ
- [ ] `core/collect.ts`: documents / islands の glob 収集（同期版・非同期版）
- [ ] `llyn/build/main.ts` を CLI 化。収集 → ドキュメント処理 → 使用島の抽出 →
      生成 → esbuild
- [ ] `public` のコピーを build に内蔵
- [ ] ルートに `llyn.config.ts` を追加し、`build.ts` を削除。`deno.json` の task
      を更新 （`build`: CLI 実行、`cp` の廃止）

**完了条件**: `deno task build` が `llyn.config.ts` だけを設定源として完結する。

### M5. dev ランタイム（`serveStaticForDev`）

- [ ] リクエストパス → ドキュメント解決（`.html` / ディレクトリ index / markdown
      由来）
- [ ] ドキュメントの動的レンダリング（prerender・bootstrap 仮想パス・アセット
      URL 書き換えを含む）
- [ ] クライアント資産の on-demand
      ビルド（esbuild、メモリキャッシュ、世代番号で無効化）
- [ ] `public` の配信
- [ ] `Deno.watchFs` + SSE `/__reload` とライブリロードスクリプトの注入
- [ ] `src/main.ts` に `if (!isBuild)` 分岐を追加、`src/static.ts` を廃止
- [ ] `deno task dev` を `deno serve --watch --port=8080 ... src/main.ts` に変更

**完了条件**: dev が `dist` を一切生成せずに動く。`routes/**`
の編集がブラウザに自動反映される。

### M6. 仕上げ

- [ ] ページ単位 bootstrap を静的 import + code splitting
      に切り替え、共有チャンクを確認
- [ ] 旧 API（`build()` / `startDevServer()` /
      `BuildOptions`）と旧ファイルを削除
- [ ] `package/llyn/readme.md` を新設計で全面改訂、`AGENTS.md` / `readme.md`
      を更新
- [ ] 本番バンドルに dev 依存（parse5 / marked / esbuild /
      設定）が入っていないことを最終確認

---

## 検証手順（各マイルストーン共通）

```
deno check
deno fmt --check
deno task build && deno task serve   # / と /blog/*.html、/_islands/<id> を確認
deno task dev                        # 同上 + routes を編集してリロードを確認
```

## 残課題・リスク

- **server island の props が外部入力になる**:
  現状は無検証。異常値でクラッシュしないことを アイランド側の責務とする。将来
  `propsSchema` の任意サポートを検討。
- **prerender の別インスタンス化**:
  モジュールスコープの副作用が二重に走る。トップレベルで
  接続やグローバル登録を行うアイランドは注意が必要。
- **dev のモジュールキャッシュ**: `?v=<世代>` 方式は編集のたびに Deno
  のモジュールキャッシュへ エントリが積まれる。長時間の dev
  セッションでメモリが増えるが、実用上は許容とする。
- **static island の dev コスト**:
  リクエストごとに実行されるため、`routes/blog/index.tsx` の `fs.walk`
  が毎回走る。遅くなるようなら世代番号でメモ化する。
- **ハッシュ衝突**: 非暗号ハッシュ 32bit
  のため理論上は衝突しうる。収集時に検出して失敗させる。
