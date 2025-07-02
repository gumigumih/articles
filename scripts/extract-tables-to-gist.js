const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 設定ファイルを読み込む
let config = {};
const configPath = path.join(__dirname, '..', 'gist.config.json');

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Gist記録ファイルのパス
const gistRecordsPath = path.join(__dirname, '..', 'gist-records.json');

// Gist記録を読み込む
function loadGistRecords() {
  if (fs.existsSync(gistRecordsPath)) {
    return JSON.parse(fs.readFileSync(gistRecordsPath, 'utf8'));
  }
  return {};
}

// Gist記録を保存する
function saveGistRecords(records) {
  fs.writeFileSync(gistRecordsPath, JSON.stringify(records, null, 2), 'utf8');
}

// ヘルプメッセージを表示する関数
function showHelp() {
  console.log(`使用方法: npm run extract-tables <ファイル名> [オプション]

標準動作: 各表を個別のGistとしてアップロード（既存のGistがある場合は自動的に更新）

オプション:
  --help, -h     このヘルプメッセージを表示
  --delete       指定されたファイルの全てのGistを削除し、記録と埋め込み用URLを削除

例:
  npm run extract-tables 20250528_project-documents-guide.md
  npm run extract-tables 20250528_project-documents-guide.md --delete
  npm run extract-tables --help`);
}

// コマンドライン引数からファイルパスと操作を取得
const args = process.argv.slice(2);

// ヘルプオプションをチェック
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.length === 0) {
  console.error('エラー: ファイル名が指定されていません\n');
  showHelp();
  process.exit(1);
}

// オプションを抽出
const deleteMode = args.includes('--delete');
const inputFileName = args.find(arg => !arg.startsWith('--'));

if (!inputFileName) {
  console.error('エラー: ファイル名が指定されていません\n');
  showHelp();
  process.exit(1);
}

// ファイルパスを構築（note/フォルダを自動で前置）
const inputFilePath = inputFileName.startsWith('note/') ? inputFileName : path.join('note', inputFileName);

// Markdownファイルから表を抽出する関数
function extractTables(content) {
  const lines = content.split('\n');
  const tables = [];
  let currentTable = [];
  let inTable = false;
  let tableTitle = '';
  let tableStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 表の前のタイトルを探す（### や ## で始まる行）
    if (line.match(/^#{2,4}\s+(.+)/) && !inTable) {
      tableTitle = line.match(/^#{2,4}\s+(.+)/)[1];
    }
    
    // 表の開始を検出（|で始まり、|で終わる行）
    if (line.trim().match(/^\|.*\|$/)) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
        tableStartLine = i;
      }
      currentTable.push(line);
    } else if (inTable) {
      // 表の終了
      if (currentTable.length > 0) {
        tables.push({
          title: tableTitle || `表${tables.length + 1}`,
          content: currentTable.join('\n'),
          startLine: tableStartLine,
          endLine: i - 1
        });
      }
      inTable = false;
      currentTable = [];
      tableTitle = '';
      tableStartLine = -1;
    }
  }
  
  // ファイル末尾で表が終了する場合
  if (inTable && currentTable.length > 0) {
    tables.push({
      title: tableTitle || `表${tables.length + 1}`,
      content: currentTable.join('\n'),
      startLine: tableStartLine,
      endLine: lines.length - 1
    });
  }
  
  return tables;
}

// 既存のGistを更新する関数
async function updateGist(gistId, filename, content, description) {
  if (!config.github_token) {
    console.error('エラー: GitHub Personal Access Tokenが設定されていません。');
    return null;
  }

  try {
    const response = await axios.patch(`https://api.github.com/gists/${gistId}`, {
      description: description,
      files: {
        [filename]: {
          content: content
        }
      }
    }, {
      headers: {
        'Authorization': `token ${config.github_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'note-table-extractor'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Gistの更新に失敗しました:', error.response?.data || error.message);
    return null;
  }
}

// Gistを削除する関数
async function deleteGist(gistId) {
  if (!config.github_token) {
    console.error('エラー: GitHub Personal Access Tokenが設定されていません。');
    return false;
  }

  try {
    await axios.delete(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${config.github_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'note-table-extractor'
      }
    });

    return true;
  } catch (error) {
    console.error('Gistの削除に失敗しました:', error.response?.data || error.message);
    return false;
  }
}

// 記事ファイルに埋め込み用URLをコメントとして追加する関数
function addGistUrlsToArticle(articlePath, tables, gistRecords, baseFileName) {
  try {
    const content = fs.readFileSync(articlePath, 'utf8');
    const lines = content.split('\n');
    let addedComments = 0;
    let updatedComments = 0;
    
    // 後ろの表から処理することで、行番号のずれを回避
    for (let i = tables.length - 1; i >= 0; i--) {
      const table = tables[i];
      const recordKey = `${baseFileName}_table${i + 1}`;
      
      if (gistRecords[recordKey]) {
        const newGistUrl = `${gistRecords[recordKey].url}`;
        const newComment = `<!-- Gist埋め込み用URL: ${newGistUrl} -->`;
        
        // 表の終了行の次の行をチェック
        const nextLineIndex = table.endLine + 1;
        const nextLine = lines[nextLineIndex];
        
        // 既にGist埋め込み用URLのコメントが存在するかチェック
        if (nextLine && nextLine.includes('<!-- Gist埋め込み用URL:')) {
          // 既存のURLと新しいURLを比較
          if (nextLine.trim() === newComment) {
            // URLが同じ場合はスキップ
            console.log(`  ${i + 1}. ${table.title}: 埋め込み用URLは既に最新です`);
            continue;
          } else {
            // URLが異なる場合は更新
            lines[nextLineIndex] = newComment;
            updatedComments++;
            console.log(`  ${i + 1}. ${table.title}: 埋め込み用URLを更新しました`);
          }
        } else {
          // コメントが存在しない場合は新規追加
          lines.splice(nextLineIndex, 0, newComment);
          addedComments++;
          console.log(`  ${i + 1}. ${table.title}: 埋め込み用URLを追加しました`);
        }
      }
    }
    
    // 修正したファイルを保存
    if (addedComments > 0 || updatedComments > 0) {
      fs.writeFileSync(articlePath, lines.join('\n'), 'utf8');
      if (addedComments > 0 && updatedComments > 0) {
        console.log(`📝 記事ファイルに${addedComments}個の埋め込み用URLを追加し、${updatedComments}個を更新しました: ${articlePath}`);
      } else if (addedComments > 0) {
        console.log(`📝 記事ファイルに${addedComments}個の埋め込み用URLを追加しました: ${articlePath}`);
      } else {
        console.log(`📝 記事ファイルで${updatedComments}個の埋め込み用URLを更新しました: ${articlePath}`);
      }
    } else {
      console.log(`📝 埋め込み用URLは既に最新のため、記事ファイルの変更はありませんでした`);
    }
    
  } catch (error) {
    console.error('記事ファイルへのURL追加に失敗しました:', error.message);
  }
}

// 新しいGistを作成する関数
async function createGist(filename, content, description) {
  if (!config.github_token) {
    console.error('エラー: GitHub Personal Access Tokenが設定されていません。');
    console.log('gist.config.jsonファイルを作成して、以下の形式で設定してください:');
    console.log('{"github_token": "your_github_token_here"}');
    return null;
  }

  try {
    const response = await axios.post('https://api.github.com/gists', {
      description: description,
      public: config.public_gist !== false, // デフォルトはpublic
      files: {
        [filename]: {
          content: content
        }
      }
    }, {
      headers: {
        'Authorization': `token ${config.github_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'note-table-extractor'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Gistの作成に失敗しました:', error.response?.data || error.message);
    return null;
  }
}

// 記事ファイルから埋め込み用URLをコメントを削除する関数
function removeGistUrlsFromArticle(articlePath, tables, gistRecords, baseFileName) {
  try {
    const content = fs.readFileSync(articlePath, 'utf8');
    const lines = content.split('\n');
    let removedComments = 0;
    
    // 後ろの表から処理することで、行番号のずれを回避
    for (let i = tables.length - 1; i >= 0; i--) {
      const table = tables[i];
      const recordKey = `${baseFileName}_table${i + 1}`;
      
      // 表の終了行の次の行をチェック
      const nextLineIndex = table.endLine + 1;
      const nextLine = lines[nextLineIndex];
      
      // Gist埋め込み用URLのコメントが存在する場合は削除
      if (nextLine && nextLine.includes('<!-- Gist埋め込み用URL:')) {
        lines.splice(nextLineIndex, 1);
        removedComments++;
        console.log(`  ${i + 1}. ${table.title}: 埋め込み用URLコメントを削除しました`);
      } else {
        console.log(`  ${i + 1}. ${table.title}: 埋め込み用URLコメントが見つかりませんでした`);
      }
    }
    
    // 修正したファイルを保存
    if (removedComments > 0) {
      fs.writeFileSync(articlePath, lines.join('\n'), 'utf8');
      console.log(`📝 記事ファイルから${removedComments}個の埋め込み用URLコメントを削除しました: ${articlePath}`);
    } else {
      console.log(`📝 削除する埋め込み用URLコメントがありませんでした`);
    }
    
  } catch (error) {
    console.error('記事ファイルからのURL削除に失敗しました:', error.message);
  }
}

// メイン処理
async function main() {
  try {
    // ファイルの存在確認
    if (!fs.existsSync(inputFilePath)) {
      console.error(`エラー: ファイルが見つかりません: ${inputFilePath}`);
      process.exit(1);
    }

    console.log(`ファイルを読み込み中: ${inputFilePath}`);
    const content = fs.readFileSync(inputFilePath, 'utf8');
    
    console.log('表を抽出中...');
    const tables = extractTables(content);
    
    if (tables.length === 0) {
      console.log('表が見つかりませんでした。');
      return;
    }

    console.log(`${tables.length}個の表が見つかりました。`);

    // ファイル名を生成
    const baseFileName = path.basename(inputFilePath, '.md');
    const gistRecords = loadGistRecords();

    if (deleteMode) {
      // 削除モード
      console.log(`\n各表のGistを削除中...`);
      
      let deletedCount = 0;
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const tableIndex = i + 1;
        const recordKey = `${baseFileName}_table${tableIndex}`;
        
        if (gistRecords[recordKey]) {
          console.log(`  ${tableIndex}. ${table.title} を削除中... (ID: ${gistRecords[recordKey].id})`);
          const deleteResult = await deleteGist(gistRecords[recordKey].id);
          
          if (deleteResult) {
            console.log(`     ✅ Gist削除完了! `);
            delete gistRecords[recordKey];
            deletedCount++;
          } else {
            console.log(`     ❌ Gist削除失敗: ${table.title}`);
          }
        } else {
          console.log(`  ${tableIndex}. ${table.title}: 削除対象のGistが見つかりませんでした`);
        }
      }
      
      if (deletedCount > 0) {
        saveGistRecords(gistRecords);
        console.log(`\n📝 ${deletedCount}個のGist記録を削除しました`);
      }
      
      // 記事ファイルから埋め込み用URLコメントを削除
      removeGistUrlsFromArticle(inputFilePath, tables, gistRecords, baseFileName);
      
      console.log('\n🗑️ 全ての表のGist削除が完了しました!');
      
    } else {
      // 通常のアップロードモード
      console.log(`\n各表を個別のGistにアップロード中...`);
      
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const tableIndex = i + 1;
        const cleanTitle = table.title
          .replace(/[<>:"/\\|?*]/g, '') // Windows不正文字を除去
          .replace(/\s+/g, '_')          // スペースをアンダースコアに
          .substring(0, 30);             // 長すぎる場合は30文字まで
        
        const tableFileName = `table${tableIndex}_${cleanTitle}.md`;
        const recordKey = `${baseFileName}_table${tableIndex}`;
        
        // 表の内容のみ
        const tableContent = table.content;
        
        let gistResult = null;
        
        if (gistRecords[recordKey]) {
          // 既存のGistを更新
          console.log(`  ${tableIndex}. ${table.title} を更新中... (ID: ${gistRecords[recordKey].id})`);
          gistResult = await updateGist(
            gistRecords[recordKey].id,
            tableFileName,
            tableContent,
            `${table.title} - ${baseFileName}から抽出 (更新: ${new Date().toLocaleString('ja-JP')})`
          );
        } else {
          // 新しいGistを作成
          console.log(`  ${tableIndex}. ${table.title} をアップロード中...`);
          gistResult = await createGist(
            tableFileName,
            tableContent,
            `${table.title} - ${baseFileName}から抽出`
          );
        }
        
        if (gistResult) {
          // 記録を保存
          gistRecords[recordKey] = {
            id: gistResult.id,
            url: gistResult.html_url,
            filename: tableFileName,
            title: table.title,
            lastUpdated: new Date().toISOString()
          };
          console.log(`     ✅ 完了! URL: ${gistResult.html_url}`);
        } else {
          console.log(`     ❌ 失敗: ${table.title}`);
        }
      }
      
      saveGistRecords(gistRecords);
      
      // 記事ファイルに埋め込み用URLをコメントとして追加
      addGistUrlsToArticle(inputFilePath, tables, gistRecords, baseFileName);
      
      console.log('\n🎉 全ての表の個別Gistアップロードが完了しました!');
      console.log('\n📝 各表の後に埋め込み用URLをコメントとして追加しました');
      console.log('\n📝 埋め込み用URL一覧:');
      
      for (let i = 0; i < tables.length; i++) {
        const recordKey = `${baseFileName}_table${i + 1}`;
        if (gistRecords[recordKey]) {
          console.log(`  ${i + 1}. ${gistRecords[recordKey].title}: ${gistRecords[recordKey].url}`);
        }
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main(); 