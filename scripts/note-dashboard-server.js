const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { URL } = require('url');

const repoRoot = path.resolve(__dirname, '..');
const dashboardRoot = path.join(repoRoot, 'note-dashboard');
const noteRoot = path.join(repoRoot, 'note');
const recordsPath = path.join(noteRoot, 'posting-records.json');
const profilePath = path.join(dashboardRoot, 'note-profile.json');
const port = Number(process.env.NOTE_DASHBOARD_PORT || 4310);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) return '';
  return result.stdout || '';
}

function parseGitStatus() {
  const raw = runGit(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', 'note']);
  const entries = new Map();
  for (const token of raw.split('\0')) {
    if (!token || token.length < 4) continue;
    const code = token.slice(0, 2);
    const filePath = token.slice(3);
    if (!filePath.startsWith('note/')) continue;
    entries.set(filePath, { path: filePath, code, status: gitStatusLabel(code) });
  }
  return entries;
}

function gitStatusLabel(code) {
  if (code === '??') return 'untracked';
  if (code.includes('D')) return 'deleted';
  if (code.includes('R')) return 'renamed';
  if (code.includes('A')) return 'added';
  if (code.includes('M')) return 'modified';
  return 'changed';
}

function trackedAndUntrackedNoteFiles() {
  return runGit(['ls-files', '--cached', '--others', '--exclude-standard', '--', 'note'])
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
}

function readFromWorkingTreeOrHead(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (fs.existsSync(absolutePath)) {
    try {
      return fs.readFileSync(absolutePath, 'utf8');
    } catch (_) {
      return '';
    }
  }
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

function gitDate(relativePath) {
  return runGit(['log', '-1', '--format=%aI', '--', relativePath]).trim() || null;
}

function loadRecords() {
  if (!fs.existsSync(recordsPath)) return { version: 1, records: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
    return { version: 1, records: parsed.records || {} };
  } catch (_) {
    return { version: 1, records: {}, error: '投稿記録JSONを読み込めませんでした' };
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

function isSupportFile(relativePath) {
  return relativePath.startsWith('note/') && !isArticle(relativePath);
}

function coverInfo(slug, headFiles) {
  const relativePath = `note/images/${slug}/cover.png`;
  const absolutePath = path.join(repoRoot, relativePath);
  const exists = fs.existsSync(absolutePath);
  const trackedInHead = headFiles.has(relativePath);
  return {
    path: relativePath,
    exists,
    status: exists ? 'ready' : (trackedInHead ? 'deleted' : 'missing'),
  };
}

function buildState() {
  const statusEntries = parseGitStatus();
  const filePaths = new Set(trackedAndUntrackedNoteFiles());
  for (const filePath of statusEntries.keys()) filePaths.add(filePath);
  const headFiles = new Set(runGit(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'note/images'])
    .split('\n').map((value) => value.trim()).filter(Boolean));

  const rawRecords = loadRecords();
  const records = rawRecords.records;
  const profileArticles = loadProfileArticles();
  const articles = [...filePaths]
    .filter(isArticle)
    .sort((a, b) => b.localeCompare(a))
    .map((relativePath) => {
      const content = readFromWorkingTreeOrHead(relativePath);
      const metadata = parseMarkdownMetadata(content);
      const slug = path.basename(relativePath, '.md');
      const record = records[slug] || null;
      const noteProfile = profileArticles[slug] || null;
      const statusEntry = statusEntries.get(relativePath);
      const absolutePath = path.join(repoRoot, relativePath);
      const lastCommitAt = gitDate(relativePath);
      const cover = coverInfo(slug, headFiles);
      const workingTreeAt = statusEntry && fs.existsSync(absolutePath)
        ? fs.statSync(absolutePath).mtime.toISOString()
        : null;
      return {
        path: relativePath,
        slug,
        title: metadata.title,
        hashtags: metadata.hashtags,
        gitStatus: statusEntry ? statusEntry.status : 'clean',
        gitCode: statusEntry ? statusEntry.code : '  ',
        exists: fs.existsSync(absolutePath),
        lastCommitAt,
        lastActivityAt: workingTreeAt || lastCommitAt,
        lineCount: content ? content.split('\n').length : 0,
        cover,
        record,
        noteProfile,
        publicationStatus: record?.status === 'deleted' ? 'deleted' : (noteProfile ? 'published' : 'not_published'),
      };
    });

  const changes = [...statusEntries.values()]
    .filter((entry) => isSupportFile(entry.path) || !isArticle(entry.path))
    .map((entry) => ({ ...entry, exists: fs.existsSync(path.join(repoRoot, entry.path)) }));

  const articleChanges = articles.filter((article) => article.gitStatus !== 'clean');
  const published = articles.filter((article) => article.publicationStatus === 'published');
  const deletedPublications = articles.filter((article) => article.publicationStatus === 'deleted');
  const missingRecords = articles.filter((article) => !article.record);
  const readyCovers = articles.filter((article) => article.cover.status === 'ready');
  const missingCovers = articles.filter((article) => article.cover.status !== 'ready');

  return {
    generatedAt: new Date().toISOString(),
    source: {
      directory: 'note/',
      branch: runGit(['branch', '--show-current']).trim() || 'detached HEAD',
      head: runGit(['rev-parse', '--short', 'HEAD']).trim() || null,
      recordsPath: 'note/posting-records.json',
      profile: 'https://note.com/gumigumih',
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
      missingRecords: missingRecords.length,
      readyCovers: readyCovers.length,
      missingCovers: missingCovers.length,
    },
    articles,
    changes,
    recordsError: rawRecords.error || null,
  };
}

function writeRecords(records) {
  const temporaryPath = `${recordsPath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify({ version: 1, records }, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, recordsPath);
}

function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) request.destroy(new Error('request too large'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function serveStatic(requestPath, response) {
  const requested = requestPath === '/' ? 'index.html' : requestPath.replace(/^\//, '');
  const absolutePath = path.resolve(dashboardRoot, requested);
  if (!absolutePath.startsWith(`${dashboardRoot}${path.sep}`)) {
    json(response, 403, { error: 'forbidden' });
    return;
  }
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    json(response, 404, { error: 'not found' });
    return;
  }
  const extension = path.extname(absolutePath);
  response.writeHead(200, {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  response.end(fs.readFileSync(absolutePath));
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
  try {
    if (requestUrl.pathname === '/api/state' && request.method === 'GET') {
      json(response, 200, buildState());
      return;
    }

    if (requestUrl.pathname === '/api/records' && request.method === 'POST') {
      const input = await parseRequestBody(request);
      const slug = String(input.slug || '').trim();
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(slug)) {
        json(response, 400, { error: 'slugが不正です' });
        return;
      }
      const allowedStatuses = new Set(['draft', 'scheduled', 'published', 'unpublished']);
      const existing = loadRecords().records[slug] || {};
      const next = {
        ...existing,
        status: allowedStatuses.has(input.status) ? input.status : 'draft',
        publishedAt: String(input.publishedAt || '').trim(),
        noteUrl: String(input.noteUrl || '').trim(),
        noteId: String(input.noteId || '').trim(),
        priceYen: input.priceYen === '' || input.priceYen == null ? null : Number(input.priceYen),
        views: input.views === '' || input.views == null ? null : Number(input.views),
        likes: input.likes === '' || input.likes == null ? null : Number(input.likes),
        xPosted: Boolean(input.xPosted),
        magazine: String(input.magazine || '').trim(),
        memo: String(input.memo || '').trim(),
        recordedAt: String(input.recordedAt || '').trim() || new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      };
      for (const key of ['priceYen', 'views', 'likes']) {
        if (next[key] !== null && (!Number.isFinite(next[key]) || next[key] < 0)) next[key] = null;
      }
      const records = loadRecords().records;
      records[slug] = next;
      writeRecords(records);
      json(response, 200, { ok: true, record: next, state: buildState() });
      return;
    }

    if (requestUrl.pathname === '/api/article' && request.method === 'GET') {
      const relativePath = requestUrl.searchParams.get('path') || '';
      if (!isArticle(relativePath)) {
        json(response, 400, { error: '記事パスが不正です' });
        return;
      }
      const content = readFromWorkingTreeOrHead(relativePath);
      response.writeHead(content ? 200 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(content || '記事を読み込めませんでした');
      return;
    }

    serveStatic(requestUrl.pathname, response);
  } catch (error) {
    json(response, 500, { error: 'サーバー処理に失敗しました' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`note dashboard: http://127.0.0.1:${port}`);
  console.log('Git操作とnote公開はこの画面から実行しません。');
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
