---
name: note-draft-cli
description: note記事のローカルMarkdown原稿から下書きを作成・更新し、明示依頼時に公開設定を確認して公開する。記事本文の執筆レビューは行わない。
---

# note下書きの作成・更新

## 役割

リポジトリのMarkdown原稿を正本として、既存の`note-draft.mjs` CLIでnote下書きを作成・更新し、明示依頼時に公開する。本文の執筆・内容編集を頼まれた場合は、対象記事に合う執筆・チェック用スキルでローカル原稿を先に整える。

## 必須ルール

- noteの操作は`npm run note:*`または`node scripts/note-draft.mjs`経由に限定する。`mcp__cua_repl`、ブラウザ操作ツール、手動のブラウザ編集へ切り替えない。CLI内部のPlaywright操作は利用してよい。
- CLIが失敗・未対応の場合はそこで止め、エラーと未完了の操作を報告する。別経路でブラウザ操作を続けない。
- 新規下書きは`npm run note:draft -- note/<記事>.md`、既存記事は`npm run note:update -- note/<記事>.md`を使う。既存記事の編集画面URLが必要で原稿の`note_id`でも特定できない場合は、推測せずユーザーに確認する。
- 保存する依頼がある場合だけ`--save`を付ける。下書き保存後も、公開の明示依頼がなければ公開操作はしない。
- 公開は`npm run note:publish -- note/<記事>.md`経由に限定し、タグ、有料/無料と価格、追加するマガジン、追加するメンバーシッププランを公開前に確認する。追加先が不要な場合も「追加なし」と明示し、選択状態が原稿・指定内容と一致しなければ停止する。
- 公開設定では、指定がある場合にマガジンとメンバーシッププランをそれぞれ追加・確認する。note上に実在しないマガジン名を推測して指定しない。
- 公開後は実際の公開URLが確認できた場合だけ、URL中の`/n/<id>`と実公開日を原稿の`note_id`・`date`へ反映する。
- `update`は既定でnote上の本文全体を原稿に置き換える。既存本文を保持する依頼では`--preserve-body`を指定し、その制約で希望する更新ができないなら保存前に確認する。
- カバー・本文画像・添付ファイルは原稿の参照と依頼に応じて、CLIの`--upload-cover`、`--upload-images`、`--upload-files`等を明示する。画像生成や新規素材の作成はしない。
- `note_id`はCLIが実際の編集画面URLから記録した値だけを使う。ファイル名や日付から作らない。

## 手順

1. リポジトリの`AGENTS.md`、`AGENTS/README.md`、`AGENTS/platforms/note/README.md`を読み、対象が一般記事かマガジン記事かに応じて該当する執筆ルールを確認する。
2. 原稿のパスと既存の`note_id`、画像・添付参照、下書き/公開状態を確認する。対象原稿以外の未関連変更を巻き込まない。
3. Markdownのパイプ表があれば、note上で表として表示されないため、内容・構造を保った表画像にする。横幅や行数のため画像では読みにくい場合はGistを提案し、`article-table-gist`の承認手順に従う。元のMarkdown表は原稿に残し、note本文では対応する画像または承認済みGistに置き換える。表を文章や箇条書きに組み替えず、画像生成モデルで表を描かない。
4. `npm run note:validate -- note/<記事>.md`でローカル検証する。失敗したら内容を確認し、本文編集依頼がない限り原稿を勝手に書き換えず報告する。
5. ユーザーが公開を明示した場合は、公開済み下書きの`note_id`を確認し、価格（有料なら`--price`、無料なら`--free`）と追加先を決めて`npm run note:publish`を使う。CLIが表示する対象・タグ・料金・追加先を確認し、公開の明示依頼がある場合だけ`--confirm`を付ける。
6. CLIの終了状態と出力を確認し、保存成否、公開URL、記録された`note_id`・`date`、アップロード成否を区別して報告する。CLIで確認できない画面上の表示や公開状態を確認済みと主張しない。

## 参照コマンド

```sh
npm run note:validate -- note/<記事>.md
npm run note:draft -- note/<記事>.md --save
npm run note:update -- note/<記事>.md --save
npm run note:update -- note/<記事>.md --url '<編集画面URL>' --save
npm run note:publish -- note/<記事>.md --price <円> --confirm
npm run note:publish -- note/<無料記事>.md --free --magazine '<マガジン名>' --membership-plan '<プラン名>' --confirm
```

画像等がある場合は、原稿の参照を確認して適切な`--upload-*`オプションを追加する。公開後も、X投稿・画像生成・コミット・pushへ進まない。
