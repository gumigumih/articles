<!-- Relative script/asset paths in this reference are resolved from the skill root unless stated otherwise. -->

## 本文修正の委譲

- 「修正して」「反映して」「書き直して」など、本文への変更を明示的に依頼された場合は、8ロールのレビュー結果を整理してClaude CLIへ渡し、Claudeに対象記事を修正させる。
- Claude CLIには、対象記事の絶対パス、関連するAGENTSルール、採用する修正点、維持するマガジンの文体・読者価値、公開不可情報を含める。確認できない事実や、ユーザーが公開不可とした実データ・固有名詞は追加しない。
- 実行時は対象リポジトリを作業ディレクトリにし、`/opt/homebrew/bin/claude -p`へ修正指示を渡す。ファイル編集を許可する場合は`--permission-mode acceptEdits`を使い、`--max-turns`も必要最小限にする。既存の`run_claude_writing.sh`は新規記事執筆用のため、本文修正には流用しない。
- Claude CLIの実行前に、Anthropic側の利用料金が発生・増加する可能性と、実行対象環境をユーザーに明記する。ユーザーの明示的な修正依頼を実行許可として扱う。
- Claude CLIは対象記事だけを編集し、note・Xへの投稿、画像生成、コミット、pushは行わない。実行後は`git diff`で対象範囲と事実・公開範囲を確認し、必要ならCodexで再レビューする。
- レビューや壁打ちだけの依頼では、Claude CLIを実行せず、記事ファイルも編集しない。

