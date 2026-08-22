import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoUrl, videoPreviewHtml } from '../js/utils/videoEmbed.js';

const escape = (s) => String(s).replace(/"/g, '&quot;');

test('parseVideoUrl rejects missing and non-http schemes', () => {
  assert.deepEqual(parseVideoUrl(''), { kind: 'none' });
  assert.deepEqual(parseVideoUrl('javascript:alert(1)'), { kind: 'none' });
  assert.deepEqual(parseVideoUrl('not a url'), { kind: 'none' });
});

test('parseVideoUrl maps YouTube watch, short, and embed URLs', () => {
  assert.equal(parseVideoUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ').kind, 'youtube');
  assert.equal(parseVideoUrl('https://youtu.be/aqz-KE-bpKQ').src, 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ');
  assert.equal(parseVideoUrl('https://www.youtube.com/embed/aqz-KE-bpKQ').src, 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ');
  assert.equal(parseVideoUrl('https://www.youtube.com/shorts/aqz-KE-bpKQ').kind, 'youtube');
});

test('parseVideoUrl maps Vimeo and direct files', () => {
  assert.deepEqual(parseVideoUrl('https://vimeo.com/123456789'), {
    kind: 'vimeo',
    src: 'https://player.vimeo.com/video/123456789',
  });
  assert.equal(parseVideoUrl('https://cdn.example.com/clip.mp4').kind, 'file');
  assert.equal(parseVideoUrl('https://cdn.example.com/clip.webm?token=1').kind, 'file');
});

test('parseVideoUrl falls back to an external link', () => {
  assert.deepEqual(parseVideoUrl('https://drive.google.com/file/d/abc'), {
    kind: 'link',
    href: 'https://drive.google.com/file/d/abc',
  });
});

test('videoPreviewHtml renders iframe/video/empty states', () => {
  const yt = videoPreviewHtml('https://youtu.be/aqz-KE-bpKQ', escape);
  assert.match(yt, /iframe/);
  assert.match(yt, /youtube-nocookie.com\/embed\/aqz-KE-bpKQ/);

  const file = videoPreviewHtml('https://cdn.example.com/a.mp4', escape);
  assert.match(file, /<video /);

  const empty = videoPreviewHtml('', escape);
  assert.match(empty, /No video link provided/);
});
