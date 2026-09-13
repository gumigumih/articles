# Qiitaルール

## 適用対象と読む順番

`qiita/`配下の記事に適用します。まず`AGENTS/common/writing-workflow.md`とこのファイルを読み、必要に応じて`AGENTS/common/structure.md`、`AGENTS/common/quality.md`、`AGENTS/common/link.md`、`AGENTS/common/image.md`を追加で確認します。

## 読者と記事の方向性

- 対象: 実装を行うエンジニア
- 内容: 具体的な実装手順、コード、How to
- 構成: 手順書形式で、再現可能なコード例を含める
- 目的: 業務効率化と技術的な再現性

## フロントマター

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

- `title`: ダブルクォート不要。
- `tags`: 配列で記載する。
- `private`、`updated_at`、`id`、`organization_url_name`、`slide`、`ignorePublish`などQiita固有のフィールドを使う。
- `emoji`、`type`、`topics`、`published`などZenn固有のフィールドは使わない。

## 文体

- です・ます調で統一する。
- 技術的な説明は簡潔・客観的にし、手順と前提条件を明確にする。
- 体験談は手順や再現条件を補足する範囲に留める。
- 絵文字は控えめにする。
