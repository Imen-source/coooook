/**
 * Cook's — Load Test
 *
 * Purpose : Simulate normal production traffic. Validate that the system
 *           meets response-time SLAs under expected daily load.
 * Profile : Ramp up to 50 VUs over 2 min, sustain for 5 min, ramp down.
 * Pass criteria:
 *   - p(95) < 500 ms
 *   - p(99) < 1 s
 *   - Error rate < 1 %
 *
 * Run:
 *   k6 run load.js
 *   k6 run --out json=results/load-result.json load.js
 */

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Rate, Counter } from 'k6/metrics';
import {
  API,
  COMMON_THRESHOLDS,
  postJSON,
  getAndCheck,
  thinkMedium,
  thinkShort,
  randomUser,
} from './config.js';

// ── Custom metrics ────────────────────────────────────────────────────────────
const recipeListDuration   = new Trend('recipe_list_duration',   true);
const loginDuration        = new Trend('login_duration',         true);
const communityFeedDuration = new Trend('community_feed_duration', true);
const authErrors           = new Rate('auth_errors');
const totalRequests        = new Counter('total_requests');

// ── Scenario configuration ────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '2m',  target: 20 },   // ramp-up to 20 VUs
    { duration: '1m',  target: 50 },   // continue ramp-up to 50 VUs
    { duration: '5m',  target: 50 },   // steady state at 50 VUs
    { duration: '2m',  target: 0  },   // ramp-down
  ],
  thresholds: {
    ...COMMON_THRESHOLDS,
    recipe_list_duration:    ['p(95)<400'],
    login_duration:          ['p(95)<600'],
    community_feed_duration: ['p(95)<450'],
    auth_errors:             ['rate<0.01'],
  },
};

// ── User journey: anonymous browser ──────────────────────────────────────────
function anonymousBrowse() {
  group('Browse recipes (anon)', () => {
    const r1 = getAndCheck(`${API}/recipes.php?action=list`, 'recipes-list');
    recipeListDuration.add(r1.timings.duration);
    totalRequests.add(1);
    thinkShort();

    const categories = ['arabic', 'maghreb', 'levant', 'world'];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const r2 = http.get(`${API}/recipes.php?action=list&category=${cat}`);
    check(r2, { 'category filter: 200': res => res.status === 200 });
    totalRequests.add(1);
    thinkShort();

    // Detail view
    const r3 = http.get(`${API}/recipes.php?action=detail&id=${Math.ceil(Math.random() * 10)}`);
    check(r3, { 'recipe detail: 2xx or 404': res => res.status < 500 });
    totalRequests.add(1);
    thinkMedium();
  });
}

// ── User journey: community reader ───────────────────────────────────────────
function communityRead() {
  group('Community feed', () => {
    const r1 = http.get(`${API}/community.php?action=feed`);
    communityFeedDuration.add(r1.timings.duration);
    check(r1, { 'feed: 200': res => res.status === 200 });
    totalRequests.add(1);
    thinkShort();

    const r2 = http.get(`${API}/community.php?action=challenges`);
    check(r2, { 'challenges: 200': res => res.status === 200 });
    totalRequests.add(1);
    thinkMedium();
  });
}

// ── User journey: authenticated user ─────────────────────────────────────────
function authenticatedUser() {
  const user = randomUser();

  // Register (idempotent — may return 409 if VU already exists)
  postJSON(`${API}/auth.php?action=register`, user);

  group('Authenticated session', () => {
    const start   = Date.now();
    const loginRes = postJSON(`${API}/auth.php?action=login`, {
      email:    user.email,
      password: user.password,
    });
    loginDuration.add(Date.now() - start);
    totalRequests.add(1);

    const ok = check(loginRes, {
      'login: 200':          r => r.status === 200,
      'login: user present': r => {
        try { return !!JSON.parse(r.body).user; } catch { return false; }
      },
    });
    authErrors.add(!ok);

    if (loginRes.status !== 200) { sleep(1); return; }

    thinkShort();

    // Authenticated recipe list
    const r = http.get(`${API}/recipes.php?action=list`);
    check(r, { 'auth-recipe-list: 200': res => res.status === 200 });
    totalRequests.add(1);
    thinkMedium();

    // Search
    const terms = ['kabsa', 'tagine', 'hummus', 'tabbouleh'];
    const term  = terms[Math.floor(Math.random() * terms.length)];
    const sr    = http.get(`${API}/recipes.php?action=list&search=${term}`);
    check(sr, { 'search: 200': res => res.status === 200 });
    totalRequests.add(1);
    thinkShort();
  });
}

// ── Default function: distribute users across journeys ───────────────────────
export default function () {
  const roll = __VU % 3;
  if (roll === 0) anonymousBrowse();
  else if (roll === 1) communityRead();
  else authenticatedUser();
}
