import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAppearance, resolveAppearance, statusBarStyle } from '../src/lib/appearance.js';

test('existing preferences without appearance follow the device', () => {
  assert.equal(normalizeAppearance(undefined), 'system');
  assert.equal(normalizeAppearance('invalid'), 'system');
  assert.equal(resolveAppearance(undefined, true), 'dark');
  assert.equal(resolveAppearance(undefined, false), 'light');
});

test('explicit appearance overrides the device while system follows changes', () => {
  assert.equal(resolveAppearance('light', true), 'light');
  assert.equal(resolveAppearance('dark', false), 'dark');
  assert.equal(resolveAppearance('system', true), 'dark');
  assert.equal(resolveAppearance('system', false), 'light');
});

test('status bar uses dark text on light screens and light text on dark screens or launch', () => {
  assert.equal(statusBarStyle('light'), 'LIGHT');
  assert.equal(statusBarStyle('dark'), 'DARK');
  assert.equal(statusBarStyle('light', true), 'DARK');
  assert.equal(statusBarStyle('dark', true), 'DARK');
});
