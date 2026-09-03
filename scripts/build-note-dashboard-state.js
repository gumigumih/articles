const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const noteRoot = path.join(repoRoot, 'note');
const recordsPath = path.join(noteRoot, 'posting-records.json');
const outputPath = path.join(repoRoot, 'note-dashboard', 'state.json');
const profilePath = path.join(repoRoot, 'note-dashboard', 'note-profile.json');

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) return '';
  return result.stdout || '';
}

function gitStatusLabel(code) {
  if (code === '??') return 'untracked';
  if (code.includes('D')) return 'deleted';
  if (code.includes('R')) return 'renamed';
  if (code.includes('A')) return 'added';
  if (code.includes('M')) return 'modified';
  return 'changed';
}

function parseGitStatus() {
  const raw = runGit(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', 'note']);
  const entries = new Map();
  for (const token of raw.split('\0')) {
    if (!token || token.length < 4) continue;
    const code = token.slice(0, 2);
    const filePath = token.slice(3);
    if (filePath.startsWith('note/')) {
      entries.set(filePath, { path: filePath, code, status: gitStatusLabel(code) });
    }
  }
  return entries;
}

function trackedAndUntrackedNoteFiles() {
  return runGit(['ls-files', '--cached', '--others', '--exclude-standard', '--', 'note'])
    .split('\n').map((value) => value.trim()).filter(Boolean);
}

function readFromWorkingTreeOrHead(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (fs.existsSync(absolutePath)) return fs.readFileSync(absolutePath, 'utf8');
  return runGit(['show', `HEAD:${relativePath}`]);
}

function unquote(value) {
  const trimmed = String(value || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseMarkdownMetadata(content) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
  const hashtagsMatch = frontmatter.match(/^note_hashtags:\s*(.+)$/m);
  const headingMatch = content.match(/^#\s+(.+)$/m);
  return {
    title: unquote(titleMatch ? titleMatch[1] : (headingMatch ? headingMatch[1] : 'タイトル未設定')),
    hashtags: unquote(hashtagsMatch ? hashtagsMatch[1] : ''),
  };
}

function loadRecords() {
  try {
    const parsed = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
    return parsed.records || {};
  } catch (_) {
    return {};
  }
}

function loadProfileArticles() {
  try {
    return JSON.parse(fs.readFileSync(profilePath, 'utf8')).articles || {};
  } catch (_) {
    return {};
  }
}

function isArticle(relativePath) {
  return /^note\/[^/]+\.md$/.test(relativePath) && !relativePath.endsWith('.x-post.md');
}

function coverInfo(slug, headFiles) {
  const relativePath = `note/images/${slug}/cover.png`;
  const exists = fs.existsSync(path.join(repoRoot, relativePath));
  const trackedInHead = headFiles.has(relativePath);
  return { path: relativePath, exists, status: exists ? 'ready' : (trackedInHead ? 'deleted' : 'missing') };
}

function gitDate(relativePath) {
  return runGit(['log', '-1', '--format=%aI', '--', relativePath]).trim() || null;
}

function buildState() {
  const statusEntries = parseGitStatus();
  const filePaths = new Set(trackedAndUntrackedNoteFiles());
  for (const filePath of statusEntries.keys()) filePaths.add(filePath);
  const headFiles = new Set(runGit(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'note/images'])
    .split('\n').map((value) => value.trim()).filter(Boolean));
  const records = loadRecords();
  const profileArticles = loadProfileArticles();
  const articles = [...filePaths].filter(isArticle).sort((a, b) => b.localeCompare(a)).map((relativePath) => {
    const content = readFromWorkingTreeOrHead(relativePath);
    const slug = path.basename(relativePath, '.md');
    const record = records[slug] || null;
    const noteProfile = profileArticles[slug] || null;
    const statusEntry = statusEntries.get(relativePath);
    const absolutePath = path.join(repoRoot, relativePath);
    const workingTreeAt = statusEntry && fs.existsSync(absolutePath) ? fs.statSync(absolutePath).mtime.toISOString() : null;
    return {
      path: relativePath,
      slug,
      title: parseMarkdownMetadata(content).title,
      hashtags: parseMarkdownMetadata(content).hashtags,
      gitStatus: statusEntry ? statusEntry.status : 'clean',
      gitCode: statusEntry ? statusEntry.code : '  ',
      exists: fs.existsSync(absolutePath),
      lastCommitAt: gitDate(relativePath),
      lastActivityAt: workingTreeAt || gitDate(relativePath),
      lineCount: content ? content.split('\n').length : 0,
      cover: coverInfo(slug, headFiles),
      record,
      noteProfile,
      publicationStatus: record?.status === 'deleted' ? 'deleted' : (noteProfile ? 'published' : 'not_published'),
    };
  });
  const changes = [...statusEntries.values()]
    .filter((entry) => !isArticle(entry.path))
    .map((entry) => ({ ...entry, exists: fs.existsSync(path.join(repoRoot, entry.path)) }));
  const published = articles.filter((article) => article.publicationStatus === 'published');
  const deletedPublications = articles.filter((article) => article.publicationStatus === 'deleted');
  const articleChanges = articles.filter((article) => article.gitStatus !== 'clean');
  const readyCovers = articles.filter((article) => article.cover.status === 'ready');
  return {
    generatedAt: new Date().toISOString(),
    source: {
      directory: 'note/',
      branch: runGit(['branch', '--show-current']).trim() || 'detached HEAD',
      head: runGit(['rev-parse', '--short', 'HEAD']).trim() || null,
      recordsPath: 'note/posting-records.json',
      profile: 'https://note.com/gumigumih',
      profileFetchedAt: JSON.parse(fs.readFileSync(profilePath, 'utf8')).fetchedAt,
      mode: 'repository snapshot',
    },
    summary: {
      articles: articles.length,
      changes: articleChanges.length + changes.length,
      articleChanges: articleChanges.length,
      untracked: [...statusEntries.values()].filter((entry) => entry.status === 'untracked').length,
      deleted: [...statusEntries.values()].filter((entry) => entry.status === 'deleted').length,
      published: published.length,
      notPublished: articles.filter((article) => article.publicationStatus === 'not_published').length,
      deletedPublications: deletedPublications.length,
      missingRecords: articles.filter((article) => !article.record).length,
      readyCovers: readyCovers.length,
      missingCovers: articles.length - readyCovers.length,
    },
    articles,
    changes,
    recordsError: null,
  };
}

fs.writeFileSync(outputPath, `${JSON.stringify(buildState(), null, 2)}\n`, 'utf8');
console.log(`note dashboard state: ${path.relative(repoRoot, outputPath)}`);
