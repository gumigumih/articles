# 執筆ルール（入口）

記事の作業を始めるときは、まずこのファイルと`AGENTS/README.md`を読みます。全ルールを一度に読むのではなく、記事の保存先と種別から必要なルートだけを選んでください。

## 媒体別の入口

- note: `AGENTS/platforms/note/README.md`
- Zenn: `AGENTS/platforms/zenn/README.md`
- Qiita: `AGENTS/platforms/qiita/README.md`
- ルーティング一覧: `AGENTS/platforms/README.md`
- 共通ルール一覧: `AGENTS/common/README.md`

## 記事種別

- 一般note・ブログ: `AGENTS/platforms/note/general-note.md`
- 「AIとわたしの深夜エンタメ会議」: `AGENTS/magazines/ai-entertainment/article.md`
- 同マガジン通常回: 上記に加えて`weekly-template.md`
- 同マガジンの調査・収益化: 必要なときだけ`monetization.md`

## 運用上の境界

- note本文の`note_id`は、公開済みURLを確認したあとに実在するIDを記載します。下書きは省略し、ファイル名や日付から推測しません。
- `*.x-post.md`、`*.cover-prompt.md`などの付属ファイルは、本文記事のフロントマターや`note_id`を持ちません。
- 本文の新規作成・改稿時は、記事種別に適用できるチェック用skillをすべて実施します。
- 投稿、画像生成、コミット、pushは文章化・レビューとは別の明示依頼です。
