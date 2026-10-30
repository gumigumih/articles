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
- 旧「AIとわたしの深夜エンタメ会議」の記事も、現在は一般noteのルールとチェック用スキルを適用します。専用ルール・スキルは廃止済みです。

## 運用上の境界

- note本文の`note_id`は、下書き保存後は編集画面URLに含まれる実在する下書きIDを記載し、公開後は公開URLを確認した実在するIDへ更新します。ファイル名や日付から推測しません。
- `*.x-post.md`、`*.cover-prompt.md`などの付属ファイルは、本文記事のフロントマターや`note_id`を持ちません。
- 本文の新規作成・改稿時は、記事種別に適用できるチェック用skillをすべて実施します。
- 投稿、画像生成、コミット、pushは文章化・レビューとは別の明示依頼です。

## Notionへのバックアップ

- 記事の正本はリポジトリのMarkdownと画像です。Notionで執筆・承認して原稿へ逆同期する運用は廃止しました。
- 本文記事の新規作成・改稿を終えたら、ユーザーが省略を指定した場合を除き、今回の対象記事を docs/notion-backup.md に従って既存Notionプラグインで保存します。既存記事の一括転送は別依頼です。
- 本文・参照画像を保存し、元のMarkdownはGitHubのmainにあるファイルへのリンクを付けます。Markdownパスで対応する同じページを更新し、原稿ファイルを新たに添付しません。main未反映ならリンクを推測せず明記します。失敗時は原稿を保持し、Notion保存まで完了したと報告しません。
- 旧ボタン、Mac常駐受付、スケジュール、旧Workflow、LLM APIを起動しません。Notionへのバックアップは、note等への公開・コミット・pushを許可しません。
