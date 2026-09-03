import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml } from '../js/components/ui.js';
import { videoPreviewHtml } from '../js/utils/videoEmbed.js';
import { renderSkillVideoList, renderVideoSkillOptions, VIDEOS_LOAD_FAILED } from '../js/components/skillVideos.js';

const helpers = { escapeHtml, videoPreviewHtml };

test('a failed video load is not an empty submission list', () => {
  const html = renderSkillVideoList(null, helpers);
  assert.match(html, /Could not load videos right now/);
  assert.doesNotMatch(html, /No submissions yet/);
  assert.equal(VIDEOS_LOAD_FAILED.includes('Try again in a moment'), true);
});

test('empty list uses the provided empty copy', () => {
  const html = renderSkillVideoList([], { ...helpers, emptyText: 'No skill videos submitted.' });
  assert.match(html, /No skill videos submitted/);
  assert.doesNotMatch(html, /<video /);
});

test('escapes skill names and does not inject raw URLs into text', () => {
  const html = renderSkillVideoList([
    { skill: 'First <Touch>', url: 'javascript:alert(1)', status: 'pending' },
  ], helpers);
  assert.match(html, /First &lt;Touch&gt;/);
  assert.doesNotMatch(html, /javascript:alert/);
  assert.match(html, /Pending Review/);
  assert.match(html, /No video link provided/);
});

test('direct mp4 links render a video player', () => {
  const html = renderSkillVideoList([
    {
      skill: 'Finishing',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      status: 'reviewed',
    },
  ], { ...helpers, pendingLabel: 'Pending', reviewedLabel: 'Reviewed' });
  assert.match(html, /<video /);
  assert.match(html, /ForBiggerEscapes\.mp4/);
  assert.match(html, /Reviewed/);
  assert.doesNotMatch(html, /Pending/);
});

test('video skill options use catalog names and escape labels', () => {
  const html = renderVideoSkillOptions({
    first_touch: { id: 'first_touch', name: 'First <Touch>' },
    passing: { id: 'passing', name: 'Passing' },
  }, { escapeHtml });
  assert.match(html, /value="First &lt;Touch&gt;"/);
  assert.match(html, />First &lt;Touch&gt;</);
  assert.match(html, /value="Passing"/);
  assert.doesNotMatch(html, /First <Touch>/);
});

test('video remotes return null when the API request fails', () => {
  const src = readFileSync(new URL('../js/services/dataStore.js', import.meta.url), 'utf8');
  const coach = src.slice(src.indexOf('export async function getCoachVideosRemote'), src.indexOf('export async function addChildRemote'));
  const player = src.slice(src.indexOf('export async function getMyVideosRemote'), src.indexOf('export async function submitVideoRemote'));
  assert.match(coach, /return null;/);
  assert.match(player, /return null;/);
  assert.doesNotMatch(coach, /catch \{\s*return \[\];/);
  assert.doesNotMatch(player, /catch \{\s*return \[\];/);
});

test('coach feedback distinguishes a failed video load from no submissions', () => {
  const html = readFileSync(new URL('../coach/feedback.html', import.meta.url), 'utf8');
  assert.match(html, /VIDEOS_LOAD_FAILED/);
  assert.match(html, /if \(videos === null\)/);
  assert.match(html, /No video submissions yet/);
});

test('progress page loads video skill options from TrainingLab.getCatalog', () => {
  const html = readFileSync(new URL('../player/progress.html', import.meta.url), 'utf8');
  assert.match(html, /TrainingLab\.getCatalog\(\)/);
  assert.match(html, /renderVideoSkillOptions\(catalog\.categories/);
  assert.doesNotMatch(html, /TRAINING_CATEGORIES/);
});
