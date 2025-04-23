---
title: "REST API・BFF・GraphQLの違いと使い分けを整理してみた（＋有名サービスの実例付き）"
emoji: "💨"
type: "tech"
topics: ["API", "GraphQL", "BFF", "Web開発", "API開発"]
published: true
---

# はじめに
アプリ開発をしていると、「APIってどう設計すればいいんだっけ？」と迷うことは少なくありません。特に REST API、BFF（Backend For Frontend）、GraphQL の3つは、それぞれ思想も向いているケースも違うため、正解がわかりづらい領域です。

この記事では、それぞれの設計手法について調べた内容をもとに、違いや使い分け方を整理してみました。よく使われている実際のサービスの例も紹介しているので、API設計に悩んでいる方の判断材料になれば幸いです。

---

# それぞれの概要とAPI例（＋向いているフロントエンド）

## REST API

- リソース単位で設計されたAPI
- HTTPの標準メソッド（GET, POST, PUT, DELETE）を使用
- 再利用性が高く、外部連携にも向いている

### よくあるAPIエンドポイント例

```http
GET    /users
GET    /users/{id}
POST   /users
PUT    /users/{id}
DELETE /users/{id}
GET    /users/{id}/posts
```

### 向いているフロントエンド

- **SPA（Single Page Application）**
- **管理画面系UI**
- **複数クライアント（Web＋モバイル＋API連携）**

---

## BFF（Backend For Frontend）

- 特定の画面やデバイスに最適化されたAPI
- 「1画面＝1エンドポイント」構成で、必要な情報をまとめて返す
- 通信回数が減り、初期表示のパフォーマンスに強い

### よくあるAPIエンドポイント例

```http
GET /api/dashboard/init
GET /api/profile-page/init
GET /api/product-detail/123
POST /api/checkout/confirm
```

### 向いているフロントエンド

- **モバイルアプリ（iOS/Android）**
- **画面単位で開発するプロジェクト**
- **SSR系フレームワーク（Next.js など）**

---

## GraphQL

- クライアントが必要なデータ構造を定義し、サーバーにリクエスト
- 単一エンドポイント（通常 `/graphql`）で複数リソースにアクセス
- 欲しい情報だけ取得できるが、設計と運用の複雑さも伴う

### よくあるGraphQLリクエスト例

```graphql
query {
  user(id: "1") {
    name
    email
    posts {
      title
    }
  }
}
```

### 向いているフロントエンド

- **柔軟にデータ構造が変化するUI**
- **複数チーム・複数フロントをまたぐプロダクト**
- **Apollo Client / Relay を使ったSPA**

---

# 比較表

| 項目 | REST API | BFF | GraphQL |
|------|----------|-----|---------|
| 設計単位 | リソース | 画面 | フィールド |
| エンドポイント構成 | 複数 | 画面単位 | 単一 |
| フロント側の組み立て | 必要 | ほぼ不要 | 必要（だが柔軟） |
| 通信効率 | 普通 | 高 | 高 |
| 再利用性 | 高 | 低め | 高いが設計依存 |
| サーバー実装コスト | 中 | 中 | 高 |
| キャッシュ性 | 高（HTTP対応） | 普通 | 低（手動対応が必要） |

---

# 向いているケースまとめ

| 状況 | 向いている設計 |
|------|----------------|
| データを再利用したい | REST API |
| 表示最適化・通信最小化が重要 | BFF |
| 柔軟なデータ取得・複数クライアント対応 | GraphQL |

---

# 実際のサービス事例

## GitHub

- **REST API**: https://docs.github.com/en/rest
- **GraphQL API**: https://docs.github.com/en/graphql

GitHub は両方の方式を提供しており、RESTは汎用的なリソースアクセスに、GraphQLは柔軟で効率的なクエリ取得に向いています。

## Netflix

- [BFFパターン紹介](https://netflixtechblog.com/embracing-bff-pattern)

Netflix では、デバイス（モバイル・TV・Web）ごとに BFF を構築しており、画面に必要な情報をまとめて取得する構成が採用されています。

## Shopify

- [GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)

Shopify も REST と GraphQL の両方を提供しており、現在は GraphQL が推奨されています。必要なデータを効率よく取得できる利点があります。

## メルカリ

- [モバイル向けBFF導入](https://engineering.mercari.com/blog/entry/20210316-bff-android-ios/)

モバイルアプリの初期表示速度を最適化するために、画面単位のBFF構成を採用しています。

---

# ハイブリッド構成例

![](/images/rest-bff-graphql/image1.png)

---

# まとめ（API設計とフロントエンドの対応表）

> ※筆者自身は GraphQL をまだ実装したことはなく、あくまで調査ベースでの整理となっています。
> 実際に手を動かした経験としては REST API と BFF の方が多いです。GraphQL にも今後トライしてみたい！という気持ちはあります 😄

| API設計 | 向いているフロントエンド例 |
|---------|----------------------------|
| REST API | Web SPA、管理画面、外部API連携あり |
| BFF | モバイルアプリ、SSR Webアプリ、画面単位での開発 |
| GraphQL | 柔軟に変わるUI、複数チーム/クライアントが存在するプロダクト |

---

読んでくださってありがとうございました！APIの設計に正解はありませんが、目的に応じた選択をするための整理になれば嬉しいです。

もし他にもこんな設計方針で悩んだ経験がある方は、ぜひコメントなどで教えてください。

