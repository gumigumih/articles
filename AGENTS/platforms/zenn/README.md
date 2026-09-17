# Zennルール

## 適用対象と読む順番

`zenn/`配下の記事に適用します。まず`AGENTS/common/writing-workflow.md`とこのファイルを読み、必要に応じて`AGENTS/common/structure.md`、`AGENTS/common/quality.md`、`AGENTS/common/link.md`、`AGENTS/common/image.md`を追加で確認します。

## 読者と記事の方向性

- 対象: エンジニア、PdM、設計に興味がある人
- 内容: 技術選定理由、設計思想、改善プロセス
- 構成: 考察を中心に、必要なら図解・フローチャートを使う
- 目的: 考え方の共有とナレッジ蓄積

## フロントマター

```yaml
---
title: "記事タイトル"
emoji: "💭"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["タグ1", "タグ2"]
published: true
---
```

`tags`、`private`、`updated_at`、`organization_url_name`、`slide`、`ignorePublish`などQiita固有のフィールドは使いません。

## `type`の判断

- `tech`: 実際に動かして検証した内容、内部実装、アーキテクチャ、具体的な技術的洞察が主題。
- `idea`: 技術に直接関係しない話題、抽象的な考察、情報の要約・紹介が主題。
- 自社・個人開発の機能紹介は、実装や設計の深掘りが主なら`tech`、紹介が主なら`idea`。
- リリース速報・イベント参加レポートは、実検証が主なら`tech`、要約・紹介が主なら`idea`。

## 文体

ぐみ名義の執筆・推敲には `.agents/skills/gumi-writing-style/SKILL.md` の共通方針とZenn向け方針を参照します。

- です・ます調を基本にし、考察や主張では「〜だ」「〜である」も使える。
- 技術的背景や設計思想は論理的に説明する。
- 体験談や失敗談は、事実と判断を分けて書く。
- 読者への語りかけは柔らかく、絵文字は適度に使う。
