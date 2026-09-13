# 媒体別ルール

`note/`、`zenn/`、`qiita/`の記事は、それぞれのフォルダを正本として扱います。媒体をまたいだ共通ルールは`AGENTS/common/`に置き、ここにはルーティングだけを置きます。

| 対象 | 最初に読む | 必要に応じて読む |
| --- | --- | --- |
| noteの一般記事・ブログ | `AGENTS/platforms/note/README.md` | `AGENTS/platforms/note/general-note.md` |
| note「AIとわたしの深夜エンタメ会議」 | `AGENTS/platforms/note/README.md` | `AGENTS/magazines/ai-entertainment/article.md`、通常回なら`weekly-template.md`、調査・収益化なら`monetization.md` |
| Zenn | `AGENTS/platforms/zenn/README.md` | `AGENTS/common/`のうち入口から指定されたもの |
| Qiita | `AGENTS/platforms/qiita/README.md` | `AGENTS/common/`のうち入口から指定されたもの |

## 作業別の追加ルール

- 本文の新規作成・改稿: 記事種別に対応するチェック用skillをすべて適用する。
- noteの公開前確認: `article-general-content-check`、または深夜エンタメ会議なら`article-ai-entertainment-content-check`を使う。
- `*.x-post.md`、`*.cover-prompt.md`などの付属ファイル: 本文記事のフロントマターや`note_id`を付けない。
- 投稿、画像生成、コミット、push: 記事の文章化・レビューとは別の明示依頼として扱う。
