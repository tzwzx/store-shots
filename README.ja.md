# store-shots

[English](https://github.com/tzwzx/store-shots/blob/main/README.md) | 日本語

[![npm version](https://img.shields.io/npm/v/@tzwzx/store-shots.svg)](https://www.npmjs.com/package/@tzwzx/store-shots) [![license](https://img.shields.io/npm/l/@tzwzx/store-shots.svg)](./LICENSE)

**ライブプレビューがそのまま最終出力になる** App Store スクリーンショット生成エンジンです。

ライブプレビューサーバー（ブラウザで開いても、Playwright で操作しても OK）と最終 PNG（ヘッドレス Chrome でレンダリング）は、**同じ `/slide/:id` ルート**から生成されます。つまり、見たままのものがそのまま提出物になり、プレビューと提出画像の間にズレは存在しません。

- **ランタイム依存ゼロ** — Bun のビルトインと外部の Chrome だけで動きます。
- **見た目は完全に自由** — テンプレートはあなたのもの。エンジンが知っているのは `slide.id` だけです。

---

## 出力サンプル

<p>
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-1.png" width="195" alt="サンプルスライド: Everything in one place" />
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-2.png" width="195" alt="サンプルスライド: Thought it? Captured." />
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-3.png" width="195" alt="サンプルスライド: Beautiful after dark" />
  <img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/showcase-4.png" width="195" alt="サンプルスライド: アプリアイコンのクロージングスライド" />
</p>

この 4 枚の PNG は、架空の ToDo アプリを題材に `runBuild` がそのまま出力したものです（[`examples/showcase`](examples/showcase) 参照）。デバイスフレーム内の「アプリのスクリーンショット」は、テンプレート内の HTML/CSS だけで描かれています。アプリもシミュレーターも画像アセットも不要です。`bun examples/showcase/index.ts build` で再現できます。

ホットリロード対応のプレビューギャラリー（`bun examples/showcase/index.ts preview`）では、各スライドがオプションの仕様テーブルと並んで表示されます。これは提出物と完全に同一のレンダリングです：

<img src="https://raw.githubusercontent.com/tzwzx/store-shots/main/docs/images/preview-gallery.png" width="820" alt="仕様テーブル付きプレビューギャラリー" />

---

## 核となる考え方

エンジンとコンテンツは責務を厳密に分担します。まずこれを理解すれば、あとはすべて自然に導かれます：

```
your project
├─ store-shots/       ← あなたが所有。プロジェクトルートの 1 フォルダに集約
│  ├─ RUNBOOK.md               エージェント用ランブック: プレビューループ + アセット撮影手順
│  ├─ content/
│  │  ├─ config.ts              データ:  スライド一覧 + キャンバスサイズ
│  │  ├─ template.ts            見た目:  renderSlideHtml(slide) → 完全な HTML 文字列
│  │  ├─ index.ts               接着剤:  上記をひとつの `content` オブジェクトに束ねる
│  │  └─ assets/                ctx.asset(...) でテンプレートから参照する画像
│  ├─ index.ts                 小さな CLI: `preview` | `build`
│  └─ output/                  生成された PNG（gitignore 推奨）
└─ node_modules/@tzwzx/store-shots    ← エンジン（このパッケージ）。/slide/:id を配信して撮影する。
                                 知っているのは `slide.id` だけ。データの形は一切見ない。
```

フォルダ名は自由です。このガイドではプロジェクトルートの `store-shots/` に統一しています。配置の仕組みは[どこに置くか](#どこに置くか)を参照してください。

エンジンが提供するのは 2 つの関数 — `runPreview` と `runBuild` — といくつかの型だけ。あなたが渡すのはひとつの `content` オブジェクトだけ。契約はそれがすべてです。

> **黄金律:** `renderSlideHtml` が唯一のレンダリングポイントです。プレビューのサムネイルも、単体表示も、最終 PNG もすべてこれを呼びます。ズレの原因になる第 2 の「サムネイル用」コードパスは存在しません。

---

## 動作要件

- **Bun 1.3+ — store-shots は Bun 専用パッケージです。** TypeScript ソースをそのまま同梱し、Bun が直接実行します（ビルドステップなし）。Node.js（`node` / `npx`）では動きません。
- Chrome 系ブラウザ（Chrome / Chromium / Edge — macOS・Linux・Windows の一般的なインストール場所を自動検出）。別のバイナリを使う場合は環境変数 `CHROME_PATH` で指定できます（CI やカスタム配置で便利です）。

### 利用側プロジェクトの TypeScript 設定

エンジンは `.ts` ソースを同梱するため、あなたのプロジェクトの `tsconfig.json` がコンテンツと一緒にエンジンも型チェックします。次の条件でクリーンにコンパイルできます：

- `moduleResolution` が `"bundler"`（Bun のデフォルト。最近の Expo / Vite プリセットでも一般的）
- `target` / `lib` が **ES2021 以降**を含む（`replaceAll`、トップレベル await）
- `types` に `"bun"`（または `"bun-types"`）を含む — 生成される CLI が `import.meta.dir` を使うため

ホストプロジェクトが互換性のない設定（例: `moduleResolution: "node16"`）を維持する必要がある場合は、`tsconfig.json` に `"exclude": ["store-shots"]` を追加し、フォルダ単体はネストした tsconfig で型チェックしてください。

その他のツールチェーン補足：

- 未使用依存チェッカー（fallow、knip、depcheck）は、`@tzwzx/store-shots` が `package.json` の scripts からしか参照されないため未使用と誤検知することがあります — ignore リストに追加してください。
- コンテンツフォルダ配下に追加したテストは `bun test` で動きます。メインのテストランナーが Jest の場合は、CI への組み込みを明示的に行ってください。

## インストール

```sh
bun add -D -E @tzwzx/store-shots
```

---

## クイックスタート

エンジンをインストールし、スターターをプロジェクトに scaffold します：

```sh
bun add -D -E @tzwzx/store-shots   # エンジン本体（runPreview / runBuild）
bunx store-shots init              # store-shots/ を scaffold + npm scripts を追加
```

`init` は `store-shots/` 配下に動作するスターター（データ、テンプレート、CLI、`RUNBOOK.md`、`assets/` フォルダ）を生成し、`package.json` に `store:preview` / `store:build` を追加し、`.claude/commands/store-shots.md`（エージェントを `RUNBOOK.md` に誘導する Claude Code スラッシュコマンド）を生成します。既存ファイルは決して上書きしません — 上書きするには `--force`、`package.json` の編集をスキップするには `--no-scripts`、スラッシュコマンドをスキップするには `--no-command`、別のフォルダ名にするには `bunx store-shots init <dir>` を使います。

パイプラインの動作をすぐに確認できます — 実際のスクリーンショットを追加するまではプレースホルダーがレンダリングされます：

```sh
bun run store:build            # output/*.png（1320x2868）+ output/index.html を出力
bun run store:preview          # http://localhost:4317 でライブプレビュー
bun run store:build 1 2        # 特定のスライド id だけビルド
```

あとは自分のものにしていくだけ：`content/config.ts`（コピーとスライド一覧）と `content/template.ts`（見た目）を編集し、`content/assets/` にスクリーンショットを置きます。[オーサリングガイド](#オーサリングガイド)を参照してください。

---

## AI エージェントと使う

store-shots は AI コーディングエージェントに運転させる前提で設計されています。Claude Code には出来合いのコマンドが付属し、他のエージェントも `RUNBOOK.md` 経由で同じループを回せます。

### Claude Code

Claude Code なら、ワークフロー全体は次のとおりです：

```sh
bun add -D -E @tzwzx/store-shots   # 1. エンジンをインストール
bunx store-shots init              # 2. scaffold（/store-shots コマンドも生成される）
```

```text
/store-shots                              # 3. Claude Code 内でループを実行
```

`init` が `.claude/commands/store-shots.md` を書き出すので、`/store-shots` はエージェントを `store-shots/RUNBOOK.md` に誘導し、あとはエージェントが引き受けます：プレビューを起動し、ギャラリーをレビューし、`config.ts` / `template.ts` を改善し、ランブックに従って起動中のシミュレーターから不足アセットを撮影し、`store:build` で仕上げます。引数を渡せば作業範囲を絞れます：

```text
/store-shots recapture screen-c (jp)
/store-shots rewrite the copy on slide 2
```

ループがうまく回るコツは 2 つ：

1. **`RUNBOOK.md` を最初に一度埋める** — デザインブリーフ（ターゲット・トーン・ストーリー構成・OCR キーワード）、シミュレーターのデバイス、テスト ID、画面ごとの撮影手順。ランブックはエージェントが従う契約書です。具体的であるほどエージェントは聞き返さなくなり、デザインブリーフがエージェントのビジュアル判断をブランドに沿わせます。
2. **コピーを `config.ts` に集約する** — エージェントが文言とレイアウトを別々に反復でき、ギャラリーの仕様テーブルでレンダリングされたテキストを突合できます。

### その他のエージェント（Cursor、Codex、Gemini CLI など）

`/store-shots` コマンドの実体は `RUNBOOK.md` へのポインタにすぎません — ファイルを読めるエージェントなら何でも同じループを回せます。ツールが毎セッション読み込むファイル（`AGENTS.md`、Cursor のルール、`GEMINI.md` など）に一言追加してください：

> Store screenshots live in `store-shots/`. For any request about them, read `store-shots/RUNBOOK.md` and follow it end to end (preview → critique → refine → capture → build).

プロジェクトをゼロから scaffold する場合は、代わりに [AI エージェント向けチェックリスト](#ai-エージェント向けチェックリスト)をエージェントに渡してください。

---

## どこに置くか

`store-shots init` は**プロジェクトルート**にこのレイアウトをそのまま scaffold します。すべてが**専用の 1 フォルダ**に収まるので、アプリのソースと絡まることがありません。このガイドではパッケージ名に合わせて `store-shots/` に統一していますが、名前は自由です — `bunx store-shots init <dir>` で指定できます：

```
store-shots/
  RUNBOOK.md         エージェント用ランブック: プレビューループ + アセット撮影手順（Maestro）
  content/
    config.ts        データ:   Slide 型、slides[]、canvas
    template.ts      見た目:   renderSlideHtml(slide, ctx) → HTML
    index.ts         接着剤:   StoreShotsContent オブジェクト
    assets/          画像:     ctx.asset("relative/path.png") で参照
      icon.png
      jp/screen-a.png
      en/screen-a.png
  index.ts           CLI:      preview | build
  output/            生成物:   *.png + index.html（gitignore 推奨）
```

**専用フォルダにする理由:** 生成される `output/` を gitignore しやすく、エンジンの配線がアプリのソースツリーに混ざらず、ツール全体の移動や削除が簡単だからです。

**どこに置いても動きます** — 場所にハードコードされたものはありません。配置を決めるのは次の 3 つだけです：

| 何が | どこで設定 | 方法 |
| --- | --- | --- |
| アセットの元ディレクトリ | `content/index.ts` の `assetsDir` | `join(import.meta.dir, "assets")` — `content/` と一緒に移動 |
| PNG の出力先 | CLI の `outputDir` | `join(import.meta.dir, "output")` — CLI と一緒に移動 |
| CLI エントリのパス | `package.json` の `store:*` scripts | 唯一の絶対参照 |

`assetsDir` / `outputDir` は `import.meta.dir` 起点の相対パスなので、フォルダ全体を移動しても更新が必要なのは `package.json` のスクリプトパスだけです。

> すでに別のパス（例: 従来の `scripts/store-shots/`）に置いている場合も、そのまま動きます — `package.json` の `store:*` スクリプトのパスが合ってさえいれば OK です。

---

## オーサリングガイド

`init` が動くスターターをくれるので、ここでの作業は「自分のものにする」ことです：**生成された `content/config.ts` と `content/template.ts` を編集する**のであって、ゼロから作るのではありません。

### 1. `content/config.ts` — あなたのデータ

- `Slide` は**必ず** `SlideBase` を継承します（つまり文字列の `id` を持つ）。それ以外はすべて自由：言語、背景色、見出しテキスト、バッジなど、テンプレートに必要なものを何でも。
- `canvas` は出力ピクセルサイズです。すべての PNG は正確に `canvas.width × canvas.height` で出力されます。
- `slides` は順序付きリストです。各 `id` がルート `/slide/<id>` とファイル `<id>.png` になります。
- コピーとレイアウトデータの唯一の情報源として `config.ts` を保ちましょう。デザイナーでなくても、テンプレートに触れずに文言を編集できます。

### 2. `content/template.ts` — あなたの見た目

`renderSlideHtml(slide, ctx)` は 1 スライド分の**完全な HTML ドキュメント**（`<!doctype html>` から始まる）を返します。Tips：

- キャンバスサイズのルート要素（`width: ${canvas.width}px; height: ${canvas.height}px; overflow: hidden`）で全体を包みます。はみ出した部分は切り取られます。
- 画像は必ず `ctx.asset(relPath)` で解決します — `/assets/...` をハードコードしてはいけません。戻り値は `{ exists, url }` です。`exists` を使ってプレースホルダーを描けば、アートが揃う前にレイアウトをレビューできます。
- スクリーンショットには `object-fit: cover` を使うと、ソースのアスペクト比が多少違ってもデバイスフレームが埋まったままになります。
- Chrome がレンダリングする素の HTML/CSS です — flexbox、グラデーション、`transform`、Web フォント、SVG がすべて使えます。

### 3. `content/assets/` — あなたの画像

- エンジンはこのディレクトリを `/assets/*` で配信し、ファイルの存在をチェックします。**ファイル名は完全に自由**です — `ctx.asset(...)` に渡す `relPath` と一致してさえいれば OK。
- 慣例の例: `ctx.asset(`${slide.lang}/screen-${slide.screen}.png`)` ⇒ ファイルは `assets/jp/screen-a.png`、`assets/en/screen-a.png` などに配置。
- ファイルがなくても大丈夫：テンプレートが描くプレースホルダーとしてレンダリングされます。
- **スクリーンショットの作り方:** `init` がリファレンスワークフロー入りの `RUNBOOK.md` を scaffold します — 起動済み iOS シミュレーター + AI エージェントが直接操作する Maestro（パッケージに専用撮影スクリプトはありません）。あなたのアプリのテスト ID と画面ごとの手順に合わせてランブックを編集するか、プラットフォームに合わせて書き換えてください（Android エミュレーター、Web なら Playwright、手動撮影など）。完成した PNG を `assets/` に置きます。

### 4 & 5. `content/index.ts` と CLI

`init` が生成済みで、ほぼ触ることはありません。`content/index.ts` は各ピースを `StoreShotsContent` に束ね、CLI は `preview` / `build` を `runPreview` / `runBuild` にマップします。

---

## アセットワークフロー

```
1. 生成された config.ts + template.ts を編集（プレースホルダー分岐は最初から入っています）。
2. bun run store:preview  → http://localhost:4317 を開き、レイアウトとコピーを推敲（ホットリロード）。
3. RUNBOOK.md に従って実スクリーンショットを撮影（シミュレーター + Maestro）→ content/assets/ へ。
4. プレビューを更新して、実際のアートがフレームに収まっているか確認。
5. bun run store:build    → output/*.png（これを提出）+ output/index.html（コンタクトシート）。
```

プレビューとビルドはひとつのレンダリングパスを共有しているので、ステップ 5 は必ずステップ 4 で見たものと一致します。

---

## API リファレンス

```typescript
import { runPreview, runBuild, CANVAS, expandSlides } from "@tzwzx/store-shots";
import type {
  StoreShotsContent,
  SlideBase,
  RenderContext,
  Asset,
  Canvas,
  SpecRow,
} from "@tzwzx/store-shots";
```

| Export | シグネチャ | 説明 |
| --- | --- | --- |
| `runPreview(content, { port })` | `→ void` | ホットリロード対応のプレビューサーバーを起動します。 |
| `runBuild(content, { ids, outputDir, concurrency? })` | `→ Promise<void>` | スライドを `outputDir` に撮影します（デフォルトで最大 4 つの Chrome を並列実行）。`ids` が空なら全スライド。未知の id はエラー。すべての PNG が正確に `canvas` サイズであることを検証します。 |
| `CANVAS` | キャンバスプリセット | `iphone69`（1320×2868）、`iphone69Alt`（1290×2796）、`iphone65`（1242×2688）、`ipad13`（2064×2752）。任意のカスタムサイズも使えます — Google Play は幅広いサイズを受け付けます。 |
| `expandSlides(langs, seeds, build)` | `→ TSlide[]` | 言語非依存のシードを言語ごとのスライドに展開します（レシピ参照）。 |
| `SlideBase` | `{ id: string }` | エンジンがスライドに要求する最小限。id は一意である必要があります — 重複はエンジンが拒否します。 |
| `Canvas` | `{ height, width }` | 出力ピクセルサイズ。 |
| `Asset` | `{ exists, url, width?, height? }` | `ctx.asset` の戻り値。`width` / `height` はファイルが実在する PNG のときの固有ピクセルサイズで、クロップ計算に便利です。 |
| `RenderContext` | `{ asset(relPath) → Asset }` | `renderSlideHtml` に渡されます。 |
| `SpecRow` | `{ label: string; value: string }` | ギャラリーのオプション仕様テーブルの 1 行。 |
| `StoreShotsContent<TSlide>` | 下記参照 | あなたが提供するオブジェクト。 |

```typescript
interface StoreShotsContent<TSlide extends SlideBase> {
  canvas: Canvas; // e.g. CANVAS.iphone69, or any custom size
  assetsDir: string; // absolute path served at /assets/*
  slides: TSlide[];
  renderSlideHtml(slide: TSlide, ctx: RenderContext): string;
  specPanel?(slide: TSlide): SpecRow[]; // optional spec table in the gallery
}
```

### オプションヘルパー（サブパス export）

| Import 元 | Export | 説明 |
| --- | --- | --- |
| `store-shots/html` | `escapeHtml(text)` | `& < > " '` を HTML エスケープして安全に補間します。 |
| `store-shots/html` | `accentHtml(line, accent)` | 行をエスケープし、`accent` のすべての出現を `<span class="accent">` で包みます。 |
| `store-shots/testing` | `makeTestContext({ exists? })` | サーバーなしでテンプレートを単体テストするための `RenderContext` ダブル。`exists` は boolean またはパスごとの述語関数。 |

---

## レシピ

**多言語対応** — `lang` をスライドとアセットパスの一部にし、言語ごとのシード展開は `expandSlides` で：

```typescript
import { expandSlides } from "@tzwzx/store-shots";

export interface Slide extends SlideBase {
  lang: "jp" | "en";
  screen: string;
  pr: string;
}

const seeds = [
  { pr: { en: "Everything.", jp: "ぜんぶ。" }, screen: "a" },
  { pr: { en: "One tap.", jp: "ワンタップ。" }, screen: "b" },
];

export const slides: Slide[] = expandSlides(
  ["jp", "en"] as const,
  seeds,
  (lang, seed) => ({
    id: `${lang}-${seed.screen}`,
    lang,
    pr: seed.pr[lang],
    screen: seed.screen,
  })
);

// in template.ts:
const screen = ctx.asset(`${slide.lang}/screen-${slide.screen}.png`);
```

**見出しのアクセントワード** — HTML を手書きせずに部分文字列をハイライト：

```typescript
import { accentHtml } from "@tzwzx/store-shots/html";
// "Less app. <span class="accent">More done.</span>"
const headline = accentHtml("Less app. More done.", "More done.");
// then style .accent in your CSS
```

**実際の撮影サイズに合わせたクロップ計算** — `ctx.asset` は PNG の固有サイズを返すので、テンプレートはシミュレーターが出力したものに適応できます：

```typescript
const screen = ctx.asset(`${slide.lang}/screen-${slide.screen}.png`);
const ratio =
  screen.width && screen.height ? screen.height / screen.width : 2.17;
```

**Google Play** — iOS 固有のものは何もありません：`canvas` を Play Console が受け付ける任意のサイズ（例: `{ width: 1080, height: 1920 }`）にして、同じ PNG を提出するだけです。

**テンプレートの単体テスト** — `makeTestContext` に対してスライドをレンダリングし、HTML をアサート：

```typescript
import { makeTestContext } from "@tzwzx/store-shots/testing";

const html = renderSlideHtml(slides[0], makeTestContext({ exists: true }));
expect(html).toContain("object-fit");
```

**ギャラリーの仕様テーブル**（レンダリングされたテキストと意図したコピーの突合に便利）：

```typescript
// in content/index.ts, add to the content object:
specPanel: (slide) => [{ label: "headline", value: slide.pr }],
```

**レイアウトの違うアイコン / クロージングスライド** — `renderSlideHtml` 内でフィールド（例: `slide.screen === "icon"`）で分岐し、別のボディを返します。

**プロダクション品質のデバイスフレームテンプレート** — ライト/ダークのトーンシステム、言語別タイポグラフィ、多層のデバイスシャドウ、プレースホルダーのフォールバック付き — 末尾の折りたたみ例を参照してください。

---

## AI エージェント向けチェックリスト

新しいプロジェクトにスクリーンショットを scaffold する際は、この順序に従ってください。各ステップは独立して検証可能です。

1. **インストールと scaffold**: `bun add -D -E @tzwzx/store-shots` を実行し、続けて `bunx store-shots init`。動作するスターター入りの `store-shots/` が作られ、`store:*` scripts が追加され、`.claude/commands/store-shots.md`（Claude Code の `/store-shots`）が生成されます。
2. **キャンバスサイズを設定**: 生成された `config.ts` で設定します（初期値は App Store 6.9" = `CANVAS.iphone69` = `1320 × 2868`。ストア掲載が別サイズを要求する場合のみ変更 — `CANVAS` プリセット参照）。
3. **スライドをモデリング**: `config.ts` のサンプル `slides[]` を自分のものに置き換え、テンプレートが必要とするフィールドで `Slide extends SlideBase` を拡張します。すべての `id` は一意であること。
4. **`renderSlideHtml` をカスタマイズ**: 生成された `template.ts` で行います。必須条件：
   - `canvas` サイズの完全な HTML ドキュメントを返す
   - すべての画像を `ctx.asset(relPath)` で解決する（`/assets/...` のハードコード禁止）
   - `!screen.exists` の場合に目に見えるプレースホルダーを描く
5. **`content/index.ts`** は `init` が配線済み（`assetsDir` 設定済み）。編集するのは `specPanel` を足すときだけ。
6. **CLI の `index.ts` と `store:*` scripts** も `init` が作成済み — やることはありません。
7. **レイアウト検証**: `bun run store:build`（アートが揃う前はプレースホルダーが出るのが正常）。エンジンがすべての PNG が正確に `canvas.width × canvas.height` であることを検証し、違えばビルドを失敗させます。
8. **アセット撮影**: `RUNBOOK.md` に従い（起動済みシミュレーター + Maestro）、`ctx.asset` のパスに一致する名前で `content/assets/` へ。
9. **最終ビルド**: `bun run store:build` を実行し、`output/index.html` をレビュー。

**よくある間違い：**

- ❌ アセットパスの不一致 — `ctx.asset("...")` の文字列は `assets/` 配下の実ファイルパスと一致する必要があります。「画像が表示されない」の原因 No.1 です。
- ❌ キャンバスと CSS のサイズ不一致 — ルート要素の `width/height` は `canvas` と等しくなければ、コンテンツが切れたり余白が出たりします。
- ❌ フラグメントを返す — `renderSlideHtml` は `<!doctype html>` から始まる完全なドキュメントを返す必要があります。
- ❌ プレースホルダー分岐を忘れる — ないと、アートが揃う前のプレビューが真っ白になります。
- ❌ `/assets/...` のハードコード — 存在チェックが機能するよう、必ず `ctx.asset` を通してください。

---

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `No Chrome-family browser found` | Chrome をインストールするか、`CHROME_PATH=/path/to/chrome` を設定。 |
| `Generated image has the wrong size` | ブラウザが `--window-size` / `--force-device-scale-factor` を無視しています。`CHROME_PATH` の指す先を確認してください。素の Chrome / Chromium / Edge ならすべて動きます。 |
| `Duplicate slide id(s)` | 2 つのスライドが同じ `id` を共有しています。id はルートとファイル名になるため、一意にしてください。 |
| `Unknown slide id(s)` | `store:build <id>` の引数がどのスライドにも一致しません — `config.ts` の id 一覧を確認してください。 |
| ファイルがあるのに画像が空白 / プレースホルダーが出る | `ctx.asset(...)` のパスが `assets/` 配下の実ファイルと一致していません。 |
| PNG が切れる、余白の帯が出る | ルート要素のサイズが `canvas` と一致していません。 |
| プレビューが更新されない | `store:preview` は `--watch` を使います。このスクリプト経由で起動したか確認し、ページを開き直してください。 |
| ポートが使用中 | CLI の `runPreview(content, { port })` のポートを変更してください。 |

---

## 応用: プロダクション品質のテンプレート

<details>
<summary>完全なデバイスフレームテンプレート（ライト/ダークトーン、言語別タイポグラフィ、プレースホルダー）。コピーして応用してください。</summary>

実際にリリースされたアプリで使われている形を一般化したものです。デモ内容：単一の `screen` キーからスライドごとのスタイルを導出、ライト/ダークのトーンシステム、言語別タイポグラフィ、多層のデバイスシャドウ、クロージングスライド用の代替「icon」レイアウト。色・コピー・`screen` の enum をあなたのアプリに合わせて差し替えてください。

**`content/config.ts`**

```typescript
import { CANVAS } from "@tzwzx/store-shots";
import type { SlideBase, SpecRow } from "@tzwzx/store-shots";

// Screen identity. `icon` is the closing slide with a different layout.
export type Screen = "a" | "b" | "c" | "d" | "icon";

export interface Slide extends SlideBase {
  lang: "jp" | "en";
  screen: Screen;
  tone: "light" | "dark"; // derived
  bg: [string, string]; // background gradient [top, bottom] (derived)
  frame: "silver" | "black" | "none"; // device frame color (derived)
  badge?: string;
  pr: { lines: string[]; accent: string }; // only the `accent` substring is highlighted
  sub: string[]; // one element = one line
}

// Light/dark rhythm keyed by screen. Bright screens stay light; "hero" moments go dark.
const SCREEN_STYLE: Record<
  Screen,
  { bg: [string, string]; tone: "light" | "dark" }
> = {
  a: { bg: ["#EAF3FF", "#C7DCFB"], tone: "light" },
  b: { bg: ["#E7F4FB", "#C2E2F2"], tone: "light" },
  c: { bg: ["#101D3E", "#070D20"], tone: "dark" },
  d: { bg: ["#EEEFFF", "#CFD7FB"], tone: "light" },
  icon: { bg: ["#122A56", "#0A1838"], tone: "dark" },
};

const deriveFrame = (
  screen: Screen,
  tone: "light" | "dark"
): Slide["frame"] => {
  if (screen === "icon") {
    return "none";
  }
  return tone === "dark" ? "black" : "silver";
};

type SlideSeed = Omit<Slide, "bg" | "frame" | "tone">;
const styled = (seed: SlideSeed): Slide => {
  const { bg, tone } = SCREEN_STYLE[seed.screen];
  return { ...seed, bg, frame: deriveFrame(seed.screen, tone), tone };
};

const baseSlides: SlideSeed[] = [
  {
    badge: "Free",
    id: "en-1",
    lang: "en",
    pr: { accent: "One screen.", lines: ["Everything.", "One screen."] },
    screen: "a",
    sub: ["Every list. Every errand."],
  },
  {
    id: "en-2",
    lang: "en",
    pr: { accent: "Noted.", lines: ["Thought it? Noted."] },
    screen: "b",
    sub: ["Quick capture. Tap and type."],
  },
  {
    id: "en-3",
    lang: "en",
    pr: { accent: "after dark.", lines: ["Beautiful after dark."] },
    screen: "c",
    sub: ["Automatic dark mode."],
  },
  {
    id: "en-4",
    lang: "en",
    pr: { accent: "More done.", lines: ["Less app. More done."] },
    screen: "icon",
    sub: ["Completely free."],
  },
];

export const slides: Slide[] = baseSlides.map(styled);

// This example's absolute layout constants target 1242x2688 (6.5").
export const canvas = CANVAS.iphone65;

export const specPanel = (slide: Slide): SpecRow[] => {
  const rows: SpecRow[] = [
    { label: "PR", value: slide.pr.lines.join(" / ") },
    { label: "sub", value: slide.sub.join(" / ") },
    { label: "tone", value: slide.tone },
    { label: "bg", value: `${slide.bg[0]} → ${slide.bg[1]}` },
  ];
  if (slide.badge) {
    rows.push({ label: "badge", value: slide.badge });
  }
  return rows;
};
```

**`content/template.ts`**

```typescript
import type { Asset, RenderContext } from "@tzwzx/store-shots";
import { accentHtml, escapeHtml } from "@tzwzx/store-shots/html";

import { canvas } from "./config";
import type { Slide } from "./config";

// Float the device off the bottom and scale it down so text has a stable zone above it.
const DEVICE_HEIGHT = 2038;
const DEVICE_SCALE = 0.92;
const DEVICE_BOTTOM = 84;
const CONTENT_ZONE = Math.round(
  canvas.height - DEVICE_BOTTOM - DEVICE_HEIGHT * DEVICE_SCALE
);

// Wrap the `accent` substring of each PR line in <span class="accent">.
const renderPrLines = (lines: string[], accent: string): string =>
  lines.map((line) => `<div>${accentHtml(line, accent)}</div>`).join("");

// Per-language typography tokens.
interface LangTokens {
  fontFamily: string;
  prLetterSpacing: string;
  prLineRatio: number;
  prWeight: number;
  subWeight: number;
}
const JA_TOKENS: LangTokens = {
  fontFamily: `"Hiragino Sans", sans-serif`,
  prLetterSpacing: "-0.01em",
  prLineRatio: 1.42,
  prWeight: 700,
  subWeight: 500,
};
const EN_TOKENS: LangTokens = {
  fontFamily: `-apple-system, "SF Pro Display", "Helvetica Neue", sans-serif`,
  prLetterSpacing: "-0.022em",
  prLineRatio: 1.16,
  prWeight: 800,
  subWeight: 500,
};

// Per-tone color tokens (contrast flips with the background).
interface ToneTokens {
  accent: string;
  badgeBg: string;
  badgeFg: string;
  textMain: string;
  textSub: string;
}
const LIGHT_TOKENS: ToneTokens = {
  accent: "#1567DC",
  badgeBg: "#1567DC",
  badgeFg: "#FFFFFF",
  textMain: "#0B2545",
  textSub: "rgba(11, 37, 69, 0.62)",
};
const DARK_TOKENS: ToneTokens = {
  accent: "#5CC0FF",
  badgeBg: "#5CC0FF",
  badgeFg: "#06182E",
  textMain: "#FFFFFF",
  textSub: "rgba(255, 255, 255, 0.74)",
};

const frameBackgroundCss = (frame: Slide["frame"]): string =>
  frame === "black"
    ? "linear-gradient(150deg, #54565a, #2c2e31 46%, #45474a)"
    : "linear-gradient(150deg, #f1f2f5, #c1c4ca 46%, #e3e5e9)";

const screenContentHtml = (slide: Slide, screen: Asset): string => {
  if (screen.exists) {
    return `<img src="${screen.url}" alt="" />`;
  }
  return `<div class="ph">screen-${slide.screen}.png<br />missing</div>`;
};

const iconBodyHtml = (slide: Slide, screen: Asset): string => {
  const icon = screen.exists
    ? `<img class="app-icon" src="${screen.url}" alt="" />`
    : `<div class="app-icon icon-ph">icon.png<br />missing</div>`;
  const sub = slide.sub
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
  return `
      <div class="pr pr-abs">${renderPrLines(slide.pr.lines, slide.pr.accent)}</div>
      ${icon}
      <div class="sub sub-abs">${sub}</div>`;
};

const standardBodyHtml = (slide: Slide, screen: Asset): string => {
  const badge = slide.badge
    ? `<div class="badge">${escapeHtml(slide.badge)}</div>`
    : "";
  const sub = slide.sub
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
  return `
      <div class="content">
        <div class="pr">${renderPrLines(slide.pr.lines, slide.pr.accent)}</div>
        <div class="sub">${sub}</div>
        ${badge}
      </div>
      <div class="device">
        <div class="bezel"><div class="screen">${screenContentHtml(slide, screen)}</div></div>
      </div>`;
};

export const renderSlideHtml = (slide: Slide, ctx: RenderContext): string => {
  const isJa = slide.lang === "jp";
  const isDark = slide.tone === "dark";
  const isIcon = slide.screen === "icon";

  const lang = isJa ? JA_TOKENS : EN_TOKENS;
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;
  const prSize = slide.screen === "a" ? 100 : 88;
  const prLine = Math.round(prSize * lang.prLineRatio);

  // Both preview and build resolve assets through /assets/*; missing files fall back to a placeholder.
  const relPath = isIcon
    ? "icon.png"
    : `${slide.lang}/screen-${slide.screen}.png`;
  const screen = ctx.asset(relPath);

  const frameBackground = frameBackgroundCss(slide.frame);
  const body = isIcon
    ? iconBodyHtml(slide, screen)
    : standardBodyHtml(slide, screen);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${canvas.width}px; height: ${canvas.height}px; }
  .canvas {
    position: relative;
    width: ${canvas.width}px; height: ${canvas.height}px;
    overflow: hidden;
    background: linear-gradient(168deg, ${slide.bg[0]}, ${slide.bg[1]});
    font-family: ${lang.fontFamily};
  }
  .content {
    position: absolute; top: 0; left: 100px;
    width: 1042px; height: ${CONTENT_ZONE}px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 28px; padding: 96px 0 28px;
  }
  .pr {
    font-size: ${prSize}px; line-height: ${prLine}px; font-weight: ${lang.prWeight};
    letter-spacing: ${lang.prLetterSpacing}; color: ${tokens.textMain}; text-align: center;
  }
  .pr .accent { color: ${tokens.accent}; }
  .sub {
    font-size: 42px; line-height: 56px; font-weight: ${lang.subWeight};
    color: ${tokens.textSub}; text-align: center;
  }
  .badge {
    margin-top: 6px; padding: 17px 40px;
    background: ${tokens.badgeBg}; color: ${tokens.badgeFg};
    font-size: 41px; font-weight: ${lang.prWeight}; border-radius: 999px;
  }
  .device {
    position: absolute; left: 136px; bottom: ${DEVICE_BOTTOM}px;
    width: 970px; height: ${DEVICE_HEIGHT}px;
    transform: scale(${DEVICE_SCALE}); transform-origin: bottom center;
    padding: 6px; border-radius: 150px; background: ${frameBackground};
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 48px 100px rgba(0, 0, 0, 0.5);
  }
  .bezel { width: 100%; height: 100%; padding: 16px; border-radius: 144px; background: #060606; }
  .screen {
    position: relative; width: 100%; height: 100%;
    border-radius: 128px; overflow: hidden; background: #F4F7FD;
  }
  .screen img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top center; }
  .screen .ph {
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-size: 44px; line-height: 64px; text-align: center; color: #6B7A99;
  }
  .pr-abs { position: absolute; top: 900px; left: 100px; width: 1042px; }
  .app-icon {
    position: absolute; left: 406px; top: 1140px;
    width: 430px; height: 430px; border-radius: 96px;
    box-shadow: 0 34px 72px rgba(0, 0, 0, 0.5);
  }
  .icon-ph {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(160deg, #1E6FCC, #58BCFE); color: #fff;
    font-size: 40px; line-height: 56px; text-align: center;
  }
  .sub-abs { position: absolute; top: 1700px; left: 100px; width: 1042px; }
</style>
</head>
<body>
  <div class="canvas">${body}</div>
</body>
</html>`;
};
```

</details>

---

## 動作の仕組み

`renderSlideHtml` が唯一のレンダリングポイントです。プレビューサーバーとビルドステップはどちらも `/slide/:id` にアクセスするため、ギャラリーのサムネイル、単体表示、最終 PNG は常に同一のレンダリングです — ズレの原因になり得る別個の「サムネイル用」コードパスは存在しません。`renderSlideHtml` はいくらでもリッチにできます（デバイスフレーム、グラデーションのグロー、浮かぶカード、OCR フレンドリーなレイアウトなど）。エンジンがその中身を見ることはありません。

## ライセンス

[MIT](./LICENSE)
