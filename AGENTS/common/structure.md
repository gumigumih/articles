# 記事構成・テンプレート

## フロントマター（メタデータ）

### Qiita（@/public 配下）
Qiita用記事では、以下のYAML形式のフロントマターを冒頭に記載します。

```yaml
---
title: 記事タイトル
tags:
  - タグ1
  - タグ2
private: false
updated_at: 'YYYY-MM-DDTHH:mm:ss+09:00'
id: 任意のID
organization_url_name: null
slide: false
ignorePublish: false
---
```
- title: 記事タイトル（ダブルクォート不要）
- tags: 配列（各タグはインデント付きハイフンで列挙）
- private, updated_at, id, organization_url_name, slide, ignorePublish などQiita独自フィールド
- emoji, type, topics, published などは使わない

### Zenn（@/articles 配下）
Zenn用記事では、以下のYAML形式のフロントマターを冒頭に記載します。

```yaml
---
title: "記事タイトル"
emoji: "💭"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["タグ1", "タグ2"]
published: true
---
```
- title, emoji, type, topics, published を使用
- Qiita用のtags, private, updated_at, id, organization_url_name, slide, ignorePublish などは不要

### note（@/note 配下）
note用記事では、ハッシュタグ管理のために以下のYAML形式のフロントマターを冒頭に記載します。

```yaml
---
title: "記事タイトル"
note_hashtags: "#タグ1 #タグ2 #タグ3 #タグ4 #タグ5"
---
```
- title: 記事タイトル（ダブルクォート必須）
- note_hashtags: note投稿用のハッシュタグ（#付きでスペース区切り、5-7個程度）
  - 英数字、ひらがな、カタカナ、漢字のみ使用
  - 記号（/、-、_など）は使用不可
  - 関連性の高いタグのみ厳選する。本文にない流行語や、読者の期待をずらす広すぎるタグで水増ししない
  - タイトル・導入・主要見出しにある具体語を起点に、記事の中心テーマが一目で伝わるタグをまず選ぶ
  - そのうえで、note内で読者が検索しそうな一般語を組み合わせる。例: 固有のAIサービス名だけに寄せず、内容に合う場合は「生成AI」「画像生成AI」「AI活用」「ゲーム制作」などを混ぜる
  - 投稿直前にはnoteのタグ検索候補や同テーマの記事を確認できる場合に限り、実際に使われている表記を優先する。ただし、検索量・投稿数が多くても記事内容と合わないタグは選ばない
  - 同義語を並べすぎず、「広い入口」「具体的なテーマ」「読者の利用目的」が重複しない5〜7個にする
- note公開時にはフロントマターを削除してコピー

## 見出し構成
- H1: 記事タイトル
- H2: 主要セクション
- H3: サブセクション
- H4以降: 詳細な説明
<<<<<<<< HEAD:codex/structure.md
- **見出しの後には必ず1行空白を入れてください。**

## Markdown記法の基本ルール
- **次が空行でない改行には、行末にスペース2つ（半角2つ）を必ずつけてください。**
  - これによりMarkdownで意図した改行が反映されます。 

## Gitブランチ戦略
- **mainブランチ**: 公開済みの記事を管理します。直接のプッシュは原則禁止です。
- **記事執筆ブランチ**: 新しい記事を書く、または既存の記事を修正する場合は、必ず`main`ブランチから新しいブランチを作成してください。
  - ブランチ名の例: `feature/20250919_new-article-name`
- **Pull Request**: 執筆が完了したら、`main`ブランチへのPull Requestを作成します。セルフレビュー後、マージしてください。
========
- 見出しの後には必ず1行空白を入れてください。

## Markdown記法の基本ルール
- 次が空行でない改行には、行末にスペース2つ（半角2つ）を必ずつけてください。
  - これによりMarkdownで意図した改行が反映されます。

## Gitブランチ戦略
- mainブランチ: 公開済みの記事を管理します。直接のプッシュは原則禁止です。
- 記事執筆ブランチ: 新しい記事を書く、または既存の記事を修正する場合は、必ず`main`ブランチから新しいブランチを作成してください。
  - ブランチ名の例: `feature/20250919_new-article-name`
- Pull Request: 執筆が完了したら、`main`ブランチへのPull Requestを作成します。セルフレビュー後、マージしてください。

>>>>>>>> codex:AGENTS/structure.md
