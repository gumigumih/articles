# 📘 技術記事のまとめ

このリポジトリは、私が執筆している技術記事やノウハウを管理するためのものです。Zenn や Qiita で公開している記事の一覧や、ローカルでの執筆環境についてまとめています。

## 📁 ワークスペース構成

このリポジトリを親レポジトリとして、媒体ごとのCLI用コンテンツをサブモジュールで管理します。

```text
articles/
├── zenn/       # gumigumih/zenn-content
├── qiita/      # gumigumih/qiita-content
├── note/       # note本文・画像・投稿補助
├── topics/     # 調査・企画メモ
├── AGENTS/     # 共通の執筆ルール
└── scripts/    # 媒体横断の補助ツール
```

初回取得時はサブモジュールも同時に取得します。

```bash
git clone --recurse-submodules https://github.com/gumigumih/articles.git
```

既にclone済みの場合は、次を実行してください。

```bash
git submodule update --init --recursive
```

依存関係は親と各子レポジトリで個別にインストールします。

```bash
npm install
npm --prefix zenn install
npm --prefix qiita install
```

## 📝 記事公開先

- 📚 Zenn: [https://zenn.dev/gumigumih](https://zenn.dev/gumigumih)
- 🧪 Qiita: [https://qiita.com/gumigumih](https://qiita.com/gumigumih)

## 🚀 Zenn CLI の使い方

Zenn CLI を使用すると、ローカルで記事の執筆やプレビューが可能です。

### 新しい記事の作成

```bash
npm run zenn:new -- --slug <記事のスラッグ>
```

対話形式でタイトルや公開設定を入力すると、`zenn/articles/` フォルダ内に新しい Markdown ファイルが作成されます。

### プレビュー実行

```bash
npm run zenn:preview
```

ブラウザで `http://localhost:8000` にアクセスすると、リアルタイムでプレビューが確認できます。

### 記事の投稿

Zenn では CLI からの直接投稿はできません。GitHub 連携先を`gumigumih/zenn-content`へ切り替え、`zenn/articles/`のMarkdownを子レポジトリへPushすることで記事が公開されます。

詳細: [https://zenn.dev/zenn/articles/zenn-cli-guide](https://zenn.dev/zenn/articles/zenn-cli-guide)

## 🛠 Qiita CLI の使い方

Qiita CLI は、ローカル環境で Qiita 記事の執筆、プレビュー、投稿を可能にする公式ツールです。

### 新しい記事の作成

```bash
npm run qiita:new -- <記事のファイル名>
```

このコマンドで `qiita/public/` ディレクトリ内に `<記事のファイル名>.md` が作成され、YAML 形式の Front Matter が自動的に挿入されます。

### プレビューの起動

```bash
npm run qiita:preview
```

ブラウザで `http://localhost:8888` にアクセスすると、リアルタイムで記事のプレビューが確認できます。

### 記事の投稿

```bash
npm run qiita:publish -- <記事のファイル名>
```

または、すべての記事を一括で投稿・更新する場合：

```bash
npm run qiita:publish -- --all
```

QiitaのGitHub Actionsは`gumigumih/qiita-content`側で実行します。子レポジトリのActions Secretsに`QIITA_TOKEN`を設定してください。

## 📊 note Article Manager

noteの記事管理は、Sites上の[note Article Manager](https://note-article-manager.megumi-love-ramen.chatgpt.site/)で行います。記事本文と画像の正本は親レポジトリの`note/`です。この画面からnote、X、Gitへの書き込みは行いません。

## 📝 note下書きの準備

note記事は、Markdown原稿と`note/images/`の画像を正本にします。カバー画像はフロントマター直後に`![CoverImage](images/<記事スラッグ>/cover.png)`として置き、有料エリアは次のコメントで区切ります。

```markdown
![CoverImage](./images/<記事スラッグ>/cover.png)

<!-- note:paid-start -->
```

`note:validate`と`note:prepare`は、カバー画像の存在・本文画像・有料区切りの前後に本文があるかも確認します。`note:prepare`のmanifestには、カバー画像、無料本文、有料本文を分けて記録します。

```bash
npm run note:validate -- note/<記事>.md
npm run note:prepare -- note/<記事>.md
npm run note:cover-prompt -- note/<記事>.md
```

`note:prepare`は、`temp/note-drafts/<記事名>/`にnoteへ渡す本文・HTML・画像一覧の`manifest.json`を作成します。公開前の原稿には`date`を追加しません。`note:draft`または`note:update --state draft`を`--save`付きで実行すると、保存後に編集画面URLの実在する下書きIDを`note_id`へ反映します。

`note:cover-prompt`は、記事タイトルと記事テーマに合わせた`note/<記事スラッグ>.cover-prompt.md`を作成します。画像生成自体は手動で行い、生成用プロンプトと本文を分離して管理します。サイトリニューアル記事には`site-renewal`プリセット、その他の記事には`generic`プリセットを使えます。

```bash
npm run note:cover-prompt -- note/20260913_astra-site-renewal.md
npm run note:cover-prompt -- note/<記事>.md --preset generic
```

Playwrightでnoteエディタを開いてタイトルと本文を入力する場合は、次を使います。初回は`--save`を付けずにログイン状態・本文・画像の挿入位置を確認してください。ローカル画像を含む記事を保存するときは、画像アップロードも明示します。

初回やログイン切れの場合は、先にPlaywright専用の永続プロファイルでログインします。ブラウザ上で本人がログイン操作を完了すると、認証状態は`temp/note-playwright-profile/`に保存され、次回以降の`note:draft`・`note:update`で再利用されます。パスワードや2段階認証コードはスクリプトへ渡しません。

```bash
npm run note:login
```

ログイン待機中に別のプロファイルを使う場合は、`--profile`を指定できます。`note:draft`・`note:update`に`--login`を付けると、未ログイン時にログイン完了まで待機してから続行します。

```bash
npm run note:draft -- note/<記事>.md
npm run note:draft -- note/<記事>.md --upload-cover --upload-images
npm run note:draft -- note/<記事>.md --upload-cover --upload-images --save
npm run note:draft -- note/<記事>.md --login --upload-cover --upload-images --save
```

既存記事を更新する場合は`note:update`を使います。公開済み記事は本文の`note_id`から編集画面を自動生成します。`note_id`のない下書きは、既存の編集画面URLを`--url`で指定してください。
`note:update`は公開済み記事として検証します。note上の下書きを更新する場合は`--state draft`を追加してください。更新時は、原稿を正本として本文を置き換え、カバー画像・本文画像・添付ファイルを自動アップロードする動作が既定です。既存本文やnote上で手動追加した埋め込みを残したい場合だけ`--preserve-body`を指定してください。

```bash
npm run note:update -- note/<公開済み記事>.md
npm run note:update -- note/<下書き>.md --url https://editor.note.com/notes/<記事ID>/edit/
npm run note:update -- note/<記事>.md --state draft --url https://editor.note.com/notes/<記事ID>/edit/ --save
npm run note:update -- note/<記事>.md --preserve-body --save
```

確認だけなら`--save`を付けず、note側へ保存する場合だけ`--save`を付けます。既定の本文置換では、note上で追加した埋め込みや手動設定は保持されません。従来どおり明示的に指定したい場合は`--replace-body --upload-cover --upload-images`などを付けても構いません。

新規作成または本文を置換して保存する場合、カバー画像・本文画像・`note:file`・`note:audio`・`note:comic`があれば、それぞれのアップロード指定が必要です。`note:update`ではこれらが既定で有効になります。有料エリアの区切りは、`note:paid-start`の位置でnote側の「続きを読むには」に相当するボタンを検出して挿入します。UIを検出できない場合は保存せず停止します。

note側でURL埋め込みにしたいURLは、本文で次のブロックとして管理します。下書きの新規作成時はURLを貼り付け、note側の埋め込み変換を試みます。サイト側の対応状況によっては通常リンクになる場合があります。

```text
<!-- note:embed -->
https://example.com/
<!-- /note:embed -->
```

note固有の挿入物は、Markdown原稿内の位置をそのままnote上の挿入位置にします。目次は既存記事の配置を維持しつつ、`note:toc`へ統一します。

```text
<!-- note:toc -->

<!-- note:file -->
[PDF版](slides/example.pdf)
<!-- /note:file -->

<!-- note:audio -->
[音声版](audio/example.mp3)
<!-- /note:audio -->

<!-- note:comic -->
[コミック画像](images/comic-cover.png)
<!-- /note:comic -->

<!-- note:paid-start -->
```

`note:file`はファイル添付、`note:audio`は音声投稿、`note:comic`はコミック作成、`note:toc`は目次挿入として処理します。ファイル・音声・コミックの参照先は、本文中でも読めるMarkdownリンク形式で記述します。

`--save`を付けない限り、note側の保存や原稿の`note_id`更新は行いません。公開操作は別コマンドです。下書きの公開設定を原稿のタグ・料金と照合し、指定先のメンバーシップやマガジンへ追加して公開する場合は`note:publish`を使います。公開操作と設定変更には`--confirm`が必要です。深夜エンタメ会議の記事はマガジン追加なし、メンバーシップ「スタンダードプラン」を既定にします。

```bash
npm run note:publish -- note/<有料記事>.md --price <円> --confirm
npm run note:publish -- note/<無料記事>.md --free --magazine '<マガジン名>' --membership-plan '<プラン名>' --confirm
```

公開後は実際の公開URLを確認し、原稿の`date`と公開用の実在する`note_id`を更新します。追加先が不要な場合は`--no-magazine`または`--no-membership`を明示します。

## 📋 記事内の表をGistにする

記事内の表をGistとして管理するときは、プロジェクトSkillの`$article-table-gist`を使います。対象表、Gistの公開範囲、記事に反映する差分を確認してから、Gist作成・更新と記事ファイルの変更を実行します。GitHub CLIの認証を使うため、記事リポジトリにGist用トークンを保存しません。

## ✍️ 執筆用Skill

執筆・公開前レビューに使うSkillは、このプロジェクトの`.agents/skills/`で管理します。

- `$gumi-writing-style`: ぐみ名義のnote記事の文体調整
- `$article-general-content-check`: note・Qiita・Zenn・ブログ記事の一般向けレビュー
- `$article-title-design`: note・Zenn・ブログ記事のタイトル設計・候補比較
- `$article-ai-entertainment-content-check`: 「AIとわたしの深夜エンタメ会議」専用レビュー
- `$ai-entertainment-candidate-research`: 同マガジンの記事候補調査・比較・掲載順の提案
- `$ai-entertainment-article-package`: 選択済み候補から記事初稿とチェック結果を作成し、ブラッシュアップ前に停止
- `$ai-entertainment-slides`: ブラッシュアップ後、明示依頼を受けて最新版の記事からスライドを作成・検証

同マガジンは「記事作成 → ブラッシュアップ（手動）→ スライド作成」の順に進めます。本文チェックに合格してもスライドは自動生成しません。「この本文でスライドを作って」と依頼するか、`$ai-entertainment-slides`で対象記事を指定してください。

日本語全般の診断・推敲に使う`natural-japanese`は、汎用Skillとして個人側に残します。

## 🛡️ Git Hooks のセットアップ

このリポジトリでは、mainブランチへの直接プッシュを防ぐためのGit Hooksが設定されています。

### 🚀 自動セットアップ（推奨）

リポジトリをクローンした後、`npm install` を実行すると**自動的に**Git Hooksがセットアップされます：

```bash
git clone https://github.com/gumigumih/articles.git
cd articles
npm install  # ← Git Hooksが自動でセットアップされます！
```

### 🛠️ 手動セットアップ

何らかの理由で手動セットアップが必要な場合は、以下のコマンドを実行してください：

```bash
./scripts/setup-git-hooks.sh
```

### 📋 動作内容

- **mainブランチへの直接プッシュを禁止**
- **フィーチャーブランチからのプッシュは正常動作**
- **分かりやすいエラーメッセージと代替案を表示**
- **CI環境では自動的にスキップ**

### 💡 推奨ワークフロー

```bash
# ❌ これは禁止される
git checkout main
git push origin main

# ✅ 正しいワークフロー
git checkout -b feature/new-article
# 作業・コミット
git push -u origin feature/new-article
# GitHub上でプルリクエスト作成 → レビュー → マージ
```

### 🔧 トラブルシューティング

Git Hooksが動作しない場合は、以下を確認してください：

1. `.git/hooks/pre-push` ファイルが存在するか
2. ファイルに実行権限があるか (`chmod +x .git/hooks/pre-push`)
3. セットアップスクリプトを再実行する
