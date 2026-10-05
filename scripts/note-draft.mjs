#!/usr/bin/env node

/**
 * note記事のローカル原稿を、検証・下書き準備・noteエディタ操作へ分けるCLI。
 *
 * 重要な境界:
 * - Markdown原稿と画像はリポジトリを正本にする
 * - validate / prepare は外部サービスへ書き込まない
 * - draft / update はブラウザを開くだけで、noteへの保存は --save が必要
 * - note_id は保存後に実際の編集画面URLから記録し、dateは公開後にだけ追加する
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const noteRoot = path.join(repoRoot, 'note');
const defaultEditorUrl = 'https://note.com/notes/new';
const defaultLoginUrl = 'https://note.com/login/';

function usage() {
  console.log(`
使い方:
  npm run note:validate -- note/<記事>.md
  npm run note:prepare -- note/<記事>.md
  npm run note:cover-prompt -- note/<記事>.md
  npm run note:draft -- note/<記事>.md
  npm run note:draft -- note/<記事>.md --save
  npm run note:login
  npm run note:update -- note/<公開済み記事>.md
  npm run note:update -- note/<下書き>.md --url <既存の編集画面URL>
  npm run note:update -- note/<記事>.md --save
  npm run note:publish -- note/<記事>.md --price <円> --confirm

コマンド:
  validate       フロントマター、画像参照、公開前メタデータを確認します
  prepare        noteへ渡す本文と画像一覧のマニフェストを temp/ に作成します
  cover-prompt   記事専用のカバー画像プロンプトを作成します
  draft          新規noteエディタを開き、タイトルと本文を入力します
  login          Playwright用のログインプロファイルでnoteへログインします
  update         既存noteの編集画面を開き、タイトルと本文を更新します
  publish        note公開設定を照合し、明示確認後に記事を公開します

オプション:
  --state draft|published  検証対象の公開状態（既定: draft）
  --out <dir>              prepareの出力先
  --manifest <file>        draftで利用するmanifest.json
  --url <url>              noteエディタURL
  --profile <dir>          Playwrightのログイン保持用プロファイル
  --preset <name>          カバープロンプトの種類（site-renewal|generic）
  --login                  未ログイン時にログイン完了まで待機します
  --login-timeout <ms>     ログイン待機時間（既定: 300000）
  --force                  既存のカバープロンプトを上書きする
  --upload-cover           カバー画像のアップロードを試みる
  --upload-images          本文の画像位置でnoteの画像アップロードを試みる
  --upload-files           note:fileブロックのファイル添付を試みる
  --upload-audio           note:audioブロックの音声添付を試みる
  --upload-comic           note:comicブロックのコミック作成を試みる
  --replace-body           update時に既存本文を全消去して原稿で置き換える（updateの既定動作）
  --preserve-body          update時に本文を変更しない（既存の埋め込み・手動設定を保護）
  --save                   note側の保存ボタンを押す（外部状態を変更します）
  --price <円>             有料記事の価格（無料記事は--freeを指定）
  --free                   無料記事として公開する
  --magazine <名前>        追加するマガジン（追加しない場合は--no-magazine）
  --membership-plan <名前> 追加するメンバーシッププラン（--no-membershipも指定可）
  --no-magazine            マガジンに追加しない
  --no-membership          メンバーシップに追加しない
  --confirm                設定反映と公開を実行する（外部状態を変更します）
  --stop-before-post       設定を反映し、最終の「投稿する」ボタン直前で停止する
  -h, --help               このヘルプを表示
`);
}

function parseArgs(argv) {
  const options = { state: 'draft' };
  const positional = [];
  const valueOptions = new Set([
    '--state', '--out', '--manifest', '--url', '--profile', '--preset', '--login-timeout', '--price', '--magazine', '--membership-plan',
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    if (arg === '--save') {
      options.save = true;
      continue;
    }
    if (arg === '--confirm' || arg === '--free' || arg === '--no-magazine' || arg === '--no-membership' || arg === '--stop-before-post') {
      options[{ '--confirm': 'confirm', '--free': 'free', '--no-magazine': 'noMagazine', '--no-membership': 'noMembership', '--stop-before-post': 'stopBeforePost' }[arg]] = true;
      continue;
    }
    if (arg === '--upload-images') {
      options.uploadImages = true;
      continue;
    }
    if (arg === '--upload-files') {
      options.uploadFiles = true;
      continue;
    }
    if (arg === '--upload-audio') {
      options.uploadAudio = true;
      continue;
    }
    if (arg === '--upload-comic') {
      options.uploadComic = true;
      continue;
    }
    if (arg === '--upload-cover') {
      options.uploadCover = true;
      continue;
    }
    if (arg === '--replace-body') {
      options.replaceBody = true;
      continue;
    }
    if (arg === '--preserve-body') {
      options.preserveBody = true;
      continue;
    }
    if (arg === '--force') {
      options.force = true;
      continue;
    }
    if (arg === '--login') {
      options.login = true;
      continue;
    }
    if (valueOptions.has(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} には値が必要です`);
      }
      options[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`不明なオプションです: ${arg}`);
    }
    positional.push(arg);
  }

  options.article = positional[0];
  return options;
}

function resolveArticlePath(input) {
  if (!input) {
    throw new Error('note記事のMarkdownファイルを指定してください');
  }

  const candidate = path.resolve(process.cwd(), input);
  const articlePath = fs.existsSync(candidate)
    ? candidate
    : path.resolve(repoRoot, input);
  const relative = path.relative(noteRoot, articlePath);

  if (!fs.existsSync(articlePath) || !fs.statSync(articlePath).isFile()) {
    throw new Error(`記事ファイルが見つかりません: ${input}`);
  }
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`note/配下の記事だけを対象にしてください: ${articlePath}`);
  }

  return articlePath;
}

function parseArticle(articlePath) {
  const raw = fs.readFileSync(articlePath, 'utf8').replaceAll('\r\n', '\n');
  const parsed = matter(raw);
  const body = parsed.content.trim();
  const title = typeof parsed.data.title === 'string' ? parsed.data.title.trim() : '';
  const coverMatch = body.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)\s*(?:\n|$)/i);
  const coverImage = coverMatch && coverMatch[1].toLowerCase() === 'coverimage'
    ? makeImageRef(articlePath, coverMatch[1], coverMatch[2])
    : null;
  const bodyWithoutCover = coverImage ? body.slice(coverMatch[0].length).trim() : body;
  const titleHeadingMatch = bodyWithoutCover.match(/^#\s+([^\n]+)\s*(?:\n|$)/);
  const bodyWithoutTitle = titleHeadingMatch && title && titleHeadingMatch[1].trim() === title
    ? bodyWithoutCover.slice(titleHeadingMatch[0].length).trim()
    : bodyWithoutCover;
  const paidMarkerMatch = bodyWithoutTitle.match(/<!--\s*note:paid-start\s*-->/i);
  const freeBody = paidMarkerMatch
    ? bodyWithoutTitle.slice(0, paidMarkerMatch.index).trim()
    : bodyWithoutTitle;
  const paidBody = paidMarkerMatch
    ? bodyWithoutTitle.slice(paidMarkerMatch.index + paidMarkerMatch[0].length).trim()
    : '';
  const imageRefs = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

  for (const match of bodyWithoutCover.matchAll(imagePattern)) {
    const [, alt, source] = match;
    imageRefs.push(makeImageRef(articlePath, alt, source));
  }

  const fileRefs = [];
  const filePattern = /<!--\s*note:file\s*-->\s*\n([^\n]+)\n\s*<!--\s*\/note:file\s*-->/gi;
  for (const match of bodyWithoutTitle.matchAll(filePattern)) {
    fileRefs.push(makeFileRef(articlePath, match[1].trim()));
  }
  const audioRefs = collectNotePathRefs(bodyWithoutTitle, articlePath, 'audio');
  const comicRefs = collectNotePathRefs(bodyWithoutTitle, articlePath, 'comic');

  return {
    articlePath,
    raw,
    frontmatter: parsed.data,
    body,
    bodyWithoutCover,
    bodyWithoutTitle,
    freeBody,
    paidBody,
    coverImage,
    paidMarker: paidMarkerMatch?.[0] || null,
    imageRefs,
    fileRefs,
    audioRefs,
    comicRefs,
  };
}

function extractEditorNoteId(url) {
  const match = String(url || '').match(/\/notes\/([^/?#]+)\/edit(?:[/?#]|$)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

function updateArticleNoteId(articlePath, noteId) {
  const raw = fs.readFileSync(articlePath, 'utf8');
  const lineEnding = raw.includes('\r\n') ? '\r\n' : '\n';
  const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/);
  if (!frontmatterMatch) {
    throw new Error(`frontmatterがないためnote_idを更新できません: ${articlePath}`);
  }

  let frontmatter = frontmatterMatch[1].replaceAll('\r\n', '\n');
  const noteIdLine = `note_id: ${JSON.stringify(noteId)}`;
  if (/^note_id\s*:/m.test(frontmatter)) {
    frontmatter = frontmatter.replace(/^note_id\s*:.*$/m, noteIdLine);
  } else {
    frontmatter = `${frontmatter}\nnote_id: ${JSON.stringify(noteId)}`;
  }

  const updatedFrontmatter = frontmatter.replaceAll('\n', lineEnding);
  const updated = `---${lineEnding}${updatedFrontmatter}${lineEnding}---${raw.slice(frontmatterMatch[0].length)}`;
  if (updated !== raw) fs.writeFileSync(articlePath, updated);
}

function recordPublishedArticle(articlePath, noteId) {
  const raw = fs.readFileSync(articlePath, 'utf8');
  const lineEnding = raw.includes('\r\n') ? '\r\n' : '\n';
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/);
  if (!match) throw new Error(`frontmatterがないため公開情報を記録できません: ${articlePath}`);
  let frontmatter = match[1].replaceAll('\r\n', '\n');
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const fields = { note_id: JSON.stringify(noteId), date: today };
  for (const [key, value] of Object.entries(fields)) {
    const line = `${key}: ${value}`;
    if (new RegExp(`^${key}\\s*:`, 'm').test(frontmatter)) {
      frontmatter = frontmatter.replace(new RegExp(`^${key}\\s*:.*$`, 'm'), line);
    } else {
      frontmatter += `\n${line}`;
    }
  }
  const updated = `---${lineEnding}${frontmatter.replaceAll('\n', lineEnding)}${lineEnding}---${raw.slice(match[0].length)}`;
  if (updated !== raw) fs.writeFileSync(articlePath, updated);
}

function recordSavedDraftNoteId(manifestPath, manifest, pageUrl, state) {
  if (state !== 'draft') return null;
  const noteId = extractEditorNoteId(pageUrl);
  if (!noteId) {
    console.log(`⚠️ 編集画面URLからnote_idを取得できませんでした: ${pageUrl}`);
    return null;
  }

  updateArticleNoteId(manifest.articlePath, noteId);
  manifest.noteId = noteId;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✅ 下書きのnote_idを原稿へ反映しました: ${noteId}`);
  return noteId;
}

function makeImageRef(articlePath, alt, source) {
  const cleanSource = source.replace(/[?#].*$/, '');
  const isRemote = /^(?:https?:|data:)/i.test(cleanSource);
  const absolutePath = isRemote ? null : path.resolve(path.dirname(articlePath), cleanSource);
  return {
    alt,
    source,
    cleanSource,
    isRemote,
    absolutePath,
  };
}

function makeFileRef(articlePath, source) {
  const resource = parseNoteResourceValue(source);
  const cleanSource = resource.source.replace(/[?#].*$/, '');
  const isRemote = /^(?:https?:|data:)/i.test(cleanSource);
  const absolutePath = isRemote ? null : path.resolve(path.dirname(articlePath), cleanSource);
  return {
    source: resource.source,
    label: resource.label,
    cleanSource,
    isRemote,
    absolutePath,
  };
}

function parseNoteResourceValue(value) {
  const trimmed = value.trim();
  const link = trimmed.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/);
  if (link) {
    return { label: link[1].trim(), source: link[2].trim() };
  }
  return { label: '', source: trimmed };
}

function collectNotePathRefs(body, articlePath, name) {
  const refs = [];
  const lines = body.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const block = parseNoteBlock(lines, index, name);
    if (!block) continue;
    refs.push(makeFileRef(articlePath, block.value));
    index = block.nextIndex - 1;
  }
  return refs;
}

function validateArticle(article, state) {
  const errors = [];
  const warnings = [];
  const data = article.frontmatter;
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const hashtags = typeof data.note_hashtags === 'string'
    ? data.note_hashtags.trim().split(/\s+/).filter(Boolean)
    : [];

  if (!title) errors.push('frontmatterのtitleがありません');
  if (!article.bodyWithoutTitle) errors.push('本文が空です');
  if (!data.note_hashtags) {
    errors.push('frontmatterのnote_hashtagsがありません');
  } else if (hashtags.some((tag) => !tag.startsWith('#'))) {
    errors.push('note_hashtagsは#付きのスペース区切りで指定してください');
  } else if (hashtags.length < 5 || hashtags.length > 7) {
    warnings.push(`ハッシュタグは${hashtags.length}個です（目安は5〜7個）`);
  }

  if (state === 'draft') {
    if (data.note_id !== undefined && !String(data.note_id).trim()) {
      errors.push('note_idは空文字ではなく、保存済み編集画面の実在するIDを指定してください');
    }
    if (data.date !== undefined) {
      errors.push('公開日未確定の下書きにはdateを入れないでください');
    }
  } else if (state === 'published') {
    if (!data.note_id) warnings.push('published状態ですがnote_idがありません');
    if (!data.date) warnings.push('published状態ですがdateがありません');
  } else {
    errors.push(`stateが不正です: ${state}`);
  }

  const firstHeading = article.bodyWithoutCover.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (title && firstHeading && title !== firstHeading) {
    warnings.push('frontmatterのtitleと本文のH1が一致していません');
  }

  if (/!\[[^\]]*\]\((?:\/|file:|~\/)/i.test(article.body)) {
    errors.push('画像参照に絶対パスまたはfile://を使わないでください');
  }

  const allImages = article.coverImage ? [article.coverImage, ...article.imageRefs] : article.imageRefs;
  for (const image of allImages) {
    if (image.isRemote) {
      warnings.push(`外部画像はローカル検証・自動アップロードの対象外です: ${image.source}`);
      continue;
    }
    if (!fs.existsSync(image.absolutePath)) {
      errors.push(`画像が見つかりません: ${image.source}`);
      continue;
    }
    if (!fs.statSync(image.absolutePath).isFile()) {
      errors.push(`画像参照先がファイルではありません: ${image.source}`);
    }
    if (!image.alt.trim()) {
      warnings.push(`画像altが空です: ${image.source}`);
    }
  }

  for (const file of [...article.fileRefs, ...article.audioRefs, ...article.comicRefs]) {
    if (file.isRemote) {
      warnings.push(`外部ファイルは自動添付の対象外です: ${file.source}`);
      continue;
    }
    if (!fs.existsSync(file.absolutePath)) {
      errors.push(`添付ファイルが見つかりません: ${file.source}`);
      continue;
    }
    if (!fs.statSync(file.absolutePath).isFile()) {
      errors.push(`添付ファイル参照先がファイルではありません: ${file.source}`);
    }
  }

  if (article.paidMarker && !article.paidBody) {
    errors.push('有料エリアの区切りはありますが、その後に本文がありません');
  }
  if (article.paidMarker && !article.freeBody) {
    errors.push('有料エリアの区切りより前に無料本文がありません');
  }

  return {
    errors,
    warnings,
    title,
    hashtags,
    coverImage: article.coverImage,
    paidArea: Boolean(article.paidMarker),
  };
}

function printReport(article, report, state) {
  console.log(`記事: ${path.relative(repoRoot, article.articlePath)}`);
  console.log(`状態: ${state}`);
  console.log(`カバー画像: ${article.coverImage ? 'あり' : 'なし'}`);
  console.log(`本文画像: ${article.imageRefs.length}件`);
  console.log(`添付ファイル: ${article.fileRefs.length}件`);
  console.log(`音声: ${article.audioRefs.length}件`);
  console.log(`コミック: ${article.comicRefs.length}件`);
  console.log(`有料エリア: ${article.paidMarker ? 'あり' : 'なし'}`);

  for (const warning of report.warnings) console.log(`⚠️  ${warning}`);
  for (const error of report.errors) console.log(`❌ ${error}`);

  if (report.errors.length === 0) {
    console.log('✅ note下書きとして利用できる状態です');
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g,
    (_, alt, source) => `<span data-note-image-source="${escapeHtml(source)}">[画像を挿入: ${escapeHtml(alt || source)}]</span>`);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2">$1</a>');
  return html;
}

function parseNoteBlock(lines, index, name) {
  const startPattern = new RegExp(`^\\s*<!--\\s*note:${name}\\s*-->\\s*$`, 'i');
  const endPattern = new RegExp(`^\\s*<!--\\s*\\/note:${name}\\s*-->\\s*$`, 'i');
  if (!startPattern.test(lines[index] || '')) return null;
  const value = lines[index + 1]?.trim() || '';
  if (!endPattern.test(lines[index + 2] || '')) return null;
  return { value, nextIndex: index + 3 };
}

function isTableOfContentsMarker(line) {
  return /^\s*<!--\s*note:toc\s*-->\s*$/i.test(line || '');
}

function renderMarkdown(body) {
  const lines = body.split('\n');
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const embed = parseNoteBlock(lines, index, 'embed');
    if (embed && /^https?:\/\//i.test(embed.value)) {
      output.push(`<div data-note-embed-url="${escapeHtml(embed.value)}"><a href="${escapeHtml(embed.value)}">${escapeHtml(embed.value)}</a></div>`);
      index = embed.nextIndex;
      continue;
    }

    const file = parseNoteBlock(lines, index, 'file');
    if (file) {
      const resource = parseNoteResourceValue(file.value);
      const label = resource.label || path.basename(resource.source);
      output.push(`<div data-note-file-source="${escapeHtml(resource.source)}"><a href="${escapeHtml(resource.source)}">${escapeHtml(label)}</a></div>`);
      index = file.nextIndex;
      continue;
    }

    const audio = parseNoteBlock(lines, index, 'audio');
    if (audio) {
      const resource = parseNoteResourceValue(audio.value);
      const label = resource.label || path.basename(resource.source);
      output.push(`<div data-note-audio-source="${escapeHtml(resource.source)}"><a href="${escapeHtml(resource.source)}">${escapeHtml(label)}</a></div>`);
      index = audio.nextIndex;
      continue;
    }

    const comic = parseNoteBlock(lines, index, 'comic');
    if (comic) {
      const resource = parseNoteResourceValue(comic.value);
      const label = resource.label || path.basename(resource.source);
      output.push(`<div data-note-comic-source="${escapeHtml(resource.source)}"><a href="${escapeHtml(resource.source)}">${escapeHtml(label)}</a></div>`);
      index = comic.nextIndex;
      continue;
    }

    if (isTableOfContentsMarker(line)) {
      output.push('<div data-note-toc="true">[目次]</div>');
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      const className = language ? ` class="language-${escapeHtml(language)}"` : '';
      output.push(`<pre><code${className}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      output.push('<hr>');
      index += 1;
      continue;
    }

    const imageOnly = line.match(/^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)\s*$/);
    if (imageOnly) {
      output.push(`<figure>${renderInline(line)}</figure>`);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^[-*]\s+/, ''))}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^\d+\.\s+/, ''))}</li>`);
        index += 1;
      }
      output.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(renderInline(lines[index].replace(/^>\s?/, '')));
        index += 1;
      }
      output.push(`<blockquote>${quote.join('<br>')}</blockquote>`);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s+/.test(lines[index]) &&
      !/^```/.test(lines[index]) &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index]) &&
      !/^>\s?/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    output.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
  }

  return output.join('\n');
}

function buildCoverPrompt(article, preset = 'site-renewal') {
  const title = typeof article.frontmatter.title === 'string'
    ? article.frontmatter.title.trim()
    : path.basename(article.articlePath, path.extname(article.articlePath));
  const [coverMainTitle, ...coverSubtitleParts] = title.split('、');
  const coverSubtitle = coverSubtitleParts.join('、').trim();
  const slug = path.basename(article.articlePath, path.extname(article.articlePath));
  const imageDir = `images/${slug}`;

  if (preset === 'generic') {
    return `# カバー画像プロンプト

\`\`\`text
記事「${title}」のnote用カバー画像を作成してください。

【サイズ】
1280 × 670 px

【記事のテーマ】
記事タイトルと本文の内容から、読者が一覧画面でテーマを想像できるビジュアルにしてください。

【構成】
・記事タイトルを主役にする
・小さく表示されてもタイトルとテーマが伝わる余白のある構成
・本文にない実績、数字、人物、企業ロゴ、サービス画面は追加しない
・記事の内容を象徴するモチーフは1〜2個に絞る

【画像内の文字】
メインタイトルは「${title}」を正確に入れてください。文字化け、誤字、意味のない小さな文字は避けてください。

【NG】
・小さい文字を多く入れる
・情報を詰め込みすぎる
・煽り表現や広告バナー風のデザイン
・実在人物、企業ロゴ、根拠のない数字、透かし
\`\`\`
`;
  }

  return `# カバー画像プロンプト

\`\`\`text
記事「${title}」のnote用カバー画像を作成してください。

【サイズ】
1280 × 670 px

【記事のテーマ】
新しいAIモデルを試すたびに、自分のポートフォリオサイトをデザインごとリニューアルした制作記録です。ChatGPT Images 2.5でデザイン案を作り、lunaでは再現しきれなかったメインビジュアルとレスポンシブ対応を、Astraで一度の指示で形にした体験を表現してください。

【添付画像】
・${imageDir}/design-final.png：最終デザインの参考画像
・${imageDir}/site-final-desktop.png：実際に公開したサイトのPC版キャプチャ
添付画像は配色・グリッド・画面構成の参考にし、スクリーンショットをそのまま貼り付けず、新しいカバーとして構成してください。

【ビジュアル】
・白から淡いスレートグレーの背景
・右側に、ポートフォリオサイトのデスクトップ画面を思わせる抽象的なグリッドとブロック
・小さなモバイル画面を添えて、PCデザインからスマホ表示まで展開したことを示す
・濃いスレート、くすませたピンク、少量のアンバーを使う
・細い罫線、余白、太い見出しのある編集デザイン
・AIらしさは控えめにし、実際のWeb制作とデザイン再現の話だと伝わる構成

【画像内の文字】
・ブランド名は「meg+gumi」
・メインタイトルは「${coverMainTitle}」
${coverSubtitle ? `・サブタイトルは「${coverSubtitle}」` : `・タイトルは「${title}」`}
上記以外の文字は入れないでください。日本語の文字化けや誤字を避け、タイトルが小さく表示されても読める大きさにしてください。

【雰囲気】
AIの性能を誇張する広告ではなく、実際にデザインを作り、サイトとして公開した制作記録に見える、落ち着いた信頼感のあるカバーにしてください。

【NG】
・人物、手、ノートパソコンを主役にする
・サイバーパンク、過度な発光、派手なグラデーション
・架空のロゴ、実績数、レビュー、受賞歴
・細かく読めないダミーテキスト
・スクリーンショットの単純なコラージュ
・透かし
\`\`\`
`;
}

function createCoverPrompt(article, options) {
  const preset = options.preset || 'site-renewal';
  if (!['site-renewal', 'generic'].includes(preset)) {
    throw new Error(`カバープロンプトのpresetが不正です: ${preset}`);
  }

  const promptPath = article.articlePath.replace(/\.md$/i, '.cover-prompt.md');
  if (fs.existsSync(promptPath) && !options.force) {
    throw new Error(`カバープロンプトが既に存在します（上書きは --force）: ${promptPath}`);
  }

  fs.writeFileSync(promptPath, buildCoverPrompt(article, preset));
  console.log(`✅ カバープロンプトを作成しました: ${path.relative(repoRoot, promptPath)}`);
}

function prepareArticle(article, report, options) {
  if (report.errors.length > 0) {
    throw new Error('検証エラーがあるため、下書き準備を中止しました');
  }

  const slug = path.basename(article.articlePath, path.extname(article.articlePath));
  const outDir = options.out
    ? path.resolve(process.cwd(), options.out)
    : path.join(repoRoot, 'temp', 'note-drafts', slug);
  fs.mkdirSync(outDir, { recursive: true });

  const bodyMarkdown = article.paidMarker
    ? `${article.freeBody}\n\n${article.paidMarker}\n\n${article.paidBody}\n`
    : `${article.freeBody}\n`;
  const freeBodyMarkdown = `${article.freeBody}\n`;
  const paidBodyMarkdown = article.paidBody ? `${article.paidBody}\n` : '';
  const previewHtml = article.paidMarker
    ? `${renderMarkdown(article.freeBody)}\n<hr data-note-paid-break="true">\n<section data-note-paid-area="true">${renderMarkdown(article.paidBody)}</section>\n`
    : `${renderMarkdown(article.freeBody)}\n`;
  const manifest = {
    version: 1,
    preparedAt: new Date().toISOString(),
    articlePath: article.articlePath,
    title: report.title,
    noteId: typeof article.frontmatter.note_id === 'string'
      ? article.frontmatter.note_id.trim()
      : null,
    hashtags: report.hashtags,
    coverImage: article.coverImage
      ? {
        alt: article.coverImage.alt,
        source: article.coverImage.source,
        path: article.coverImage.absolutePath,
        remote: article.coverImage.isRemote,
      }
      : null,
    paidArea: article.paidMarker
      ? {
        enabled: true,
        marker: article.paidMarker,
      }
      : { enabled: false, marker: null },
    bodyMarkdownPath: path.join(outDir, 'body.md'),
    freeBodyMarkdownPath: path.join(outDir, 'free-body.md'),
    paidBodyMarkdownPath: path.join(outDir, 'paid-body.md'),
    bodyHtmlPath: path.join(outDir, 'body.html'),
    images: article.imageRefs.map((image, index) => ({
      index,
      alt: image.alt,
      source: image.source,
      path: image.absolutePath,
      remote: image.isRemote,
    })),
    files: article.fileRefs.map((file, index) => ({
      index,
      source: file.source,
      path: file.absolutePath,
      remote: file.isRemote,
    })),
    audio: article.audioRefs.map((file, index) => ({
      index,
      source: file.source,
      path: file.absolutePath,
      remote: file.isRemote,
    })),
    comics: article.comicRefs.map((file, index) => ({
      index,
      source: file.source,
      path: file.absolutePath,
      remote: file.isRemote,
    })),
  };

  fs.writeFileSync(manifest.bodyMarkdownPath, bodyMarkdown);
  fs.writeFileSync(manifest.freeBodyMarkdownPath, freeBodyMarkdown);
  fs.writeFileSync(manifest.paidBodyMarkdownPath, paidBodyMarkdown);
  fs.writeFileSync(manifest.bodyHtmlPath, previewHtml);
  fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  return { outDir, manifest };
}

function firstVisible(locators) {
  return locators.first();
}

async function focusEditorEnd(page, editor) {
  // 前のブロック挿入で左側メニューが開いたまま残ることがある。
  // 先に閉じてから本文へフォーカスを戻す。
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
  await editor.focus();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+End' : 'Control+End');
  await page.waitForTimeout(250);
}

async function changeEditorParagraph(page) {
  // noteの新エディタは、Enter 1回が同じブロック内の改行、
  // Enter 2回が次の通常段落への移動です。画像の説明欄や
  // コードブロックから抜けるときに1回だけ押すと、次の本文が
  // キャプション／コードへ入り続けるため、ここで共通化します。
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
}

async function waitForBodyImageInsertion(editor, beforeImageCount, beforeFigureCount, timeoutMs = 30000) {
  const images = editor.locator('img');
  const figures = editor.locator('figure:has(img)');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await images.count() > beforeImageCount) return true;
    if (await figures.count() > beforeFigureCount) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function waitForCountIncrease(locator, beforeCount, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await locator.count() > beforeCount) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function uploadImageAtCursor(page, editor, imagePath) {
  // 現行noteエディタは、本文の「＋」メニューを開いてから
  // 「画像」を選ぶと本文用のfilechooserを開く。カバー用inputを
  // 先に拾うと本文画像がカバー側へ送られるため、本文メニューを優先する。
  const bodyImages = editor.locator('img');
  const bodyFigures = editor.locator('figure:has(img)');
  const beforeImageCount = await bodyImages.count();
  const beforeFigureCount = await bodyFigures.count();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await focusEditorEnd(page, editor);
    const menuTrigger = page.getByRole('button', { name: 'メニューを開く' });
    if (await menuTrigger.count() > 0 && await menuTrigger.first().isVisible().catch(() => false)) {
      await menuTrigger.first().click({ force: true });
      // 画像を連続して入れるときは、前の画像の確定処理とメニューの
      // 表示アニメーションが重なるため、毎回メニューを開き直して待つ。
      await page.waitForTimeout(1200);
    }

    const bodyImageTrigger = page.getByRole('button', { name: '画像', exact: true });
    if (await bodyImageTrigger.count() === 0) continue;
    const trigger = bodyImageTrigger.last();
    if (!(await trigger.isVisible().catch(() => false))) continue;
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    const chooserPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
    await trigger.click({ force: true, timeout: 5000 }).catch(() => {});
    const chooser = await chooserPromise;
    if (!chooser) continue;

    await chooser.setFiles(imagePath);
    const inserted = await waitForBodyImageInsertion(
      editor,
      beforeImageCount,
      beforeFigureCount,
    );
    if (inserted) {
      await changeEditorParagraph(page);
      return true;
    }
  }

  return false;
}

async function uploadFileAtCursor(page, editor, filePath) {
  await focusEditorEnd(page, editor);
  const menuTrigger = page.getByRole('button', { name: 'メニューを開く' });
  if (await menuTrigger.count() === 0) return false;
  await menuTrigger.first().click();
  await page.waitForTimeout(1200);

  const fileTrigger = page.getByRole('button', { name: 'ファイル', exact: true });
  for (let index = 0; index < await fileTrigger.count(); index += 1) {
    const trigger = fileTrigger.nth(index);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    const chooserPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
    await trigger.click();
    const chooser = await chooserPromise;
    if (!chooser) continue;
    await chooser.setFiles(filePath);
    await page.waitForTimeout(1000);
    return true;
  }

  return false;
}

async function insertCodeBlock(page, editor, code) {
  const codeBlocks = editor.locator('pre');
  const beforeCodeBlockCount = await codeBlocks.count();
  await focusEditorEnd(page, editor);
  const menuTrigger = page.getByRole('button', { name: 'メニューを開く' });
  if (await menuTrigger.count() === 0) return false;
  await menuTrigger.first().click({ force: true });
  await page.waitForTimeout(200);
  const codeTrigger = page.getByRole('button', { name: 'コード', exact: true });
  if (await codeTrigger.count() === 0) return false;
  await codeTrigger.first().click({ force: true });
  // keyboard.insertText()はnoteのコード入力欄で改行を保持せず、
  // 複数行のプロンプトが先頭行だけになることがある。本文貼り付けと
  // 同じくクリップボード経由にして、改行をそのまま渡す。
  await page.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, code);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V');
  await page.waitForTimeout(400);
  // noteのコードエリアはEnter 2回で通常段落へ戻る。
  await changeEditorParagraph(page);
  return waitForCountIncrease(codeBlocks, beforeCodeBlockCount, 5000);
}

async function insertTableOfContents(page, editor) {
  await focusEditorEnd(page, editor);
  const menuTrigger = page.getByRole('button', { name: 'メニューを開く' });
  if (await menuTrigger.count() === 0) return false;
  await menuTrigger.first().click();
  await page.waitForTimeout(150);
  const tocTrigger = page.getByRole('button', { name: '目次', exact: true });
  if (await tocTrigger.count() === 0) return false;
  await tocTrigger.first().click();
  await page.waitForTimeout(500);
  return true;
}

async function uploadAudioAtCursor(page, editor, filePath) {
  await focusEditorEnd(page, editor);
  const menuTrigger = page.getByRole('button', { name: 'メニューを開く' });
  if (await menuTrigger.count() === 0) return false;
  await menuTrigger.first().click();
  await page.waitForTimeout(150);
  const audioTrigger = page.getByRole('button', { name: '音声', exact: true });
  if (await audioTrigger.count() === 0) return false;
  await audioTrigger.first().click();
  await page.waitForTimeout(250);
  const input = page.locator('input[type="file"][accept*="audio"]').last();
  if (await input.count() === 0) return false;
  await input.setInputFiles(filePath);
  await page.waitForTimeout(700);
  const dialog = page.getByRole('dialog').filter({ hasText: '音声の投稿' }).last();
  const submit = dialog.getByRole('button', { name: /投稿|追加|適用/ });
  if (await submit.count() === 0) {
    await page.keyboard.press('Escape');
    return false;
  }
  await submit.first().click();
  await page.waitForTimeout(1000);
  return true;
}

async function uploadComicAtCursor(page, editor, filePath) {
  await focusEditorEnd(page, editor);
  const menuTrigger = page.getByRole('button', { name: 'メニューを開く' });
  if (await menuTrigger.count() === 0) return false;
  await menuTrigger.first().click();
  await page.waitForTimeout(150);
  const comicTrigger = page.getByRole('button', { name: 'コミック', exact: true });
  if (await comicTrigger.count() === 0) return false;
  await comicTrigger.first().click();
  await page.waitForTimeout(250);
  const dialog = page.getByRole('dialog').filter({ hasText: 'コミックの作成' }).last();
  const titleInput = dialog.locator('input[type="text"]');
  if (await titleInput.count() > 0) {
    await titleInput.first().fill(path.basename(filePath, path.extname(filePath)));
  }
  const input = dialog.locator('input[type="file"][accept*="image/"]').last();
  if (await input.count() === 0) return false;
  await input.setInputFiles(filePath);
  await page.waitForTimeout(700);
  const create = dialog.getByRole('button', { name: '作成', exact: true });
  if (await create.count() === 0) return false;
  await create.first().click();
  await page.waitForTimeout(1000);
  return true;
}

async function uploadCoverImage(page, imagePath) {
  const inputs = page.locator('input[type="file"]');
  for (let index = 0; index < await inputs.count(); index += 1) {
    const input = inputs.nth(index);
    const descriptor = [
      await input.getAttribute('accept'),
      await input.getAttribute('name'),
      await input.getAttribute('id'),
      await input.getAttribute('aria-label'),
    ].filter(Boolean).join(' ');
    if (/cover|カバー/i.test(descriptor)) {
      await input.setInputFiles(imagePath);
      await page.waitForTimeout(700);
      return true;
    }
  }

  // 現行noteエディタのカバー画像は、上部の画像アイコンから
  // 「画像をアップロード」を開き、トリミング確認後に保存する。
  const coverTrigger = page.locator('button:has(svg[aria-label="画像を追加"])');
  for (let index = 0; index < await coverTrigger.count(); index += 1) {
    const trigger = coverTrigger.nth(index);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    await trigger.click({ force: true });
    await page.waitForTimeout(150);

    const uploadTrigger = page.locator('button').filter({ hasText: /画像をアップロード/ });
    if (await uploadTrigger.count() === 0) continue;
    const chooserPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
    await uploadTrigger.first().click({ force: true });
    const chooser = await chooserPromise;
    if (!chooser) continue;

    await chooser.setFiles(imagePath);
    await page.waitForTimeout(1000);

    const cropSave = page.getByRole('button', { name: '保存', exact: true });
    if (await cropSave.count() === 0) return false;
    await cropSave.first().click();
    await page.waitForTimeout(700);
    return true;
  }

  // カバー画像が設定済みの場合は、画像右上の変更ボタンになる。
  const existingCoverTrigger = page.locator('figure:has(img[alt="eyecatch"]) + div button');
  for (let index = 0; index < await existingCoverTrigger.count(); index += 1) {
    const trigger = existingCoverTrigger.nth(index);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    const chooserPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
    await trigger.click();
    const chooser = await chooserPromise;
    if (!chooser) continue;

    await chooser.setFiles(imagePath);
    await page.waitForTimeout(1000);
    const cropSave = page.getByRole('button', { name: '保存', exact: true });
    if (await cropSave.count() === 0) return false;
    await cropSave.first().click();
    await page.waitForTimeout(700);
    return true;
  }

  const triggers = page.getByRole('button', { name: /cover|カバー/i });
  for (let index = 0; index < await triggers.count(); index += 1) {
    const trigger = triggers.nth(index);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    const chooserPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
    await trigger.click();
    const chooser = await chooserPromise;
    if (chooser) {
      await chooser.setFiles(imagePath);
      await page.waitForTimeout(700);
      return true;
    }
  }

  return false;
}

async function insertPaidBreak(page) {
  // 有料区切りは本文の挿入メニュー内にある。
  const menu = page.getByRole('button', { name: 'メニューを開く', exact: true });
  if (await menu.count() > 0 && await menu.first().isVisible()) {
    await menu.first().click();
    await page.getByRole('button', { name: '有料エリア指定', exact: true })
      .waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
  const candidates = [
    page.getByRole('button', { name: /続きを読む|有料エリア|paywall/i }),
    page.locator('[aria-label*="続きを読む"], [aria-label*="有料"], [title*="続きを読む"], [title*="有料"]'),
  ];

  for (const candidate of candidates) {
    for (let index = 0; index < await candidate.count(); index += 1) {
      const control = candidate.nth(index);
      if (!(await control.isVisible().catch(() => false))) continue;
      await control.click();
      await page.waitForTimeout(500);
      return true;
    }
  }

  return false;
}

function buildPasteSegments(
  bodyMarkdown,
  manifest,
  includeImages = true,
  includeFiles = true,
  includeAudio = true,
  includeComic = true,
) {
  const lines = bodyMarkdown.trim().split('\n');
  const segments = [];
  let textLines = [];

  const flushText = () => {
    const text = textLines.join('\n');
    if (!text.trim()) return;
    segments.push({ html: renderMarkdown(text), text, image: null });
    textLines = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('```')) {
      flushText();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      segments.push({ html: '', text: '', image: null, code: code.join('\n') });
      continue;
    }

    const embed = parseNoteBlock(lines, index, 'embed');
    if (embed) {
      if (/^https?:\/\//i.test(embed.value)) {
        flushText();
        segments.push({ html: '', text: '', image: null, embedUrl: embed.value });
        index = embed.nextIndex - 1;
      } else {
        textLines.push(line);
      }
      continue;
    }

    const fileBlock = parseNoteBlock(lines, index, 'file');
    if (fileBlock) {
      const resource = parseNoteResourceValue(fileBlock.value);
      const file = includeFiles
        ? manifest.files.find((candidate) => !candidate.remote && candidate.source === resource.source)
        : null;
      if (file) {
        flushText();
        segments.push({ html: '', text: '', image: null, file });
        index = fileBlock.nextIndex - 1;
      } else {
        textLines.push(line, lines[index + 1], lines[index + 2]);
        index = fileBlock.nextIndex - 1;
      }
      continue;
    }

    const audioBlock = parseNoteBlock(lines, index, 'audio');
    if (audioBlock) {
      const resource = parseNoteResourceValue(audioBlock.value);
      const audio = includeAudio
        ? (manifest.audio || []).find((candidate) => !candidate.remote && candidate.source === resource.source)
        : null;
      if (audio) {
        flushText();
        segments.push({ html: '', text: '', image: null, audio });
        index = audioBlock.nextIndex - 1;
      } else {
        textLines.push(line, lines[index + 1], lines[index + 2]);
        index = audioBlock.nextIndex - 1;
      }
      continue;
    }

    const comicBlock = parseNoteBlock(lines, index, 'comic');
    if (comicBlock) {
      const resource = parseNoteResourceValue(comicBlock.value);
      const comic = includeComic
        ? (manifest.comics || []).find((candidate) => !candidate.remote && candidate.source === resource.source)
        : null;
      if (comic) {
        flushText();
        segments.push({ html: '', text: '', image: null, comic });
        index = comicBlock.nextIndex - 1;
      } else {
        textLines.push(line, lines[index + 1], lines[index + 2]);
        index = comicBlock.nextIndex - 1;
      }
      continue;
    }

    if (isTableOfContentsMarker(line)) {
      flushText();
      segments.push({ html: '', text: '', image: null, toc: true });
      continue;
    }

    const imageOnly = line.match(/^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)\s*$/);
    if (!imageOnly) {
      textLines.push(line);
      continue;
    }

    if (!includeImages) {
      textLines.push(line);
      continue;
    }

    flushText();
    const image = manifest.images.find((candidate) => !candidate.remote && candidate.source === imageOnly[2]);
    if (!image) {
      textLines.push(line);
      continue;
    }
    segments.push({ html: '', image });
  }
  flushText();
  return segments;
}

async function pasteClipboardHtml(page, editor, html, text) {
  if (!html.trim()) return;
  // ProseMirrorは貼り付けHTMLの末尾ブロックを、次の挿入操作まで
  // 未確定のまま保持することがある。空の通常段落を後置して、
  // 直前の最後の段落が画像・埋め込みの後ろへ移動するのを防ぐ。
  const pasteHtml = `${html.trimEnd()}<p><br></p>`;
  await page.evaluate(async ({ html: clipboardHtml, text: clipboardText }) => {
    const item = new ClipboardItem({
      'text/html': new Blob([clipboardHtml], { type: 'text/html' }),
      'text/plain': new Blob([clipboardText], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
  }, { html: pasteHtml, text });
  await focusEditorEnd(page, editor);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V');
  await page.waitForTimeout(700);
}

async function pasteEmbedUrl(page, editor, url) {
  await focusEditorEnd(page, editor);
  const menuTrigger = page.getByRole('button', { name: 'メニューを開く' });
  if (await menuTrigger.count() === 0) return false;
  await menuTrigger.first().click();
  await page.waitForTimeout(1200);
  const embedTrigger = page.getByRole('button', { name: '埋め込み', exact: true });
  if (await embedTrigger.count() === 0) return false;
  await embedTrigger.first().click({ force: true, timeout: 5000 });
  await page.waitForTimeout(200);
  const urlInput = page.locator('textarea[placeholder="https://example.com"], input[placeholder="https://example.com"]');
  if (await urlInput.count() === 0) return false;
  await urlInput.first().fill(url);
  const apply = page.getByRole('button', { name: '適用', exact: true });
  if (await apply.count() === 0) return false;
  await apply.first().click();
  await page.waitForTimeout(900);
  return true;
}

async function replaceEditorContents(page, editor) {
  await editor.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(250);
}

async function saveNote(page) {
  const save = firstVisible(page.getByRole('button', { name: /保存|Save/i }));
  if (await save.count() === 0) return false;
  await save.click();
  await page.waitForTimeout(800);
  return true;
}

function resolveEditorUrl(options, operation, manifest) {
  if (options.url || process.env.NOTE_EDITOR_URL) {
    return options.url || process.env.NOTE_EDITOR_URL;
  }
  if (operation !== 'update') return defaultEditorUrl;

  const noteId = typeof manifest.noteId === 'string' ? manifest.noteId.trim() : '';
  if (!noteId) {
    throw new Error('既存記事の更新にはnote_idまたは--url <既存の編集画面URL>が必要です');
  }
  return `https://editor.note.com/notes/${encodeURIComponent(noteId)}/edit/`;
}

function resolveProfileDir(options) {
  return options.profile
    ? path.resolve(process.cwd(), options.profile)
    : process.env.NOTE_PLAYWRIGHT_PROFILE
      ? path.resolve(process.env.NOTE_PLAYWRIGHT_PROFILE)
      : path.join(repoRoot, 'temp', 'note-playwright-profile');
}

async function launchNoteContext(options) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error('Playwrightが見つかりません。npm installを実行してください');
  }

  const profileDir = resolveProfileDir(options);
  fs.mkdirSync(profileDir, { recursive: true });
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: process.env.NOTE_BROWSER_CHANNEL || 'chrome',
    viewport: { width: 1440, height: 1000 },
  });
  return { context, profileDir };
}

function isLoginPage(page) {
  return /(?:^|\/)(?:login|users\/sign_in|accounts\/login)(?:[/?#]|$)/i.test(page.url());
}

async function isEditorReady(page) {
  const titleSelector = 'input[name="title"], textarea[name="title"], input[placeholder*="タイトル"], textarea[placeholder*="タイトル"]';
  const titleCount = await page.locator(titleSelector).count().catch(() => 0);
  const editableCount = await page.locator('[contenteditable="true"]').count().catch(() => 0);
  return titleCount > 0 || editableCount >= 2;
}

async function waitForLogin(page, options, editorUrl = defaultEditorUrl) {
  const timeoutMs = Number(options.loginTimeout || process.env.NOTE_LOGIN_TIMEOUT_MS || 300000);
  const deadline = Date.now() + timeoutMs;
  console.log('noteのログイン画面を開きました。ブラウザ上でログインを完了してください。');

  while (Date.now() < deadline) {
    if (!isLoginPage(page)) {
      if (await isEditorReady(page)) return;
      await page.goto(editorUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      if (await isEditorReady(page)) return;
    }
    await page.waitForTimeout(1000);
  }

  throw new Error(`ログイン待機がタイムアウトしました（${Math.round(timeoutMs / 1000)}秒）`);
}

async function ensureLogin(page, options, editorUrl) {
  if (await isEditorReady(page)) return;
  // note.com/notes/new は実際の編集画面へリダイレクトされるまで
  // タイトル欄がまだDOMにないことがある。ここで短く待ってから、
  // 未ログインと判定する。
  try {
    await waitForEditorReady(page, 15000);
    return;
  } catch {
    // 編集画面が現れなかった場合だけ、ログイン状態を確認する。
  }
  if (!options.login) {
    throw new Error('noteの編集画面を開けませんでした。先に npm run note:login を実行するか、--login を付けてください');
  }

  await waitForLogin(page, options, editorUrl);
}

async function waitForEditorReady(page, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  const titleSelector = 'input[name="title"], textarea[name="title"], input[placeholder*="タイトル"], textarea[placeholder*="タイトル"]';

  while (Date.now() < deadline) {
    const titleCount = await page.locator(titleSelector).count();
    const editableCount = await page.locator('[contenteditable="true"]').count();
    if (titleCount > 0 || editableCount >= 2) return;
    await page.waitForTimeout(250);
  }

  throw new Error(`noteの編集画面の読み込みがタイムアウトしました: ${page.url()}`);
}

async function runLogin(options) {
  const { context, profileDir } = await launchNoteContext(options);
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(options.url || defaultLoginUrl, { waitUntil: 'domcontentloaded' });
    await waitForLogin(page, options, defaultEditorUrl);
    console.log(`✅ Playwrightのログインプロファイルを確認しました: ${profileDir}`);
  } finally {
    await context.close();
  }
}

async function runPublish(options) {
  const articlePath = resolveArticlePath(options.article);
  const article = parseArticle(articlePath);
  const report = validateArticle(article, 'draft');
  printReport(article, report, 'draft');
  if (report.errors.length) throw new Error('原稿の検証に失敗したため公開を中止しました');
  if (!article.frontmatter.note_id) throw new Error('保存済み下書きのnote_idが必要です');
  if (article.paidMarker ? (!options.price || options.free) : (!options.free || options.price)) {
    throw new Error('有料区切りがある原稿は--price <円>、ない原稿は--freeを指定してください');
  }
  if (options.price && (!/^\d+$/.test(options.price) || Number(options.price) < 100 || Number(options.price) > 50000)) {
    throw new Error('--priceは100〜50000の整数で指定してください');
  }

  const isMagazineArticle = /ai-entertainment-night/i.test(articlePath);
  const magazine = options.noMagazine ? null : options.magazine || null;
  const membershipPlan = options.noMembership ? null : options['membership-plan'] || (isMagazineArticle ? 'スタンダードプラン' : null);
  if ((options.noMagazine && options.magazine) || (options.noMembership && options['membership-plan'])) {
    throw new Error('--no-magazine/--no-membershipと追加先の指定は併用できません');
  }
  if (!magazine && !options.noMagazine && !isMagazineArticle) throw new Error('追加するマガジン名か--no-magazineを指定してください');
  if (!membershipPlan && !options.noMembership) throw new Error('追加するプラン名か--no-membershipを指定してください');
  if (!options.confirm) {
    throw new Error('外部設定と記事公開を実行するには--confirmが必要です（公開設定: --confirmなしでは開きません）');
  }

  const tags = report.hashtags;
  console.log(`公開対象: ${report.title}`);
  console.log(`記事タイプ: ${options.free ? '無料' : `有料 ${options.price}円`}`);
  console.log(`タグ: ${tags.join(' ')}`);
  console.log(`マガジン: ${magazine || '追加なし'}`);
  console.log(`メンバーシップ: ${membershipPlan || '追加なし'}`);

  const { context } = await launchNoteContext(options);
  try {
    const page = context.pages()[0] || await context.newPage();
    const editorUrl = `https://editor.note.com/notes/${encodeURIComponent(article.frontmatter.note_id)}/edit/`;
    await page.goto(editorUrl, { waitUntil: 'domcontentloaded' });
    await ensureLogin(page, options, editorUrl);
    const title = page.locator('input[name="title"], textarea[name="title"], input[placeholder*="タイトル"], textarea[placeholder*="タイトル"]').first();
    if (await title.count() && (await title.inputValue()).trim() !== report.title) {
      throw new Error('note上のタイトルと原稿が一致しません。本文更新後に下書きを保存してください');
    }
    await page.goto(`https://editor.note.com/notes/${encodeURIComponent(article.frontmatter.note_id)}/publish/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'ハッシュタグ', exact: true }).waitFor({ state: 'visible', timeout: 15000 });

    // note側の選択済みタグだけを消し、原稿のnote_hashtagsへ一致させる。
    const selectedTagButtons = page.locator('button').filter({
      has: page.locator('svg[data-src="/icons/close.svg"]'),
      hasText: /^#[^\s]+/,
    });
    while (await selectedTagButtons.count()) await selectedTagButtons.first().click();
    const tagInput = page.getByPlaceholder('ハッシュタグを追加する');
    for (const tag of tags) {
      await tagInput.fill(tag.replace(/^#/, ''));
      const suggestion = page.getByText(tag, { exact: true });
      await suggestion.waitFor({ state: 'visible', timeout: 5000 });
      await suggestion.click();
    }
    const selectedTags = await page.locator('button').filter({
      has: page.locator('svg[data-src="/icons/close.svg"]'),
      hasText: /^#[^\s]+/,
    }).allTextContents();
    const normalizedTags = selectedTags.map((tag) => tag.trim().replace(/\s+/g, ''));
    if (JSON.stringify(normalizedTags) !== JSON.stringify(tags)) throw new Error(`note側タグが原稿と一致しません: ${normalizedTags.join(' ')}`);

    if (options.free) {
      await page.locator('input[name="is_paid"][value="free"]').check();
    } else {
      await page.locator('input[name="is_paid"][value="paid"]').check();
      await page.getByPlaceholder('300').fill(options.price);
    }

    const setTarget = async (tabName, target, shouldAdd) => {
      if (!target) return;
      await page.getByRole('button', { name: '記事の追加', exact: true }).click();
      await page.getByRole('checkbox', { name: tabName, exact: true }).click();
      const candidates = page.getByRole('button', { name: /^(追加|追加済み?|削除)$/ });
      const rows = await candidates.evaluateAll((buttons, wanted) => buttons.map((button) => {
        let node = button;
        for (let depth = 0; depth < 6 && node; depth += 1, node = node.parentElement) {
          const text = (node.innerText || '').trim();
          if (text.split('\n').includes(wanted)) return { text, buttonText: button.innerText.trim(), depth };
        }
        return null;
      }), target);
      const rowIndex = rows.findIndex((row) => row?.text.split('\n').includes(target));
      if (rowIndex < 0) throw new Error(`${tabName}に「${target}」が見つかりません`);
      const row = rows[rowIndex];
      const added = ['追加済', '追加済み', '削除'].includes(row.buttonText);
      if (added === shouldAdd) return;
      if (!added && row.buttonText !== '追加') throw new Error(`「${target}」の状態が未対応です: ${row.buttonText}`);
      await candidates.nth(rowIndex).click();
      await page.waitForTimeout(600);
      const updatedRows = await candidates.evaluateAll((buttons, wanted) => buttons.map((button) => {
        let node = button;
        for (let depth = 0; depth < 6 && node; depth += 1, node = node.parentElement) {
          const text = (node.innerText || '').trim();
          if (text.split('\n').includes(wanted)) return { text, buttonText: button.innerText.trim() };
        }
        return null;
      }), target);
      const updated = updatedRows.find((candidate) => candidate?.text.split('\n').includes(target));
      const nowAdded = updated && ['追加済', '追加済み', '削除'].includes(updated.buttonText);
      if (!updated || nowAdded !== shouldAdd) throw new Error(`「${target}」の設定状態を確認できません`);
    };
    await setTarget('マガジン', magazine, true);
    await setTarget('メンバーシップ', 'メンバー全員に公開', false);
    await setTarget('メンバーシップ', membershipPlan, true);
    console.log(`会員公開範囲: ${membershipPlan}限定（全メンバー向けには追加しない）`);

    // 最終ページへ進んだ後も、公開ボタンは--confirm指定時のみ一度だけ押す。
    const areaSettingsButton = page.getByRole('button', { name: /^(有料エリア設定|無料エリア設定)$/ });
    if (await areaSettingsButton.count() === 1) await areaSettingsButton.click();
    if (article.paidMarker) {
      const firstPaidText = article.paidBody.split(/\r?\n/).find((line) => line.trim())
        ?.trim().replace(/^#{1,6}\s+/, '').trim();
      if (!firstPaidText) throw new Error('有料区切り後の先頭ブロックを特定できません');
      const paidEditor = page.locator('.ProseMirror.paywall-setting');
      const paidStart = paidEditor.getByText(firstPaidText, { exact: true }).first();
      await paidStart.waitFor({ state: 'visible', timeout: 10000 });
      const boundary = paidStart.locator('xpath=preceding-sibling::*[1]/button');
      if (await boundary.count() !== 1) throw new Error('原稿の有料開始位置に対応する境界ボタンを特定できません');
      if (await boundary.getAttribute('aria-pressed') !== 'true') await boundary.click();
      if (await boundary.getAttribute('aria-pressed') !== 'true') throw new Error('有料開始位置の選択を確認できません');
      await page.getByRole('button', { name: 'このラインより先を有料にする', exact: true }).click();
      const updatePaywall = page.getByRole('button', { name: '更新する', exact: true });
      await updatePaywall.waitFor({ state: 'visible', timeout: 10000 });
      await updatePaywall.click();
      await page.getByRole('button', { name: /^(有料エリア設定|無料エリア設定)$/ }).waitFor({ state: 'visible', timeout: 15000 });
    }
    const postButton = page.getByRole('button', { name: '投稿する', exact: true });
    await postButton.waitFor({ state: 'visible', timeout: 10000 });
    if (options.stopBeforePost) {
      console.log('✅ 公開設定を反映し、最終の「投稿する」ボタン直前で停止しました。記事は公開していません。');
      return;
    }
    const publishRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('note.com/api/') && !request.url().includes('/trackings/')) {
        publishRequests.push({ method: request.method(), url: request.url() });
      }
    });
    page.on('response', (response) => {
      const request = response.request();
      if (response.url().includes('note.com/api/') && request.method() !== 'GET' && !response.url().includes('/trackings/')) {
        publishRequests.push({ method: request.method(), url: response.url(), status: response.status() });
      }
    });
    let unexpectedDialog = null;
    page.on('dialog', async (dialog) => {
      const message = String(dialog.message() || '');
      console.log(`note確認ダイアログ: ${message || '(空)'}`);
      if (/全文が無料|無料で表示/.test(message) || !message) {
        unexpectedDialog = message || '確認文が空です';
        await dialog.dismiss();
      } else if (/公開|投稿/.test(message)) await dialog.accept();
      else {
        unexpectedDialog = message;
        await dialog.dismiss();
      }
    });
    await postButton.click();
    await page.waitForTimeout(2500).catch(() => {});
    if (unexpectedDialog) throw new Error(`想定外の確認ダイアログで停止しました: ${unexpectedDialog}`);
    let resultPages = context.pages().filter((candidate) => !candidate.isClosed());
    if (!resultPages.length) {
      const verificationPage = await context.newPage();
      await verificationPage.goto(editorUrl, { waitUntil: 'domcontentloaded' });
      await verificationPage.waitForTimeout(1200);
      resultPages = [verificationPage];
    }
    let publicUrl = null;
    for (const resultPage of resultPages.reverse()) {
      publicUrl = resultPage.url().match(/https?:\/\/note\.com\/[^\s]*\/n\/([^/?#]+)/i)?.[0]
        || await resultPage.locator('a[href*="/n/"]').evaluateAll((links, titleText) => links
          .find((link) => (link.innerText || '').trim() === titleText)?.href || null, report.title).catch(() => null);
      if (publicUrl) break;
    }
    if (!publicUrl) throw new Error(`公開完了URLを確認できません。note画面とAPI応答を確認してください: ${page.url()} ${JSON.stringify(publishRequests)}`);
    const noteId = publicUrl.match(/\/n\/([^/?#]+)/i)?.[1];
    if (!noteId) throw new Error(`公開URLからnote_idを取得できません: ${publicUrl}`);
    recordPublishedArticle(articlePath, decodeURIComponent(noteId));
    console.log(`✅ 公開しました: ${publicUrl}`);
    console.log(`✅ 原稿のnote_idとdateを更新しました: ${decodeURIComponent(noteId)}`);
  } finally {
    await context.close();
  }
}

async function runDraft(options, operation = 'draft') {
  let manifestPath = options.manifest
    ? path.resolve(process.cwd(), options.manifest)
    : null;

  if (!manifestPath) {
    const articlePath = resolveArticlePath(options.article);
    const article = parseArticle(articlePath);
    const report = validateArticle(article, options.state);
    printReport(article, report, options.state);
    const prepared = prepareArticle(article, report, options);
    manifestPath = path.join(prepared.outDir, 'manifest.json');
    console.log(`準備ファイル: ${path.relative(repoRoot, manifestPath)}`);
  }

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.jsonが見つかりません: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const editorUrl = resolveEditorUrl(options, operation, manifest);
  const localImages = manifest.images.filter((image) => !image.remote);
  const localFiles = (manifest.files || []).filter((file) => !file.remote);
  const localAudio = (manifest.audio || []).filter((file) => !file.remote);
  const localComics = (manifest.comics || []).filter((file) => !file.remote);

  const willReplaceBody = operation !== 'update' || options.replaceBody;
  if (options.save && willReplaceBody && localImages.length > 0 && !options.uploadImages) {
    throw new Error('画像付き記事を保存するには --upload-images も指定してください');
  }
  if (options.save && willReplaceBody && manifest.coverImage && !manifest.coverImage.remote && !options.uploadCover) {
    throw new Error('カバー画像付き記事を保存するには --upload-cover も指定してください');
  }
  if (options.save && willReplaceBody && localFiles.length > 0 && !options.uploadFiles) {
    throw new Error('添付ファイル付き記事を保存するには --upload-files も指定してください');
  }
  if (options.save && willReplaceBody && localAudio.length > 0 && !options.uploadAudio) {
    throw new Error('音声付き記事を保存するには --upload-audio も指定してください');
  }
  if (options.save && willReplaceBody && localComics.length > 0 && !options.uploadComic) {
    throw new Error('コミック付き記事を保存するには --upload-comic も指定してください');
  }

  const { context } = await launchNoteContext(options);

  try {
    const page = context.pages()[0] || await context.newPage();
    console.log(`編集モード: ${operation === 'update' ? '既存記事の更新' : '新規下書き'}`);
    console.log(`編集画面: ${editorUrl}`);
    await page.goto(editorUrl, { waitUntil: 'domcontentloaded' });
    await ensureLogin(page, options, editorUrl);
    await waitForEditorReady(page);

    if (operation === 'update' && !options.replaceBody && (options.uploadImages || options.uploadFiles || options.uploadAudio || options.uploadComic)) {
      throw new Error('既存本文と埋め込みを保護するため、本文アセットの更新には --replace-body の明示が必要です');
    }

    const titleLocator = page.locator(
      'input[name="title"], textarea[name="title"], input[placeholder*="タイトル"], textarea[placeholder*="タイトル"]',
    );
    const editableAreas = page.locator('[contenteditable="true"]');
    const hasTitleLocator = await titleLocator.count() > 0;
    const title = hasTitleLocator ? firstVisible(titleLocator) : editableAreas.first();
    if (await title.count() === 0) {
      throw new Error('noteのタイトル入力欄を特定できませんでした');
    }

    await title.fill(manifest.title);
    // 途中のアップロード失敗でも同じ下書きから再開できるようIDを確保する。
    if (operation === 'draft' && options.save && await saveNote(page)) {
      recordSavedDraftNoteId(manifestPath, manifest, page.url(), options.state);
      console.log(`下書き作成: ${page.url()}`);
    }
    if (manifest.coverImage && !manifest.coverImage.remote && options.uploadCover) {
      const uploaded = await uploadCoverImage(page, manifest.coverImage.path);
      if (!uploaded) {
        if (operation === 'update') {
          console.log(`⚠️ 既存カバーの変更UIを特定できないため、現在のカバーを維持します: ${manifest.coverImage.source}`);
        } else {
          throw new Error(`カバー画像のアップロード操作を特定できませんでした: ${manifest.coverImage.source}`);
        }
      } else {
        console.log('✅ カバー画像のアップロードを試みました');
      }
    }

    const editor = hasTitleLocator ? editableAreas.first() : editableAreas.nth(1);
    if (await editor.count() === 0) {
      console.log('タイトルは入力しましたが、本文エディタを特定できませんでした。');
      console.log(`本文と画像の準備ファイル: ${path.dirname(manifestPath)}`);
      return;
    }

    if (operation === 'update' && !options.replaceBody) {
      console.log('✅ 更新モードでは本文を変更していません（既存の埋め込みを保護）。');
      if (options.save) {
        const saved = await saveNote(page);
        if (!saved) {
          console.log('⚠️ 保存ボタンを自動特定できなかったため、保存は行っていません。');
        } else {
          recordSavedDraftNoteId(manifestPath, manifest, page.url(), options.state);
          console.log('✅ note側の保存ボタンを押しました。公開は行っていません。');
        }
      } else {
        console.log('保存は行っていません。タイトルやカバーを確認してから --save 付きで実行してください。');
      }
      return;
    }

    if (operation === 'update' && options.replaceBody) {
      await replaceEditorContents(page, editor);
      console.log('⚠️ 既存本文を全消去して置き換えます（note上の埋め込み・手動設定は保持されません）。');
    }

    const freeBodyMarkdown = fs.readFileSync(manifest.freeBodyMarkdownPath, 'utf8');
    const paidBodyMarkdown = manifest.paidArea.enabled
      ? fs.readFileSync(manifest.paidBodyMarkdownPath, 'utf8')
      : '';
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(page.url()).origin,
    });

    const pasteSection = async (sectionMarkdown) => {
      const hasEmbeds = /<!--\s*note:embed\s*-->/i.test(sectionMarkdown);
      const hasFiles = /<!--\s*note:file\s*-->/i.test(sectionMarkdown);
      const hasAudio = /<!--\s*note:audio\s*-->/i.test(sectionMarkdown);
      const hasComic = /<!--\s*note:comic\s*-->/i.test(sectionMarkdown);
      const hasToc = /<!--\s*note:toc\s*-->/i.test(sectionMarkdown);
      const hasCode = /^```/m.test(sectionMarkdown);
      if (
        options.uploadImages || options.uploadFiles || options.uploadAudio || options.uploadComic
        || hasEmbeds || hasFiles || hasAudio || hasComic || hasToc || hasCode
      ) {
        const segments = buildPasteSegments(
          sectionMarkdown,
          manifest,
          options.uploadImages,
          options.uploadFiles,
          options.uploadAudio,
          options.uploadComic,
        );
        for (const segment of segments) {
          if (segment.code !== undefined) {
            const inserted = await insertCodeBlock(page, editor, segment.code);
            if (!inserted) {
              throw new Error('コードブロックを挿入できませんでした');
            }
            continue;
          }
          if (segment.embedUrl) {
            const inserted = await pasteEmbedUrl(page, editor, segment.embedUrl);
            if (!inserted) {
              throw new Error(`埋め込みUIを特定できませんでした: ${segment.embedUrl}`);
            }
            continue;
          }
          if (segment.file) {
            const uploaded = await uploadFileAtCursor(page, editor, segment.file.path);
            if (!uploaded) {
              throw new Error(`ファイル添付ボタンを特定できませんでした: ${segment.file.source}`);
            }
            continue;
          }
          if (segment.audio) {
            const uploaded = await uploadAudioAtCursor(page, editor, segment.audio.path);
            if (!uploaded) {
              throw new Error(`音声投稿UIを特定できませんでした: ${segment.audio.source}`);
            }
            continue;
          }
          if (segment.comic) {
            const uploaded = await uploadComicAtCursor(page, editor, segment.comic.path);
            if (!uploaded) {
              throw new Error(`コミック作成UIを特定できませんでした: ${segment.comic.source}`);
            }
            continue;
          }
          if (segment.toc) {
            const inserted = await insertTableOfContents(page, editor);
            if (!inserted) {
              throw new Error('目次の挿入UIを特定できませんでした');
            }
            continue;
          }
          if (segment.image) {
            const uploaded = await uploadImageAtCursor(page, editor, segment.image.path);
            if (!uploaded) {
              throw new Error(`画像アップロードボタンを特定できませんでした: ${segment.image.source}`);
            }
            continue;
          }
          await pasteClipboardHtml(page, editor, segment.html, segment.text);
        }
        return;
      }

      await pasteClipboardHtml(page, editor, renderMarkdown(sectionMarkdown), sectionMarkdown);
    };

    await pasteSection(freeBodyMarkdown);
    if (manifest.paidArea.enabled) {
      const inserted = await insertPaidBreak(page);
      if (!inserted) {
        throw new Error('有料エリアの区切りボタンを特定できませんでした。note上で手動設定してください');
      }
      await pasteSection(paidBodyMarkdown);
      console.log('✅ 有料エリアの区切りと本文の入力を試みました');
    }
    console.log(`✅ 本文とローカル画像${localImages.length}件・添付ファイル${localFiles.length}件・音声${localAudio.length}件・コミック${localComics.length}件の入力を試みました`);
    if (!options.uploadImages && localImages.length > 0) {
      console.log('画像はプレースホルダー表示です。実画像を入れる場合は --upload-images を指定してください。');
    }

    console.log(`画像一覧: ${localImages.length}件`);
    console.log(`準備ファイル: ${path.dirname(manifestPath)}`);

    if (options.save) {
      const saved = await saveNote(page);
      if (!saved) {
        console.log('⚠️ 保存ボタンを自動特定できなかったため、保存は行っていません。');
        return;
      }
      recordSavedDraftNoteId(manifestPath, manifest, page.url(), options.state);
      console.log('✅ note側の保存ボタンを押しました。公開は行っていません。');
    } else {
      console.log('保存は行っていません。内容を確認してから --save 付きで実行してください。');
    }
  } finally {
    await context.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !process.argv.slice(2).length) {
    usage();
    return;
  }

  const command = options.article === 'validate' || options.article === 'prepare' || options.article === 'cover-prompt' || options.article === 'draft' || options.article === 'login' || options.article === 'update' || options.article === 'publish'
    ? options.article
    : process.argv[2];
  if (!['validate', 'prepare', 'cover-prompt', 'draft', 'login', 'update', 'publish'].includes(command)) {
    usage();
    throw new Error(`不明なコマンドです: ${command}`);
  }

  // コマンド名を除いた引数を再解析する。
  const commandOptions = parseArgs(process.argv.slice(3));
  commandOptions.state = options.state;
  if (command === 'update' && !process.argv.slice(3).includes('--state')) {
    commandOptions.state = 'published';
  }

  if (command === 'update') {
    if (commandOptions.preserveBody && commandOptions.replaceBody) {
      throw new Error('--replace-bodyと--preserve-bodyは同時に指定できません');
    }
    if (!commandOptions.preserveBody) {
      commandOptions.replaceBody = true;
      commandOptions.uploadCover = true;
      commandOptions.uploadImages = true;
      commandOptions.uploadFiles = true;
      commandOptions.uploadAudio = true;
      commandOptions.uploadComic = true;
    } else {
      commandOptions.replaceBody = false;
    }
  }

  if (command === 'login') {
    await runLogin(commandOptions);
    return;
  }

  if (command === 'publish') {
    await runPublish(commandOptions);
    return;
  }

  if (command === 'draft' || command === 'update') {
    await runDraft(commandOptions, command);
    return;
  }

  const articlePath = resolveArticlePath(commandOptions.article);
  const article = parseArticle(articlePath);
  if (command === 'cover-prompt') {
    createCoverPrompt(article, commandOptions);
    return;
  }

  const report = validateArticle(article, commandOptions.state);
  printReport(article, report, commandOptions.state);

  if (command === 'prepare') {
    const prepared = prepareArticle(article, report, commandOptions);
    console.log(`✅ 下書き準備ファイルを作成しました: ${path.relative(repoRoot, prepared.outDir)}`);
  }

  if (report.errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
