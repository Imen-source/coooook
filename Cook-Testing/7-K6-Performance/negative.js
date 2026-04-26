/**
 * Cook's — Negative / Error-Case Test
 *
 * Purpose : Verify that the API handles invalid inputs and unauthorised
 *           requests correctly (proper 4xx responses, never 5xx).
 *           A well-hardened API should:
 *     - Reject missing required fields with 400
 *     - Reject wrong credentials with 401
 *     - Reject duplicate registration with 409
 *     - Block access to protected endpoints with 401 when unauthenticated
 *     - Return 404 (not 500) for non-existent resources
 *
 * Load    : 1 VU, 1 iteration — zero performance concern.
 * Pass criteria: every check must pass (rate == 1.0).
 *
 * Run:
 *   k6 run negative.js
 *   k6 run --out json=results/negative-result.json negative.js
 */

import { group, check } from 'k6';
import http from 'k6/http';
import {
  API,
  postJSON,
  createSummaryHandler,
  thinkShort,
} from './config.js';

export const options = {
  vus:        1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.01'],  // network errors only; 4xx are not "failures"
    checks:            ['rate==1.0'],  // every assertion must pass
  },
};

function body(res) {
  try { return JSON.parse(res.body); } catch { return null; }
}

export default function () {

  // ════════════════════════════════════════════════════════════════════
  // PART 1 — Auth validation errors
  // ════════════════════════════════════════════════════════════════════

  group('Negative: register — missing username', () => {
    const res = postJSON(`${API}/auth.php?action=register`, {
      email:    'missing_user@test.local',
      password: 'Pass123!',
    });
    check(res, {
      'missing-username → 400': r => r.status === 400,
      'missing-username → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: register — missing email', () => {
    const res = postJSON(`${API}/auth.php?action=register`, {
      username: 'NoEmail',
      password: 'Pass123!',
    });
    check(res, {
      'missing-email → 400':      r => r.status === 400,
      'missing-email → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: register — missing password', () => {
    const res = postJSON(`${API}/auth.php?action=register`, {
      username: 'NoPassword',
      email:    'nopass@test.local',
    });
    check(res, {
      'missing-password → 400':      r => r.status === 400,
      'missing-password → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: register — empty body', () => {
    const res = postJSON(`${API}/auth.php?action=register`, {});
    check(res, {
      'empty-register → 400': r => r.status === 400,
    });
    thinkShort();
  });

  // ── Register a real user so we can test duplicate + wrong-password ─────────
  const email = `neg_${Date.now()}@test.local`;
  postJSON(`${API}/auth.php?action=register`, {
    username: `NegChef_${Date.now()}`,
    email,
    password: 'Correct123!',
  });

  group('Negative: register — duplicate email', () => {
    const res = postJSON(`${API}/auth.php?action=register`, {
      username: 'DuplicateChef',
      email,
      password: 'Correct123!',
    });
    check(res, {
      'duplicate-email → 409': r => r.status === 409,
      'duplicate-email → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: login — wrong password', () => {
    const res = postJSON(`${API}/auth.php?action=login`, {
      email,
      password: 'WrongPassword!',
    });
    check(res, {
      'wrong-password → 401':      r => r.status === 401,
      'wrong-password → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: login — non-existent email', () => {
    const res = postJSON(`${API}/auth.php?action=login`, {
      email:    'nobody_xyz_99999@test.local',
      password: 'Whatever1!',
    });
    check(res, {
      'no-account → 401':       r => r.status === 401,
      'no-account → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: login — missing email', () => {
    const res = postJSON(`${API}/auth.php?action=login`, { password: 'Pass123!' });
    check(res, {
      'login-no-email → 401': r => r.status === 401,
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // PART 2 — Unauthenticated access to protected endpoints
  // (No login cookie in this VU's jar yet — so all 401s are correct)
  // ════════════════════════════════════════════════════════════════════

  group('Negative: fridge list — no auth', () => {
    const res = http.get(`${API}/fridge.php?action=list`);
    check(res, { 'fridge-list-no-auth → 401': r => r.status === 401 });
    thinkShort();
  });

  group('Negative: fridge add — no auth', () => {
    const res = postJSON(`${API}/fridge.php?action=add`, { name: 'Garlic' });
    check(res, { 'fridge-add-no-auth → 401': r => r.status === 401 });
    thinkShort();
  });

  group('Negative: planner list — no auth', () => {
    const res = http.get(`${API}/planner.php?action=list`);
    check(res, { 'planner-list-no-auth → 401': r => r.status === 401 });
    thinkShort();
  });

  group('Negative: planner save — no auth', () => {
    const res = postJSON(`${API}/planner.php?action=save`, { date: '2026-12-01', recipe_id: 1 });
    check(res, { 'planner-save-no-auth → 401': r => r.status === 401 });
    thinkShort();
  });

  group('Negative: recipe create — no auth', () => {
    const res = postJSON(`${API}/recipes.php?action=create`, { title: 'Unauthorised recipe' });
    check(res, { 'recipe-create-no-auth → 401': r => r.status === 401 });
    thinkShort();
  });

  group('Negative: recipe toggle_save — no auth', () => {
    const res = postJSON(`${API}/recipes.php?action=toggle_save`, { recipe_id: 1 });
    check(res, { 'toggle-save-no-auth → 401': r => r.status === 401 });
    thinkShort();
  });

  group('Negative: community post — no auth', () => {
    const res = postJSON(`${API}/community.php?action=post`, { content: 'Unauthorised post' });
    check(res, { 'community-post-no-auth → 401': r => r.status === 401 });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // PART 3 — Invalid resource identifiers
  // ════════════════════════════════════════════════════════════════════

  group('Negative: recipe detail — non-existent id', () => {
    const res = http.get(`${API}/recipes.php?action=detail&id=99999999`);
    check(res, {
      'detail-not-found → 404':       r => r.status === 404,
      'detail-not-found → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: recipe detail — id=0', () => {
    const res = http.get(`${API}/recipes.php?action=detail&id=0`);
    check(res, {
      'detail-id0 → 404': r => r.status === 404,
    });
    thinkShort();
  });

  group('Negative: recipe detail — string id', () => {
    const res = http.get(`${API}/recipes.php?action=detail&id=abc`);
    check(res, {
      'detail-string-id → not 5xx': r => r.status < 500,
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // PART 4 — Validation errors on authenticated endpoints
  // (Login first so the cookie jar is populated)
  // ════════════════════════════════════════════════════════════════════

  group('Setup: login for validation tests', () => {
    postJSON(`${API}/auth.php?action=login`, {
      email,
      password: 'Correct123!',
    });
  });

  group('Negative: fridge add — missing name (auth)', () => {
    const res = postJSON(`${API}/fridge.php?action=add`, { category: 'Vegetables' });
    check(res, {
      'fridge-no-name → 400':      r => r.status === 400,
      'fridge-no-name → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: planner save — missing date (auth)', () => {
    const res = postJSON(`${API}/planner.php?action=save`, { recipe_id: 1 });
    check(res, {
      'planner-no-date → 400':      r => r.status === 400,
      'planner-no-date → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: community post — empty content (auth)', () => {
    const res = postJSON(`${API}/community.php?action=post`, { content: '' });
    check(res, {
      'community-empty-content → 400':      r => r.status === 400,
      'community-empty-content → error key': () => !!body(res)?.error,
    });
    thinkShort();
  });

  group('Negative: community post — missing content (auth)', () => {
    const res = postJSON(`${API}/community.php?action=post`, {});
    check(res, {
      'community-no-content → 400': r => r.status === 400,
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // PART 5 — Invalid action parameters (should not 5xx)
  // ════════════════════════════════════════════════════════════════════

  group('Negative: unknown action on recipes', () => {
    const res = http.get(`${API}/recipes.php?action=nonexistent`);
    check(res, { 'unknown-action → not 5xx': r => r.status < 500 });
    thinkShort();
  });

  group('Negative: unknown action on community', () => {
    const res = http.get(`${API}/community.php?action=nonexistent`);
    check(res, { 'community-unknown-action → not 5xx': r => r.status < 500 });
    thinkShort();
  });
}

export const handleSummary = createSummaryHandler('negative');
