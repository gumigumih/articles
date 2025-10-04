#!/bin/bash

# CI環境での実行をスキップ
if [ "$CI" = "true" ] || [ "$NODE_ENV" = "test" ]; then
    echo "🤖 CI環境を検出したため、Git Hooksのセットアップをスキップします"
    exit 0
fi

# Gitリポジトリでない場合は静かに終了
if [ ! -d ".git" ]; then
    echo "📝 Gitリポジトリではないため、Git Hooksのセットアップをスキップします"
    exit 0
fi

echo "🔧 Git Hooksをセットアップしています..."

# hooksディレクトリが存在することを確認
if [ ! -d ".git/hooks" ]; then
    echo "❌ .git/hooksディレクトリが見つかりません。"
    echo "   Gitリポジトリのルートディレクトリで実行してください。"
    exit 1
fi

# pre-pushフックをコピー
if [ -f "scripts/git-hooks/pre-push" ]; then
    cp scripts/git-hooks/pre-push .git/hooks/
    chmod +x .git/hooks/pre-push
    echo "✅ pre-pushフックをインストールしました"
else
    echo "❌ scripts/git-hooks/pre-pushが見つかりません"
    exit 1
fi

# 動作確認
echo ""
echo "🧪 フックの動作を確認しています..."
if [ -x ".git/hooks/pre-push" ]; then
    echo "✅ pre-pushフックが正常にインストールされました！"
    echo ""
    echo "📋 これで mainブランチへの直接プッシュが禁止されます。"
    echo "💡 フィーチャーブランチを使用してプルリクエストで作業してください。"
else
    echo "❌ フックのインストールに失敗しました"
    exit 1
fi 