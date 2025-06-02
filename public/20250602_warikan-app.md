---
title: 【実装Tips】React + TypeScriptで作る割り勘計算アプリの実装ポイント
tags:
  - TypeScript
  - React
  - chartjs
  - html2canvas
private: false
updated_at: '2025-06-02T20:16:12+09:00'
id: 0f201d72decb957a6586
organization_url_name: null
slide: false
ignorePublish: false
---

<img src="https://raw.githubusercontent.com/gumigumih/zenn-qiita/main/images/20250602_warikan-app/cover.png" alt="わりまるのスクリーンショット">

# はじめに

こんにちは、ぐみと申します。今回は、React + TypeScript で実装した割り勘計算アプリ「わりまる」の実装ポイントについて解説します。

本アプリは、AI を活用した開発ツール「Cursor」を使用して実装しました。Cursor の特徴である、コード補完やリファクタリングの提案機能を活用することで、開発効率を大幅に向上させることができました。

# 技術スタック

- フロントエンド: React + TypeScript
- スタイリング: Tailwind CSS
- グラフ表示: Tailwind CSS（カスタムコンポーネント）
- 画像生成: html2canvas Pro
- デプロイ: GitHub Pages
- 開発環境: Cursor（AI を活用した開発ツール）

# 開発環境の選定

## Cursor を選んだ理由

1. AI による開発支援

   - コード補完の精度が高い
   - リファクタリングの提案が的確
   - エラーの早期発見と修正提案

2. 開発効率の向上

   - ボイラープレートコードの自動生成
   - コンポーネントの構造化支援
   - 型定義の自動補完

3. 学習コストの低さ
   - 直感的な UI
   - VSCode ライクな操作性
   - 豊富なショートカット

# 実装のポイント

## 1. キーボード操作の最適化

### シンプルモードと詳細モードの実装

```typescript
// シンプルモード用のキー操作
export const handleSimpleKeyDown = (
  e: KeyboardEvent<HTMLInputElement>,
  savePayment: SavePaymentFunction
) => {
  // シンプルモード用のフォーカス移動関数
  const moveFocusSimple = (direction: 'up' | 'down') => {
    const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]')) as HTMLInputElement[];
    const currentIndex = allInputs.indexOf(e.currentTarget);
    const targetIndex = currentIndex + (direction === 'down' ? 1 : -1);

    if (targetIndex >= 0 && targetIndex < allInputs.length) {
      allInputs[targetIndex].focus();
    }
  };

  // 保存処理
  savePayment(0, e.currentTarget.value);

  if (e.key === 'Enter') {
    e.preventDefault();
    moveFocusSimple('down');
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveFocusSimple('down');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveFocusSimple('up');
  }
};

// 詳細モード用のキー操作
interface InputRow {
  id: string;
  amount: string;
  description: string;
}

export const handleDetailKeyDown = (
  index: number,
  field: 'amount' | 'description',
  e: KeyboardEvent<HTMLInputElement>,
  inputRows: InputRow[],
  savePayment: SavePaymentFunction,
  personId: string
) => {
  // 保存処理
  const amount = Number(currentRow.amount.replace(/,/g, '')) || 0;
  savePayment(personId, currentRow.id, amount, currentRow.description);

  // フォーカスを移動する関数
  const moveFocus = (direction: 'left' | 'right') => {
    const currentInput = e.currentTarget;
    const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]')) as HTMLInputElement[];
    const currentIndex = allInputs.indexOf(currentInput);
    const targetIndex = currentIndex + (direction === 'right' ? 1 : -1);

    if (targetIndex >= 0 && targetIndex < allInputs.length) {
      allInputs[targetIndex].focus();
    }
  };

  // 上下のフォーカスを移動する関数
  const moveFocusVertical = (direction: 'up' | 'down') => {
    const currentInput = e.currentTarget;
    const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]')) as HTMLInputElement[];
    const currentIndex = allInputs.indexOf(currentInput);
    const targetIndex = currentIndex + (direction === 'down' ? 2 : -2); // 2は1行あたりの入力フィールド数

    if (targetIndex >= 0 && targetIndex < allInputs.length) {
      allInputs[targetIndex].focus();
    }
  };

  // フィールドに応じたフォーカス移動
  if (e.key === 'Enter') {
    e.preventDefault();
    if (field === 'amount') {
      moveFocus('right');
    } else {
      moveFocusVertical('down');
    }
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (field === 'amount') {
      moveFocus('right');
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (field === 'description') {
      moveFocus('left');
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveFocusVertical('down');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveFocusVertical('up');
  }
};
```

### 実装のポイント

1. フォーカス移動の最適化

   - 入力フィールド間の移動をキーボードで完結
   - 上下左右の矢印キーでの移動
   - Enter キーでの次フィールドへの移動

2. 数値入力の最適化
   - 3 桁区切りの自動フォーマット
   - スマートフォンでの数値入力キーボード表示
   - 入力値の自動保存

## 2. 支払い状況の視覚化

```typescript
interface PaymentStatusProps {
  paymentStatus: {
    person: Person;
    paidAmount: number;
    difference: number;
    color: string;
    textColor: string;
  }[];
  maxPayment: number;
  perPersonAmount: number;
}

export const PaymentStatus = ({ paymentStatus, maxPayment, perPersonAmount }: PaymentStatusProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">支払い状況</h3>
      <div className="space-y-4 pb-3 relative">
        <div className="relative pb-2">
          {paymentStatus.map(({ person, paidAmount, color }) => {
            const percentage = (paidAmount / maxPayment) * 100;
            const perPersonPercentage = (perPersonAmount / maxPayment) * 100;
            return (
              <div key={person.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{person.name}</span>
                  <span className="text-gray-600 text-sm font-medium relative z-10">
                    {paidAmount.toLocaleString()}円
                  </span>
                </div>
                <div className="h-4 rounded-full overflow-hidden relative flex-1 bar-container">
                  <div className="h-full flex">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                      style={{ width: `${Math.min(percentage, perPersonPercentage)}%` }}
                    />
                    {percentage > perPersonPercentage && (
                      <div
                        className={`h-full ${color} transition-all duration-300 ease-in-out`}
                        style={{ width: `${percentage - perPersonPercentage}%` }}
                      />
                    )}
                    <div className="h-full w-full absolute top-0 left-0 pointer-events-none rounded-full border-2 border-gray-300" />
                  </div>
                </div>
              </div>
            );
          })}
          <div
            className="absolute top-0 bottom-0 w-0.5 h-full bg-red-500"
            style={{ left: `${(perPersonAmount / maxPayment) * 100}%` }}
          />
        </div>
        <div
          className="absolute text-xs text-red-500 font-medium"
          style={{
            left: `${(perPersonAmount / maxPayment) * 100}%`,
            bottom: '0%',
            width: '5rem',
            textAlign: 'center',
            transform: 'translateX(-50%)',
            marginTop: '0.5rem'
          }}
        >
          {perPersonAmount.toLocaleString()}円
        </div>
      </div>
    </div>
  );
};
```

### 実装のポイント

1. グラフ表示の最適化

   - Tailwind CSS によるレスポンシブデザイン
   - アニメーション効果の追加
   - 平均金額ラインの視覚化

2. パフォーマンスの考慮
   - メモ化による再レンダリングの最適化
   - スタイルの効率的な適用
   - アニメーションの最適化

## 3. 画像生成機能の実装

```typescript
const handleDownloadImage = async () => {
  if (!resultRef.current) return;

  // ロゴを表示
  const logoElement = document.getElementById('result-logo');
  if (logoElement) {
    logoElement.classList.remove('hidden');
  }

  // 背景を不透明に変更
  const resultElement = resultRef.current;
  const originalBackground = resultElement.style.background;
  resultElement.style.background = 'white';

  try {
    const canvas = await html2canvas(resultRef.current, {
      backgroundColor: '#ffffff',
      scale: 2, // より高品質な画像を生成
    });
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'わりまる_計算結果.png';
    link.click();
  } catch (error) {
    console.error('画像の生成に失敗しました:', error);
  } finally {
    // 背景を元に戻す
    resultElement.style.background = originalBackground;

    // ロゴを非表示に戻す
    if (logoElement) {
      logoElement.classList.add('hidden');
    }
  }
};
```

### 実装のポイント

1. 画像生成の最適化

   - 2 倍スケールでの高品質生成
   - 白背景での生成
   - エラーハンドリング

2. ユーザビリティの向上
   - ワンクリックでの保存
   - 分かりやすいファイル名
   - ロゴの表示/非表示制御

# まとめ

本記事では、React + TypeScript を使用した割り勘計算アプリの実装ポイントについて解説しました。特に以下の点に注目して実装を行いました：

1. キーボード操作の最適化

   - フォーカス移動の実装
   - 数値入力の最適化
   - 自動保存機能

2. 視覚化の実装

   - Tailwind CSS によるグラフ表示
   - アニメーション効果
   - レスポンシブデザイン

3. 画像生成機能
   - html2canvas の活用
   - 高品質な画像生成
   - エラーハンドリング

これらの実装により、ユーザーフレンドリーな割り勘計算アプリを実現することができました。

[→ わりまるを試す](https://warimaru.meggumi.com/)

---

最後まで読んでいただき、ありがとうございました！
もし気に入っていただけましたら、ぜひシェアをお願いします。

また、ご意見・ご要望などございましたら、お気軽にコメントください。

---

📚 関連記事：

- [【設計思想】割り勘計算アプリ「わりまる」の開発で学んだ、ユーザー体験を重視した設計のポイント](https://zenn.dev/gumigumih/articles/20250602_warikan-app) - 設計思想や開発の背景に焦点を当てた記事
- [【無料】割り勘計算 WEB サイト「わりまる」で、みんなで楽しむ行事の支払いをスマートに！](https://note.com/gumigumih/n/n8736a45fcd1e?sub_rt=share_pb) - ユーザー目線での機能紹介と使い方の解説
