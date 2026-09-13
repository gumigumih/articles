# ルール集（AI向けルーティング）

このディレクトリは、本リポジトリの執筆・記事管理ルールの正本です。原本の言語は日本語です。

## 最初の分岐

1. ルートの`AGENTS.md`を読む。
2. 記事の保存先で媒体を判定する。
3. `AGENTS/platforms/README.md`から、note・Zenn・Qiitaのいずれかの入口を選ぶ。
4. 入口に書かれた共通ルールと、記事種別の専用ルールだけを読む。

## ルールの配置

- 全媒体共通: `AGENTS/common/README.md`
- 媒体別の入口と正本: `AGENTS/platforms/{note,zenn,qiita}/README.md`
- note一般記事: `AGENTS/platforms/note/general-note.md`
- noteマガジン固有: `AGENTS/magazines/ai-entertainment/`

## 読み分け

| 作業 | 追加で読むもの |
| --- | --- |
| 本文を新規作成・改稿 | 記事種別に対応するチェック用skillをすべて適用 |
| noteのフロントマター確認 | `AGENTS/platforms/note/README.md` |
| 通常回のマガジン記事 | `article.md` + `weekly-template.md` |
| 収益化・候補調査・分析 | 必要なときだけ`monetization.md`、`analytics-log.md` |
| 画像・図解 | `AGENTS/common/image.md` |

同じルールを複数箇所に複製せず、媒体固有の記述は各媒体フォルダ、共通の記述は`common/`に置きます。古いパスを見つけた場合は、作業前に参照先を現行パスへ直します。
