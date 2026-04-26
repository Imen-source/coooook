/**
 * Cook's — Soak Test  (also known as Endurance Test)
 *
 * Purpose : Detect memory leaks, connection-pool exhaustion, slow storage
 *           build-up, and any reliability issues that only appear under
 *           sustained load over hours.
 * Profile : 50 VUs for 2 hours (configurable via env vars).
 * What to watch:
 *   - Does response time creep upward over time?
 *   - Does memory / CPU on the server grow continuously?
 *   - Does the DB connection pool saturate?
 *   - Are there any OOM crashes mid-run?
 *
 * Run (full soak):
 *   k6 run soak.js
 *
 * Quick validation (10 min):
 *   k6 run -e SOAK_DURATION=10m -e SOAK_VUS=20 soak.js
 *
 * Save results:
 *   k6 run --out json=results/soak-result.json soak.js
 */

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Rate, Counter } from 'k6/metrics';
import {
  API,
  postJSON,
  getAndCheck,
  thinkMedium,
  thinkLong,
  thinkShort,
  randomUser,
} from './config.js';

// ── Configurable via env ──────────────────────────────────────────────────────
const SOAK_VUS      = parseInt(__ENV.SOAK_VUS      || '50',  10);
const SOAK_DURATION = __ENV.SOAK_DURATION || '2h';

// ── Custom metrics ────────────────────────────────────────────────────────────
// Track trends over time — export to JSON/InfluxDB to visualise drift
const recipeP95     = new Trend('recipe_p95_over_time',   true);
const feedP95       = new Trend('feed_p95_over_time',     true);
const loginP95      = new Trend('login_p95_over_time',    true);
const soakErrors    = new Rate('soak_error_rate');
const requestsTotal = new Counter('soak_total_requests');

export const options = {
  stages: [
    { duration: '5m',           target: SOAK_VUS },  // gentle ramp-up
    { duration: SOAK_DURATION,  target: SOAK_VUS },  // sustained soak
    { duration: '5m',           target: 0        },  // ramp-down
  ],
  thresholds: {
    // Healthy thresholds — the key insight is if these DRIFT during the run
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed:   ['rate<0.01'],
    soak_error_rate:   ['rate<0.01'],
    checks:            ['rate>0.98'],
    // Soak-specific: watch these trend lines in Grafana / k6 Cloud
    recipe_p95_over_time: ['p(95)<500'],
    feed_p95_over_time:   ['p(95)<450'],
    login_p95_over_time:  ['p(95)<600'],
  },
};

// ── Journey A: Periodic recipe browsing ──────────────────────────────────────
function browseRecipes() {
  group('Soak: Recipe list', () => {
    const r = http.get(`${API}/recipes.php?action=list`);
    recipeP95.add(r.timings.duration);
    requestsTotal.add(1);
    const ok = check(r, {
      'recipe-list: 200':   res => res.status === 200,
      'recipe-list: <500ms': res => res.timings.duration < 500,
    });
    soakErrors.add(!ok);
    thinkShort();
  });

  group('Soak: Recipe search', () => {
    const queries = ['kabsa', 'tagine', 'couscous', 'shakshuka', 'hummus'];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const r = http.get(`${API}/recipes.php?action=list&search=${q}`);
    requestsTotal.add(1);
    check(r, { 'search: 200': res => res.status === 200 });
    thinkMedium();
  });
}

// ── Journey B: Community feed polling ────────────────────────────────────────
function pollCommunity() {
  group('Soak: Community feed', () => {
    const r = http.get(`${API}/community.php?action=feed`);
    feedP95.add(r.timings.duration);
    requestsTotal.add(1);
    const ok = check(r, {
      'feed: 200':   res => res.status === 200,
      'feed: <450ms': res => res.timings.duration < 450,
    });
    soakErrors.add(!ok);
    thinkMedium();

    const cr = http.get(`${API}/community.php?action=challenges`);
    requestsTotal.add(1);
    check(cr, { 'challenges: 200': res => res.status === 200 });
    thinkLong();
  });
}

// ── Journey C: Auth session lifecycle ────────────────────────────────────────
function authLifecycle() {
  const user = randomUser();

  group('Soak: Register', () => {
    const r = postJSON(`${API}/auth.php?action=register`, user);
    requestsTotal.add(1);
    check(r, { 'register: 200 or 409': res => res.status === 200 || res.status === 409 });
  });

  thinkShort();

  group('Soak: Login', () => {
    const t0 = Date.now();
    const r = postJSON(`${API}/auth.php?action=login`, {
      email:    user.email,
      password: user.password,
    });
    loginP95.add(Date.now() - t0);
    requestsTotal.add(1);
    const ok = check(r, {
      'login: 200': res => res.status === 200,
    });
    soakErrors.add(!ok);
    thinkMedium();
  });

  thinkLong();
}

// ── Default: mix all journeys ─────────────────────────────────────────────────
export default function () {
  // Distribute load across journeys: 50 % browse, 30 % community, 20 % auth
  const roll = Math.random();
  if (roll < 0.50)      browseRecipes();
  else if (roll < 0.80) pollCommunity();
  else                  authLifecycle();
}
