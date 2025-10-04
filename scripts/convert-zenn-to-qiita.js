const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml'); // ← 追加インストール必要

// インストールしていない場合：npm install js-yaml

// ヘルプメッセージを表示する関数
function showHelp() {
  console.log(`
使用方法: node convert-zenn-to-qiita.js <ファイル名>

説明:
  ZennからQiita用にMarkdownファイルを変換します。
  - フロントマターの形式を変換
  - 画像URLをGitHub Rawリンクに変換
  - タグの数を制限（Qiitaは最大5個）

引数:
  <ファイル名>    変換するMarkdownファイル名（./articles/ 内のファイル）

オプション:
  -h, --help     このヘルプメッセージを表示

例:
  node convert-zenn-to-qiita.js sample-article.md
  `);
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
const targetFile = args[0];

// ヘルプオプションのチェック
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (!targetFile) {
  console.error('❌ 変換するファイル名を指定してください\n');
  showHelp();
  process.exit(1);
}

const inputDir = './articles';
const outputDir = './public';

const inputPath = path.join(inputDir, targetFile);
const outputPath = path.join(outputDir, targetFile);

if (!fs.existsSync(inputPath)) {
  console.error(`❌ 指定されたファイルが見つかりません: ${inputPath}`);
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const content = fs.readFileSync(inputPath, 'utf8');
const parsed = matter(content);

// 画像URLを変換する関数
function convertImageUrls(content) {
  // Markdownの画像構文を検出する正規表現
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  return content.replace(imageRegex, (match, alt, url) => {
    // 画像URLを変換
    const newUrl = `https://raw.githubusercontent.com/gumigumih/zenn-qiita/main${url}`;
    return `<img src="${newUrl}" alt="${alt}">`;
  });
}

const title = parsed.data.title || 'タイトル未設定';
const tags = parsed.data.topics || [];

if (tags.length > 5) {
  console.warn(
    `⚠️ ${targetFile} のタグ数が ${tags.length} 個あります（Qiitaでは最大5個まで）。手動で調整してください。`
  );
}

const qiitaFrontmatter = {
  title,
  tags: tags.slice(0, 5),
  private: parsed.data.published === false,
  updated_at: '',
  id: null,
  organization_url_name: null,
  slide: false,
  ignorePublish: false,
};

// 画像URLを変換
const convertedContent = convertImageUrls(parsed.content);

// YAML文字列を手動で生成して、記事内容を結合
const yamlHeader = yaml.dump(qiitaFrontmatter, { lineWidth: 0 });
const newContent = `---\n${yamlHeader}---\n${convertedContent}`;

fs.writeFileSync(outputPath, newContent);
console.log(`✅ ${targetFile} を ${outputPath} に変換しました`);
