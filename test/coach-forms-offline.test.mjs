// Offline fallback: with no reachable API, the coach dataStore wrappers must
// persist to localStorage / the local state store instead of throwing.
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

// Minimal browser globals the frontend modules expect, set BEFORE import.
globalThis.window = { location: { hostname: 'localhost' } };
globalThis.localStorage = makeLocalStorage();
// Simulate the API being unreachable so checkApiHealth() marks offline mode.
globalThis.fetch = async () => { throw new Error('network unavailable'); };

const ds = await import('../js/services/dataStore.js');

test('offline: bootstrap reports API unavailable', async () => {
  const online = await ds.bootstrap();
  assert.equal(online, false);
  assert.equal(ds.isApiMode(), false);
});

test('offline: createAssignmentRemote falls back to localStorage', async () => {
  const created = await ds.createAssignmentRemote({
    title: 'Cone drill', category: 'dribbling', dueDate: '2026-01-01', notes: 'n', assignTo: 'all',
  });
  assert.match(created.id, /^local-/);
  const stored = JSON.parse(localStorage.getItem('coach_assignments'));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].title, 'Cone drill');
  assert.equal(stored[0].assignTo, 'all');
});

test('offline: getAssignmentsRemote reads localStorage', async () => {
  const list = await ds.getAssignmentsRemote();
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Cone drill');
});

test('offline: submitFeedbackRemote falls back to the local state store', async () => {
  await ds.submitFeedbackRemote({
    playerId: 'p1', playerName: 'Alex Rivera', feedback: 'Great scanning', rating: 8,
  });
  const state = JSON.parse(localStorage.getItem('training_lab_app'));
  assert.equal(state.coachFeedback.length, 1);
  assert.equal(state.coachFeedback[0].player, 'Alex Rivera');
  assert.equal(state.coachFeedback[0].feedback, 'Great scanning');
  assert.equal(state.coachFeedback[0].rating, 8);
});

test('offline: getCoachPlayerRemote requires the API', async () => {
  await assert.rejects(
    () => ds.getCoachPlayerRemote('player-1'),
    /internet connection/,
  );
});

test('offline: getCatalogRemote returns null so the page can use the bundled catalog', async () => {
  const catalog = await ds.getCatalogRemote();
  assert.equal(catalog, null);
});

test('offline: getProgressSummaryRemote returns null so local summary is used', async () => {
  const summary = await ds.getProgressSummaryRemote();
  assert.equal(summary, null);
});

test('offline: getCoachVideosRemote is empty and does not invent teammates', async () => {
  const videos = await ds.getCoachVideosRemote();
  assert.deepEqual(videos, []);
  assert.doesNotMatch(JSON.stringify(videos), /Jordan Lee|Taylor Kim/);
});

test('offline: getChallengesRemote returns null so the page can use the bundled catalog', async () => {
  const list = await ds.getChallengesRemote();
  assert.equal(list, null);
});

test('offline: getEvaluationRemote returns null so elite pages can use the local planner', async () => {
  const evaluation = await ds.getEvaluationRemote();
  assert.equal(evaluation, null);
});

test('offline: getAchievementsRemote returns null so the page can use the bundled catalog', async () => {
  const badges = await ds.getAchievementsRemote();
  assert.equal(badges, null);
});

test('offline: getLevelsRemote returns null so the page can use the bundled catalog', async () => {
  const levels = await ds.getLevelsRemote();
  assert.equal(levels, null);
});

test('offline: getCatalogAchievementsRemote returns null so the page can use the bundled catalog', async () => {
  const catalog = await ds.getCatalogAchievementsRemote();
  assert.equal(catalog, null);
});
