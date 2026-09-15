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

## 📋 記事内の表をGistにする

記事内の表をGistとして管理するときは、プロジェクトSkillの`$article-table-gist`を使います。対象表、Gistの公開範囲、記事に反映する差分を確認してから、Gist作成・更新と記事ファイルの変更を実行します。GitHub CLIの認証を使うため、記事リポジトリにGist用トークンを保存しません。

## ✍️ 執筆用Skill

執筆・公開前レビューに使うSkillは、このプロジェクトの`.agents/skills/`で管理します。

- `$gumi-writing-style`: ぐみ名義のnote記事の文体調整
- `$article-general-content-check`: note・Qiita・Zenn・ブログ記事の一般向けレビュー
- `$article-ai-entertainment-content-check`: 「AIとわたしの深夜エンタメ会議」専用レビュー
- `$ai-entertainment-candidate-research`: 同マガジンの記事候補調査・比較・掲載順の提案
- `$ai-entertainment-article-package`: 選択済み候補から本文レビューとおまけスライド生成を一括実行

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
