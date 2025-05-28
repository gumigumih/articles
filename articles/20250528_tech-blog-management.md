---
title: "技術ブログの投稿管理を効率化する：GitHubリポジトリを使った記事管理の実践"
emoji: "📔"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["github", "markdown", "qiita", "zenn", "cli"]
published: true
---

# はじめに

はじめまして、ぐみと申します。

技術記事はQiitaとZennで、非エンジニア向けの記事はnoteで投稿することにしました。複数のプラットフォームを使い分けることで、読者層に応じた適切な発信ができると考えています。

この記事では、GitHubリポジトリを使用した効率的な記事管理の方法を紹介します。

# なぜGitHubリポジトリで管理するのか

## 背景と課題
複数のプラットフォームで記事を投稿する中で、以下のような課題に直面しました：

- 記事の更新履歴が追跡できない
- 複数プラットフォームへの投稿作業が非効率
- オフライン環境での執筆が難しい
- 画像やコードの管理が煩雑

これらの課題を解決するために、GitHubリポジトリを使用した記事管理の仕組みを導入することにしました。

## メリット
- バージョン管理が可能
- 記事の変更履歴を追跡できる
- 複数プラットフォームへの投稿を一元管理できる
- Markdown形式で記事を管理できる
- CI/CDによる自動デプロイが可能
- オフライン環境でも編集作業が可能

# 記事執筆環境の構築

## 1. Qiita CLIのセットアップ
```bash
# プロジェクトにQiita CLIをインストール
npm install @qiita/qiita-cli --save-dev

# 初期化
npx qiita init

# ログイン
npx qiita login
```

詳細は[Qiita CLIの利用方法](https://qiita.com/Qiita/items/666e190490d0af90a92b#qiita-cli-%E3%81%AE%E5%88%A9%E7%94%A8%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)を参照してください。

## 2. Zenn CLIのセットアップ
```bash
# プロジェクトを初期化
npm init --yes

# Zenn CLIをインストール
npm install zenn-cli

# 初期化
npx zenn init
```

- [Zennのダッシュボード](https://zenn.dev/dashboard/deploys)にアクセス
- 「レポジトリ設定」から連携するリポジトリを選択

詳細は[Zenn CLIのインストール方法](https://zenn.dev/zenn/articles/install-zenn-cli#3.-zenn%E7%94%A8%E3%81%AE%E3%82%BB%E3%83%83%E3%83%88%E3%82%A2%E3%83%83%E3%83%97%E3%82%92%E8%A1%8C%E3%81%86)を参照してください。

# リポジトリ構成

```
.
├── public/     # Qiita用記事
├── books/      # Zenn用書籍
├── articles/   # Zenn用記事
├── images/     # Zenn用画像ファイル
├── note/       # note用記事
└── README.md   # リポジトリの説明
```

# 投稿フロー

## 1. Qiitaへの投稿
```bash
# 記事の作成
npx qiita new 記事のファイルのベース名

# プレビュー
npx qiita preview

# 記事の公開
npx qiita publish 記事のファイルのベース名
```

## 2. Zenn（Article）への投稿
```bash
# 記事の作成
npx zenn new:article
# ランダムな文字列のファイル名で記事が作成されます

# ファイル名の変更
# 作成されたファイルを、管理しやすい名前に変更します
# 例: 20240320_tech-blog-management.md

# プレビュー
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

# 記事管理のベストプラクティス

## 1. ファイル命名規則
- 日付_タイトル.md の形式を使用
- 例: `20240320_tech-blog-management.md`

## 2. 画像管理
### Qiita
- ローカルでの画像管理は不可
- 記事作成時にプレビューから画像をアップロード
- アップロードした画像はQiitaのサーバーで管理

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

# 導入後の効果

- 記事の更新履歴が明確になり、品質管理が容易に
- 複数プラットフォームへの投稿作業が効率化
- オフライン環境でも執筆可能に
- 画像やコードの管理が一元化

# まとめ

GitHubリポジトリを使用した技術記事の管理は、記事の一元管理を実現し、複数プラットフォームへの投稿を効率化します。また、記事の更新履歴を明確にすることで、品質管理も容易になります。

この記事で紹介した方法を参考に、あなたの記事管理の効率化に役立てていただければ幸いです。

# おまけ：関連記事のご紹介

この記事の執筆にあたり、投稿プラットフォームの使い分けについて考えた記事をnoteに投稿しました。技術記事の管理方法を考える上で、参考にしていただければ幸いです。

- [投稿媒体の使い分けを考えることで、発信しやすくしようと思った話](https://note.com/gumigumih/n/n27aec58d87ce)

# 参考リンク
- [Qiita CLI Documentation](https://qiita.com/Qiita/items/666e190490d0af90a92b)
- [Zenn CLI Documentation](https://zenn.dev/zenn/articles/install-zenn-cli)
