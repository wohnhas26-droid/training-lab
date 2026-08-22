// API mode: when the API is reachable, the coach dataStore wrappers must call
// the backend endpoints and must NOT write to localStorage / the local store.
import test from 'node:test';
import assert from 'node:assert/strict';

function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
  };
}

const calls = [];
globalThis.window = { location: { hostname: 'localhost' } };
globalThis.localStorage = makeLocalStorage();
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const method = opts.method || 'GET';
  calls.push({ url: u, method, body: opts.body });
  const json = async () => {
    if (u.endsWith('/health')) return { status: 'ok' };
    if (u.endsWith('/coach/assignments') && method === 'POST') {
      const b = JSON.parse(opts.body);
      return { id: 'srv-1', title: b.title, category: b.category, assignTo: b.assignTo, dueDate: b.dueDate };
    }
    if (u.endsWith('/coach/assignments')) {
      return [{ id: 'srv-0', title: 'Existing drill', category: 'passing', assignTo: 'all', dueDate: '2026-01-01' }];
    }
    if (u.endsWith('/coach/feedback')) {
      return { id: 'fb-1', ...JSON.parse(opts.body) };
    }
    if (u.includes('/coach/players/')) {
      return { user: { id: 'p-123', name: 'Alex Rivera' }, reports: [], videos: [] };
    }
    return {};
  };
  return { ok: true, status: 200, json };
};

const ds = await import('../js/services/dataStore.js');

test('online: bootstrap detects the API', async () => {
  const online = await ds.bootstrap();
  assert.equal(online, true);
  assert.equal(ds.isApiMode(), true);
});

test('online: createAssignmentRemote POSTs to the API (no localStorage write)', async () => {
  const created = await ds.createAssignmentRemote({
    title: 'Server drill', category: 'passing', dueDate: '2026-02-02', notes: '', assignTo: 'all',
  });
  assert.equal(created.id, 'srv-1');
  assert.equal(created.title, 'Server drill');
  const post = calls.find((c) => c.url.endsWith('/coach/assignments') && c.method === 'POST');
  assert.ok(post, 'expected a POST to /coach/assignments');
  assert.equal(localStorage.getItem('coach_assignments'), null);
});

test('online: getAssignmentsRemote GETs from the API', async () => {
  const list = await ds.getAssignmentsRemote();
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Existing drill');
});

test('online: submitFeedbackRemote POSTs playerId to the API (no local write)', async () => {
  await ds.submitFeedbackRemote({ playerId: 'p-123', playerName: 'Alex', feedback: 'Nice', rating: 9, videoId: 'vid-1' });
  const post = calls.find((c) => c.url.endsWith('/coach/feedback') && c.method === 'POST');
  assert.ok(post, 'expected a POST to /coach/feedback');
  const sent = JSON.parse(post.body);
  assert.equal(sent.playerId, 'p-123');
  assert.equal(sent.rating, 9);
  assert.equal(sent.feedback, 'Nice');
  assert.equal(sent.videoId, 'vid-1');
  assert.equal(localStorage.getItem('training_lab_app'), null);
});

test('online: getCoachPlayerRemote GETs the player report', async () => {
  const detail = await ds.getCoachPlayerRemote('p-123');
  assert.equal(detail.user.name, 'Alex Rivera');
  const get = calls.find((c) => c.url.includes('/coach/players/p-123') && c.method === 'GET');
  assert.ok(get, 'expected a GET to /coach/players/:id');
});
