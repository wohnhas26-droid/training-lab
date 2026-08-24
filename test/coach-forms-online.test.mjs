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
    if (u.endsWith('/coach/team')) {
      return { players: [], activity: [], stats: { playerCount: 0, activeToday: 0, avgCompletion: 0, topStreak: 0 } };
    }
    if (u.endsWith('/catalog/exercises')) {
      return [{ id: 'bm_toe_taps', name: 'Toe Taps', category: 'ball_mastery' }];
    }
    if (u.endsWith('/catalog/categories')) {
      return { ball_mastery: { id: 'ball_mastery', name: 'Ball Mastery' } };
    }
    if (u.endsWith('/catalog/levels')) {
      return [
        { id: 'rookie', name: 'Rookie', minXp: 0, icon: '🌱' },
        { id: 'academy', name: 'Academy', minXp: 500, icon: '⚽' },
        { id: 'advanced', name: 'Advanced', minXp: 1500, icon: '🔥' },
      ];
    }
    if (u.endsWith('/catalog/achievements')) {
      return [
        { id: 'first_session', name: 'First Steps', icon: '🎯' },
        { id: 'speed_demon', name: 'Speed Demon', icon: '⚡' },
      ];
    }
    if (u.endsWith('/progress/summary')) {
      return { xp: 1600, streak: 5, minutesTrained: 340, skillsCompleted: 42 };
    }
    if (u.endsWith('/coach/videos')) {
      return [];
    }
    if (u.endsWith('/challenges')) {
      return [{ id: 'speed', name: 'Speed Challenge', progress: 15, joined: true, completed: true }];
    }
    if (u.endsWith('/training/evaluation')) {
      return {
        overallRating: 8,
        recommendation: 'Focus on ball_mastery, passing',
        strengths: ['Good foundation to build upon'],
        improvements: ['Build a more consistent training routine'],
      };
    }
    if (u.endsWith('/progress/achievements') && method === 'GET') {
      return {
        unlocked: ['first_session', 'speed_demon'],
        all: [{ id: 'first_session', name: 'First Steps' }, { id: 'speed_demon', name: 'Speed Demon' }],
      };
    }
    if (u.includes('/progress/achievements/') && method === 'POST') {
      return { achievements: ['first_session', 'speed_demon'], progress: { xp: 1600 } };
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

test('online: empty API roster stays empty (no invented teammates)', async () => {
  const snap = await ds.getCoachTeamRemote();
  assert.deepEqual(snap.players, []);
  assert.deepEqual(snap.activity, []);
  assert.equal(snap.stats.avgCompletion, 0);
  const get = calls.find((c) => c.url.endsWith('/coach/team') && c.method === 'GET');
  assert.ok(get, 'expected a GET to /coach/team');
});

test('online: getCatalogRemote loads exercises and categories from the API', async () => {
  const catalog = await ds.getCatalogRemote();
  assert.equal(catalog.exercises[0].id, 'bm_toe_taps');
  assert.equal(catalog.categories.ball_mastery.name, 'Ball Mastery');
  assert.ok(calls.find((c) => c.url.endsWith('/catalog/exercises')));
  assert.ok(calls.find((c) => c.url.endsWith('/catalog/categories')));
});

test('online: checkAchievementsRemote POSTs newly earned badges', async () => {
  const unlocked = await ds.checkAchievementsRemote({
    progress: { skillsCompleted: 42, streak: 5, xp: 1600 },
    completedExercises: [],
    achievements: ['first_session', 'streak_7'],
    challengeProgress: { speed: 15 },
  });
  assert.deepEqual(unlocked.map((a) => a.id), ['speed_demon']);
  const post = calls.find((c) => c.url.includes('/progress/achievements/speed_demon') && c.method === 'POST');
  assert.ok(post, 'expected a POST to /progress/achievements/speed_demon');
});

test('online: getProgressSummaryRemote GETs /progress/summary', async () => {
  const summary = await ds.getProgressSummaryRemote();
  assert.equal(summary.xp, 1600);
  assert.equal(summary.streak, 5);
  assert.ok(calls.find((c) => c.url.endsWith('/progress/summary') && c.method === 'GET'));
});

test('online: empty API video queue stays empty (no invented teammates)', async () => {
  const videos = await ds.getCoachVideosRemote();
  assert.deepEqual(videos, []);
  assert.doesNotMatch(JSON.stringify(videos), /Jordan Lee|Taylor Kim/);
  const get = calls.find((c) => c.url.endsWith('/coach/videos') && c.method === 'GET');
  assert.ok(get, 'expected a GET to /coach/videos');
});

test('online: getChallengesRemote GETs /challenges', async () => {
  const list = await ds.getChallengesRemote();
  assert.equal(list[0].id, 'speed');
  assert.equal(list[0].completed, true);
  assert.ok(calls.find((c) => c.url.endsWith('/challenges') && c.method === 'GET'));
});

test('online: getEvaluationRemote GETs /training/evaluation', async () => {
  const evaluation = await ds.getEvaluationRemote();
  assert.equal(evaluation.overallRating, 8);
  assert.match(evaluation.recommendation, /ball_mastery/);
  assert.ok(calls.find((c) => c.url.endsWith('/training/evaluation') && c.method === 'GET'));
});

test('online: getAchievementsRemote GETs /progress/achievements', async () => {
  const badges = await ds.getAchievementsRemote();
  assert.deepEqual(badges.unlocked, ['first_session', 'speed_demon']);
  assert.equal(badges.all[1].id, 'speed_demon');
  const get = calls.find((c) => c.url.endsWith('/progress/achievements') && c.method === 'GET');
  assert.ok(get, 'expected a GET to /progress/achievements');
});

test('online: getLevelsRemote GETs /catalog/levels', async () => {
  const levels = await ds.getLevelsRemote();
  assert.equal(levels[0].id, 'rookie');
  assert.equal(levels[2].name, 'Advanced');
  assert.equal(levels[2].minXp, 1500);
  const get = calls.find((c) => c.url.endsWith('/catalog/levels') && c.method === 'GET');
  assert.ok(get, 'expected a GET to /catalog/levels');
});

test('online: getCatalogAchievementsRemote GETs /catalog/achievements', async () => {
  const catalog = await ds.getCatalogAchievementsRemote();
  assert.equal(catalog[0].id, 'first_session');
  assert.equal(catalog[1].name, 'Speed Demon');
  const get = calls.find((c) => c.url.endsWith('/catalog/achievements') && c.method === 'GET');
  assert.ok(get, 'expected a GET to /catalog/achievements');
});
