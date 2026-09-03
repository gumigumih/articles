# 📘 技術記事のまとめ

このリポジトリは、私が執筆している技術記事やノウハウを管理するためのものです。Zenn や Qiita で公開している記事の一覧や、ローカルでの執筆環境についてまとめています。

## 📝 記事公開先

- 📚 Zenn: [https://zenn.dev/gumigumih](https://zenn.dev/gumigumih)
- 🧪 Qiita: [https://qiita.com/gumigumih](https://qiita.com/gumigumih)

## 🚀 Zenn CLI の使い方

Zenn CLI を使用すると、ローカルで記事の執筆やプレビューが可能です。

### 新しい記事の作成

```bash
npx zenn new:article --slug <記事のスラッグ>
```

対話形式でタイトルや公開設定を入力すると、`articles/` フォルダ内に新しい Markdown ファイルが作成されます。

### プレビュー実行

```bash
npx zenn preview
```

ブラウザで `http://localhost:8000` にアクセスすると、リアルタイムでプレビューが確認できます。

### 記事の投稿

Zenn では CLI からの直接投稿はできません。GitHub 連携を使って、`articles/` フォルダに Markdown ファイルを配置し、GitHub に Push することで記事が公開されます。

詳細: [https://zenn.dev/zenn/articles/zenn-cli-guide](https://zenn.dev/zenn/articles/zenn-cli-guide)

## 🛠 Qiita CLI の使い方

Qiita CLI は、ローカル環境で Qiita 記事の執筆、プレビュー、投稿を可能にする公式ツールです。

### 新しい記事の作成

```bash
npx qiita new <記事のファイル名>
```

このコマンドで `public/` ディレクトリ内に `<記事のファイル名>.md` が作成され、YAML 形式の Front Matter が自動的に挿入されます。

### プレビューの起動

```bash
npx qiita preview
```

ブラウザで `http://localhost:8888` にアクセスすると、リアルタイムで記事のプレビューが確認できます。

### 記事の投稿

```bash
npx qiita publish <記事のファイル名>
```

または、すべての記事を一括で投稿・更新する場合：

```bash
npx qiita publish --all
```

## 📊 note 管理画面

`note/` 配下の記事一覧、Gitの未追跡・削除状態、カバー画像の用意状況、note投稿記録を確認・編集する画面を起動できます。note公開状況は `https://note.com/gumigumih` の公開記事スナップショットと照合します（自動取得ではありません）。

```bash
npm run note:dashboard
```

ブラウザで `http://127.0.0.1:4310` を開いてください。プロフィール照合データを更新する場合は、公開プロフィールを確認したうえで次を実行します。

```bash
npm run note:dashboard:build
```

投稿記録はローカル画面では `note/posting-records.json` に、静的公開画面では利用中ブラウザのローカル保存領域に保存されます。この画面からnoteへの公開やGit操作は行いません。

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
