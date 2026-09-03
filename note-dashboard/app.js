const statusLabels = {
  clean: '変更なし',
  untracked: '未追跡',
  deleted: '削除',
  modified: '更新',
  added: '追加',
  renamed: '改名',
  changed: '変更',
};

const publicationLabels = {
  not_recorded: '未照合',
  not_published: '未掲載',
  published: '公開確認',
  deleted: '削除済み',
};

const coverLabels = { ready: '用意済み', missing: '未用意', deleted: '削除' };

const appState = {
  data: null,
  selectedSlug: null,
  query: '',
  gitFilter: 'all',
  publicationFilter: 'all',
  coverFilter: 'all',
  sort: 'updated',
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function formatSync(value) {
  if (!value) return '同期済み';
  const date = new Date(value);
  return `生成時点 ${new Intl.DateTimeFormat('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)}`;
}

function badge(status, label) {
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

function recordStatus(article) {
  return article.publicationStatus || 'not_recorded';
}

function getSelectedArticle() {
  return appState.data?.articles.find((article) => article.slug === appState.selectedSlug) || null;
}

function setError(message) {
  const banner = $('#error-banner');
  banner.textContent = message || '';
  banner.hidden = !message;
}

function renderSummary() {
  const { summary, source, generatedAt } = appState.data;
  $('#stat-articles').textContent = summary.articles;
  $('#stat-changes').textContent = summary.changes;
  $('#stat-changes-note').textContent = `${summary.untracked} 未追跡 / ${summary.deleted} 削除 / ${summary.articleChanges} 記事変更`;
  $('#stat-published').textContent = summary.published;
  $('#stat-covers').textContent = `${summary.readyCovers} / ${summary.articles}`;
  $('#stat-covers-note').textContent = summary.missingCovers ? `${summary.missingCovers} 件が未用意または削除` : 'すべて用意済み';
  $('#nav-article-count').textContent = summary.articles;
  $('#nav-change-count').textContent = summary.changes;
  $('#source-branch').textContent = source.branch;
  $('#source-head').textContent = source.head || '—';
  $('#sync-state').textContent = formatSync(generatedAt);
}

function filteredArticles() {
  const query = appState.query.trim().toLowerCase();
  const filtered = appState.data.articles.filter((article) => {
    const searchable = `${article.title} ${article.slug} ${article.path}`.toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (appState.gitFilter === 'changes' && article.gitStatus === 'clean') return false;
    if (appState.gitFilter !== 'all' && appState.gitFilter !== 'changes' && article.gitStatus !== appState.gitFilter) return false;
    if (appState.publicationFilter !== 'all' && recordStatus(article) !== appState.publicationFilter) return false;
    if (appState.coverFilter !== 'all' && article.cover.status !== appState.coverFilter) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (appState.sort === 'title') return a.title.localeCompare(b.title, 'ja');
    if (appState.sort === 'status') return `${a.gitStatus}${recordStatus(a)}${a.cover.status}`.localeCompare(`${b.gitStatus}${recordStatus(b)}${b.cover.status}`);
    return (b.lastActivityAt || '').localeCompare(a.lastActivityAt || '');
  });
}

function renderArticles() {
  const articles = filteredArticles();
  $('#result-count').textContent = `${articles.length} / ${appState.data.articles.length} 件`;
  $('#table-footer-copy').textContent = appState.data.recordsError
    || (appState.data.source.mode === 'repository snapshot' ? 'リポジトリの生成時点を表示' : '現在のローカル状態を表示');
  if (!articles.length) {
    $('#articles-body').innerHTML = '<tr><td colspan="6" class="empty-cell">条件に一致する記事はありません。</td></tr>';
    return;
  }
  $('#articles-body').innerHTML = articles.map((article) => {
    const publicationStatus = recordStatus(article);
    const selected = article.slug === appState.selectedSlug ? ' is-selected' : '';
    const gitLabel = statusLabels[article.gitStatus] || article.gitStatus;
    const coverLabel = coverLabels[article.cover.status] || article.cover.status;
    return `<tr class="article-row${selected}" data-slug="${escapeHtml(article.slug)}">
      <td><span class="article-title" title="${escapeHtml(article.title)}">${escapeHtml(article.title)}</span><code class="article-slug">${escapeHtml(article.slug)}</code></td>
      <td><span class="article-date">${formatDate(article.lastActivityAt)}</span><small class="article-date"><small>${article.lineCount} lines</small></small></td>
      <td>${badge(article.gitStatus, gitLabel)}</td>
      <td>${badge(article.cover.status, coverLabel)}</td>
      <td>${badge(publicationStatus, publicationLabels[publicationStatus] || publicationStatus)}</td>
      <td><span class="row-arrow">›</span></td>
    </tr>`;
  }).join('');
}

function renderChanges() {
  const allChanges = [
    ...appState.data.articles.filter((article) => article.gitStatus !== 'clean').map((article) => ({
      path: article.path, status: article.gitStatus, code: article.gitCode, exists: article.exists,
    })),
    ...appState.data.changes,
  ];
  if (!allChanges.length) {
    $('#changes-list').innerHTML = '<div class="no-changes">✓ note/ 配下に未追跡・削除・更新はありません</div>';
    return;
  }
  $('#changes-list').innerHTML = allChanges.map((change) => `<div class="change-item">
    ${badge(change.status, statusLabels[change.status] || change.status)}
    <div class="change-copy"><span class="change-path" title="${escapeHtml(change.path)}">${escapeHtml(change.path)}</span><span class="change-code">status ${escapeHtml(change.code || '—')} · ${change.exists ? 'ファイルあり' : '作業ツリーに不在'}</span></div>
  </div>`).join('');
}

function fillRecordForm() {
  const article = getSelectedArticle();
  const empty = $('#record-empty');
  const form = $('#record-form');
  if (!article) {
    empty.hidden = false;
    form.hidden = true;
    $('#record-status-dot').className = 'record-status-dot';
    return;
  }
  empty.hidden = true;
  form.hidden = false;
  const record = article.record || {};
  const status = record.status || 'draft';
  $('#selected-title').textContent = article.title;
  $('#selected-slug').textContent = article.slug;
  const profileStatus = article.noteProfile
    ? `<a href="${escapeHtml(article.noteProfile.noteUrl)}" target="_blank" rel="noreferrer">noteプロフィールで公開確認 ↗</a>`
    : 'noteプロフィールでは未確認';
  $('#selected-profile-status').innerHTML = profileStatus;
  $('#record-status').value = status;
  $('#record-published-at').value = record.publishedAt || '';
  $('#record-recorded-at').value = record.recordedAt || new Date().toISOString().slice(0, 10);
  $('#record-note-id').value = record.noteId || '';
  $('#record-price').value = record.priceYen ?? '';
  $('#record-views').value = record.views ?? '';
  $('#record-likes').value = record.likes ?? '';
  $('#record-url').value = record.noteUrl || '';
  $('#record-magazine').value = record.magazine || '';
  $('#record-x-posted').checked = Boolean(record.xPosted);
  $('#record-memo').value = record.memo || '';
  $('#record-status-dot').className = `record-status-dot is-${status}`;
}

function renderAll() {
  renderSummary();
  renderArticles();
  renderChanges();
  fillRecordForm();
}

async function persistRecord(payload) {
  try {
    const response = await fetch('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = response.headers.get('content-type')?.includes('application/json')
      ? await response.json() : {};
    if (!response.ok) {
      if (response.status === 404) throw new TypeError('static mode');
      throw new Error(result.error || 'save failed');
    }
    appState.data = result.state;
    return { savedTo: 'local dashboard' };
  } catch (error) {
    if (!(error instanceof TypeError || error.message === 'Failed to fetch')) throw error;
    const records = JSON.parse(localStorage.getItem('note-ops-records') || '{}');
    const record = {
      ...payload,
      priceYen: payload.priceYen === '' ? null : Number(payload.priceYen),
      views: payload.views === '' ? null : Number(payload.views),
      likes: payload.likes === '' ? null : Number(payload.likes),
      xPosted: Boolean(payload.xPosted),
      updatedAt: new Date().toISOString(),
    };
    records[payload.slug] = record;
    localStorage.setItem('note-ops-records', JSON.stringify(records));
    appState.data.articles = appState.data.articles.map((item) => item.slug === payload.slug
      ? { ...item, record } : item);
    return { savedTo: 'this browser' };
  }
}

function registerWebMcp() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  Promise.resolve(context.registerTool({
    name: 'save_posting_record',
    title: '投稿記録を保存',
    description: '記事スラッグを指定して投稿ステータスや公開記録を保存し、画面の一覧を更新します。note公開やGit操作は行いません。',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' }, status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'unpublished', 'deleted'] },
        publishedAt: { type: 'string' }, recordedAt: { type: 'string' }, noteId: { type: 'string' },
        priceYen: { type: ['number', 'string', 'null'] }, views: { type: ['number', 'string', 'null'] }, likes: { type: ['number', 'string', 'null'] },
        noteUrl: { type: 'string' }, magazine: { type: 'string' }, xPosted: { type: 'boolean' }, memo: { type: 'string' },
      },
      required: ['slug', 'status'], additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      const article = appState.data?.articles.find((item) => item.slug === input.slug);
      if (!article) throw new Error('記事スラッグが見つかりません');
      const payload = { ...input, recordedAt: input.recordedAt || new Date().toISOString().slice(0, 10) };
      const result = await persistRecord(payload);
      appState.selectedSlug = article.slug;
      renderAll();
      return { slug: article.slug, status: payload.status, ...result };
    },
  }, { signal: lifecycle.signal })).catch(() => {});
}

async function loadState({ keepSelection = true } = {}) {
  const previous = appState.selectedSlug;
  try {
    let response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) response = await fetch('/state.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('state request failed');
    appState.data = await response.json();
    const savedRecords = JSON.parse(localStorage.getItem('note-ops-records') || '{}');
    appState.data.articles = appState.data.articles.map((article) => ({
      ...article,
      record: savedRecords[article.slug] || article.record,
    }));
    if (!keepSelection || !appState.data.articles.some((article) => article.slug === previous)) {
      const latest = [...appState.data.articles].sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''));
      appState.selectedSlug = latest[0]?.slug || null;
    }
    setError('');
    renderAll();
  } catch (error) {
    setError('データを読み込めませんでした。サーバーが起動しているか確認してください。');
  }
}

async function saveRecord(event) {
  event.preventDefault();
  const article = getSelectedArticle();
  if (!article) return;
  const button = $('.save-button');
  button.disabled = true;
  button.innerHTML = '<span>…</span> 保存中';
  const payload = {
    slug: article.slug,
    status: $('#record-status').value,
    publishedAt: $('#record-published-at').value,
    recordedAt: $('#record-recorded-at').value,
    noteId: $('#record-note-id').value,
    priceYen: $('#record-price').value,
    views: $('#record-views').value,
    likes: $('#record-likes').value,
    noteUrl: $('#record-url').value,
    magazine: $('#record-magazine').value,
    xPosted: $('#record-x-posted').checked,
    memo: $('#record-memo').value,
  };
  try {
    await persistRecord(payload);
    appState.selectedSlug = article.slug;
    setError('');
    renderAll();
    button.innerHTML = '<span>✓</span> 保存しました';
    setTimeout(() => { button.innerHTML = '<span>✓</span> 投稿記録を保存'; }, 1600);
  } catch (error) {
    setError(`投稿記録を保存できませんでした: ${error.message}`);
    button.innerHTML = '<span>✓</span> 投稿記録を保存';
  } finally {
    button.disabled = false;
  }
}

$('#refresh-button').addEventListener('click', () => loadState());
$('#search-input').addEventListener('input', (event) => { appState.query = event.target.value; renderArticles(); });
$('#git-filter').addEventListener('change', (event) => { appState.gitFilter = event.target.value; renderArticles(); });
$('#publication-filter').addEventListener('change', (event) => { appState.publicationFilter = event.target.value; renderArticles(); });
$('#cover-filter').addEventListener('change', (event) => { appState.coverFilter = event.target.value; renderArticles(); });
$('#sort-select').addEventListener('change', (event) => { appState.sort = event.target.value; renderArticles(); });
$('#articles-body').addEventListener('click', (event) => {
  const row = event.target.closest('[data-slug]');
  if (!row) return;
  appState.selectedSlug = row.dataset.slug;
  renderArticles();
  fillRecordForm();
  if (window.innerWidth < 900) $('#record').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#record-form').addEventListener('submit', saveRecord);

registerWebMcp();
loadState({ keepSelection: false });
