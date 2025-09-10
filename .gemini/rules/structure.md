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
  - 関連性の高いタグのみ厳選
- note公開時にはフロントマターを削除してコピー

## 見出し構成
- H1: 記事タイトル
- H2: 主要セクション
- H3: サブセクション
- H4以降: 詳細な説明

## Markdown記法の基本ルール
- **次が空行でない改行には、行末にスペース2つ（半角2つ）を必ずつけてください。**
  - これによりMarkdownで意図した改行が反映されます。 