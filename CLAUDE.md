# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS v4** — uses `@tailwindcss/postcss`, no `tailwind.config.js` (config via CSS)
- No testing framework installed

## Project Structure

```
src/
  app/           # Next.js App Router pages and layouts
  components/    # Shared React components
  lib/           # Pure logic, utilities, types (no React)
```

- Import alias `@/*` maps to `src/*`
- All pages/layouts use the App Router convention (`layout.tsx`, `page.tsx`)
- Global styles in `src/app/globals.css` using Tailwind v4 `@import "tailwindcss"` syntax

## Architecture Notes

- Game logic lives in `src/lib/` as pure functions (no React dependencies)
- React components in `src/components/` are purely presentational — they receive state via props or custom hooks
- Game state is managed via `useReducer` in a top-level component, not a global store

---

## ぷよぷよ 要件定義

### 概要

落ち物パズルゲーム。色付きのぷよが2個ペアで落下し、同色が4個以上つながると消える。連鎖を重ねるほど高得点を獲得できる。

### ボード仕様

| 項目 | 値 |
|------|-----|
| 列数 | 6 |
| 行数 | 12（表示）+ 1（非表示スポーン行） |
| スポーン位置 | 列3（0-indexed: 2）、非表示行（row 1） |
| ゲームオーバー判定行 | row 1（非表示スポーン行）の列3に既存ぷよがある場合 |

### ぷよの色

5色: `red` / `green` / `blue` / `yellow` / `purple`

### ピース仕様

- 常に2個1組（メイン + サブ）のペアで落下する
- 回転方向は4方向（`Rotation: 0=上, 1=右, 2=下, 3=左`）
- `rotation` はサブぷよのメインに対する相対位置を表す
- 回転失敗時はウォールキックを試みる（左右1マスずつ）

### ゲームフェーズ（state machine）

```
playing → (接地) → clearing → (フラッシュ完了) → playing
                              ↘ (連鎖あり) → clearing（ループ）
playing → (接地・消えなし) → playing（即座に次を生成）
playing → (ゲームオーバー判定) → gameover
gameover → (RESET) → playing
```

| フェーズ | 説明 |
|---------|------|
| `playing` | ユーザー操作・自動落下が有効 |
| `clearing` | 消去アニメーション（点滅）中。入力無効 |
| `gameover` | ゲーム終了。RESET のみ受け付ける |

### ゲームメカニクス

**落下・接地**
- 自動落下間隔: `max(100ms, 800ms - level × 60ms)`
- ソフトドロップ: 1マス即時落下
- ハードドロップ: 接地位置まで瞬間移動

**消去ルール**
- 同色が上下左右に4個以上連結 → 消去対象
- BFS（幅優先探索）でグループを検出

**重力**
- 消去後、浮いたぷよは下方向に落下（列ごとに詰める）

**連鎖**
- 重力適用後に再度消去判定を行い、消えるぷよがあれば連鎖カウントを増やして繰り返す

**スコア計算**
```
得点 = (10 × 消去数) × (max(1, 連鎖ボーナス) + カラーボーナス(3))
連鎖ボーナス: 1連鎖=0, 2連鎖=8, 3連鎖=16, 4連鎖=32, 5連鎖=64 ...（上限11連鎖=256）
```

**レベルアップ**
- 消去したぷよの累積数が 20 の倍数を超えるたびにレベルアップ
- `level = floor(lines / 20) + 1`

### 操作（キーボード）

| キー | 操作 |
|------|------|
| `←` / `→` | 左右移動 |
| `↑` / `Z` | 反時計回り回転 |
| `X` | 時計回り回転 |
| `↓` | ソフトドロップ（1マス落下） |
| `Space` | ハードドロップ（即着地） |

### UI・ビジュアル要件

- **テーマ**: ダーク（深紫〜黒のグラデーション背景）
- **ぷよ**: 丸形。色ごとにネオングロウ（`box-shadow`）と光沢ハイライトを持つ
- **消去アニメーション**: 点滅（80ms × 3フレーム交互）で表現
- **連鎖表示**: 2連鎖以上でバウンスアニメーション付きの連鎖数表示
- **NEXT表示**: 次の2ペアを右パネルに表示。直近は100%不透明、2番目は縮小＋半透明
- **ゲームオーバー**: ボード上にブラーオーバーレイ＋「もう一度」ボタン

### NEXT キュー

- 常に2ペア先読みを保持する（`state.next: [PuyoColor, PuyoColor][]`）
- ピース消費のたびに末尾にランダムペアを補充する
