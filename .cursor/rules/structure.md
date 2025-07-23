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

### note
noteではフロントマターは不要です。

## 見出し構成
- H1: 記事タイトル
- H2: 主要セクション
- H3: サブセクション
- H4以降: 詳細な説明

## Markdown記法の基本ルール
- **次が空行でない改行には、行末にスペース2つ（半角2つ）を必ずつけてください。**
  - これによりMarkdownで意図した改行が反映されます。 