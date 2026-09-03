#!/bin/zsh

set -euo pipefail

repo_dir="/Users/meggumi/Github/gumigumih/articles"
mode="${1:-weekly}"
cd "$repo_dir"

# Codexの非ログインシェルでも、ユーザーが設定したClaude OAuthトークンを利用する。
if [[ -r ~/.zshrc ]]; then
  source ~/.zshrc
fi

if [[ "$mode" == "monthly" ]]; then
  latest_candidates=$(find topics -maxdepth 1 -type f -name '*-monthly-analysis.md' -print | sort | tail -n 1)
else
  latest_candidates=$(find topics -maxdepth 1 -type f -name '*-candidates.md' -print | sort | tail -n 1)
fi
if [[ -z "$latest_candidates" ]]; then
  print -u2 '候補一覧が見つかりません。'
  exit 2
fi

prompt=$(cat <<EOF
ChatGPTが作成した調査・分析結果をもとに、Claudeは文章化だけを行ってください。

対象リポジトリ: $repo_dir
候補・分析メモ: $latest_candidates

AGENTS/weekly-ai-note-prompt.md と AGENTS/monetization.md、およびAGENTS配下の執筆ルールを読み、
$(if [[ "$mode" == "monthly" ]]; then print '月次分析メモをもとに、noteアカウントのお知らせ記事を1本作成してください。'; else print '候補一覧に「推奨」「採用」と明記された項目だけを使って記事下書きを作成してください。推奨・採用項目がない場合は記事を作成せず、その旨を報告してください。'; fi)

ニュースの追加調査、Web検索、企業情報の補足、独自の事業性・UX・技術分析は禁止します。候補一覧と分析メモにある事実だけを使い、不足情報は推測せず「要確認」としてください。

記事本文、カバー画像用ChatGPTプロンプト、X投稿文下書きを note/ に保存してください。noteへの投稿、Xへの投稿、画像生成、コミット、pushは行わないでください。
EOF
)

# 非対話モードでは編集許可の確認を表示できないため、記事下書きの編集を明示的に許可する。
exec /opt/homebrew/bin/claude -p "$prompt" --output-format text --max-turns 8 --permission-mode acceptEdits --no-chrome
