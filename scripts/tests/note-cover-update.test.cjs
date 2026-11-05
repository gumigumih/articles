const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '../note-draft.mjs'), 'utf8');
const functionSource = source.slice(source.indexOf('async function uploadCoverImage('), source.indexOf('\nfunction shouldUploadCover('));
const uploadCoverImage = vm.runInNewContext(`(${functionSource.trim()})`);
const decisionSource = source.slice(source.indexOf('function shouldUploadCover('), source.indexOf('\nasync function insertPaidBreak('));
const shouldUploadCover = vm.runInNewContext(`(${decisionSource.trim()})`);

test('本文更新では既存カバーを維持し、未設定または明示指定時のみアップロードする', () => {
  assert.equal(shouldUploadCover('update', { replaceBody: true }, 'existing.png'), false);
  assert.equal(shouldUploadCover('update', { replaceBody: true }, null), true);
  assert.equal(shouldUploadCover('update', { replaceBody: true, uploadCover: true }, 'existing.png'), true);
  assert.equal(shouldUploadCover('update', { replaceBody: false }, null), false);
});

function collection(items = []) {
  return { count: async () => items.length, nth: (index) => items[index], first: () => items[0] || { waitFor: async () => {} } };
}

test('変更操作が見つからない場合は他のボタンを押さず失敗する', async () => {
  const roles = [];
  const page = {
    locator: () => collection(),
    getByRole: (role, options) => { roles.push(String(options.name)); return collection(); },
  };
  assert.equal(await uploadCoverImage(page, 'cover.png'), false);
  assert.equal(roles.length, 1);
  assert.match(roles[0], /変更/);
});

test('名前を確認できた変更操作でファイルと切り取りを保存する', async () => {
  const calls = [];
  const change = { isVisible: async () => true, click: async () => calls.push('change') };
  const save = { click: async () => calls.push('save') };
  const page = {
    locator: () => collection(),
    getByRole: (role, options) => String(options.name).includes('変更') ? collection([change]) : collection([save]),
    waitForEvent: async () => ({ setFiles: async (file) => calls.push(file) }),
    waitForTimeout: async () => {},
  };
  assert.equal(await uploadCoverImage(page, 'cover.png'), true);
  assert.deepEqual(calls, ['change', 'cover.png', 'save']);
});
