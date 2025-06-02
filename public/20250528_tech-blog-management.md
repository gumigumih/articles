---
title: 技術ブログの管理を効率化：GitHubリポジトリでQiita・Zenn・noteの記事を一元管理する方法
tags:
  - Qiita
  - GitHub
  - Markdown
  - CLI
  - Zenn
private: false
updated_at: '2025-05-28T11:35:29+09:00'
id: 6fcd5fde39ece76eddcb
organization_url_name: null
slide: false
ignorePublish: false
---

# はじめに

はじめまして、ぐみと申します。PM／ディレクターとして働きながら、業務効率化のためのツールやスクリプトを作っています。GAS・CLI・自動化が好きです。現場で役立つTipsを発信します。

この記事では、GitHubリポジトリを使用して複数の技術ブログプラットフォーム（Qiita・Zenn・note）の記事を効率的に管理する具体的な実装手順を紹介します。

# 実装手順

## 1. プロジェクトの初期設定

```bash
# プロジェクトの作成
mkdir tech-blog-management
cd tech-blog-management

# npmプロジェクトの初期化
npm init --yes

# 必要なCLIツールのインストール
npm install @qiita/qiita-cli zenn-cli --save-dev
```

## 2. Qiita CLIの設定

```bash
# Qiita CLIの初期化
npx qiita init

# ログイン
npx qiita login

# 設定ファイルの確認
cat .qiita.config.json
```

## 3. Zenn CLIの設定

```bash
# Zennの初期化
npx zenn init

# 記事用ディレクトリが作成されます
```

## 4. ZennとGitHubリポジトリの連携

- [Zennのダッシュボード](https://zenn.dev/dashboard/deploys)にアクセス
- 「レポジトリ設定」から連携するリポジトリを選択

## 5. note用のフォルダ作成

```bash
# ディレクトリ構造の作成
mkdir -p public note
```

## 6. .gitignoreの設定

```
cat << EOF > .gitignore
node_modules/
.DS_Store
.env
EOF
```

# 記事作成のポイント

## 1. ファイル命名規則

日付\_タイトル.md の形式で統一
例：20240320_tech-blog-management.md

## 2. 画像管理

### Qiita

- ~~ローカルでの画像管理は不可~~
- ~~記事作成時にプレビューから画像をアップロード~~
- ~~アップロードした画像はQiitaのサーバーで管理~~
- 画像はGithubのレポジトリにプッシュしてURLを埋め込むことにしました（2025/06/02更新）
  - GitHubリポジトリの画像直リンク: `https://raw.githubusercontent.com/ユーザー名/リポジトリ名/main/パス/画像.png`

### Zenn

- ローカルで画像を管理可能
- 記事ごとに専用の画像ディレクトリを作成
  ```
  images/
  └── 20240320_tech-blog-management/
      ├── 01_overview.png
      ├── 02_implementation.png
      └── 03_result.png
  ```
- 画像はGitHubリポジトリで管理

### note

- ローカルで画像を管理可能
- 記事ごとに専用の画像ディレクトリを作成
- 画像はGitHubリポジトリで管理
- 投稿時に画像をアップロード

## 3. 記事の構成

各プラットフォームに合わせた記事の構成を意識しましょう：

### Qiita

- 具体的な実装手順を重視
- コード例を多く含める
- トラブルシューティングの手順を記載

### Zenn

- 背景や考え方を重視
- 実装に至った経緯を説明
- 学びや気づきを共有

### note

- 非エンジニア向けの説明を心がける
- 実務での活用例を紹介
- 体験談や気づきを共有

# 記事の投稿手順

## 1. Qiitaへの投稿

```bash
# 記事の作成
npx qiita new 20240101_article-name

# プレビューで内容を確認
npx qiita preview

# 記事の公開
npx qiita publish 20240101_article-name
```

## 2. Zennへの投稿

```bash
# 記事の作成
npx zenn new:article --slug 20240101_article-name

# プレビューで内容を確認
npx zenn preview

# 記事の公開（GitHubリポジトリにプッシュ）
git add .
git commit -m "Add new article"
git push origin main
```

## 3. noteへの投稿

1. ローカルでMarkdownファイルを作成
2. プレビューで内容を確認
3. noteの投稿画面に内容をコピー
4. 最終確認後、投稿

# まとめ

この記事では、GitHubリポジトリを使用した技術ブログ管理の具体的な実装手順を紹介しました。CLIツールとシェルスクリプトを組み合わせることで、記事の管理と投稿を効率化できます。

# おまけ：関連記事のご紹介

この記事の執筆にあたり、投稿プラットフォームの使い分けについて考えた記事をnoteに投稿しました。技術記事の管理方法を考える上で、参考にしていただければ幸いです。

- [投稿媒体の使い分けを考えることで、発信しやすくしようと思った話](https://note.com/gumigumih/n/n27aec58d87ce)

# 参考リンク

- [Qiita CLI Documentation](https://qiita.com/Qiita/items/666e190490d0af90a92b)
- [Zenn CLI Documentation](https://zenn.dev/zenn/articles/install-zenn-cli)

# 更新履歴

- 2025/06/02: Qiitaの画像管理方法を更新（GitHubリポジトリでの管理に変更）
- 2025/06/02: Zenn CLIの記事作成コマンドを更新（--slugオプションを使用する方法に変更）
- 2025/05/28: 初版公開
