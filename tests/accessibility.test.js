import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const css = (file) => readFileSync(new URL(file, root), 'utf8');
const styles = css('public/styles.css');
const hub = css('public/hub.css');

function linear(channel) {
  const n = channel / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map(value => parseInt(value, 16));
  assert.equal(channels?.length, 3, `Expected a six-digit colour: ${hex}`);
  return 0.2126 * linear(channels[0]) + 0.7152 * linear(channels[1]) + 0.0722 * linear(channels[2]);
}
function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test('design tokens pass WCAG AA 4.5:1 for ordinary text on approved light/dark surfaces', () => {
  for (const background of ['#f9f8f2', '#e8e4d8', '#f1eee5', '#f6f2e9']) {
    for (const ink of ['#70532f', '#4c604f']) {
      assert.ok(contrast(background, ink) >= 4.5, `${ink} fails on ${background}`);
    }
  }
  assert.ok(contrast('#153f2f', '#e6c88b') >= 4.5, 'warm gold fails on forest');
  for (const [token, value] of [['--gold-ink', '#70532f'], ['--copy-ink', '#4c604f'], ['--gold-on-forest', '#e6c88b']]) {
    assert.ok(styles.includes(`${token}:${value}`), `${token} was removed or altered without reassessment`);
  }
});

test('light surface labels and background-specific gold remain separate', () => {
  assert.match(hub, /\.home-hub-feature \.home-hub-label\{color:var\(--gold-on-forest\)\}/);
  assert.match(hub, /\.home-hub-feature p\{color:#d9e6dc\}/);
  assert.match(hub, /\.hub-trust-panel \.hub-kicker\{color:var\(--gold-on-forest\)\}/);
  assert.match(hub, /\.hub-mast \.hub-kicker\{color:var\(--gold-on-forest\)\}/);
  assert.match(hub, /\.directory-card p,[\s\S]*?color:var\(--copy-ink\)/);
  assert.match(styles, /\.eyebrow\.dark,[^\n]*\{color:var\(--gold-ink\)\}/);
  assert.match(styles, /:focus-visible\{outline:3px solid #84601f/);
  assert.match(styles, /@media\(max-width:390px\)\{\.nav-shell\{gap:7px/);
  assert.match(styles, /\.icon-button,\.mobile-menu-toggle\{min-width:44px;min-height:44px\}/);
});
