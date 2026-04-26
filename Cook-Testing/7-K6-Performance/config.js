/**
 * Cook's — K6 Shared Configuration
 * Centralises BASE_URL, shared thresholds, and virtual-user helpers.
 *
 * Override BASE_URL at runtime:
 *   k6 run -e BASE_URL=http://localhost/cook smoke.js
 */

import { sleep } from 'k6';
import http from 'k6/http';
import { check } from 'k6';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Default: XAMPP serving the project at /cook.
// Change via -e BASE_URL=<url> when running k6.
export const BASE_URL = __ENV.BASE_URL || 'http://localhost/cook';
export const API      = `${BASE_URL}/api`;

// ── Shared HTTP params ────────────────────────────────────────────────────────
export const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── Common thresholds (import into each script's options) ────────────────────
export const COMMON_THRESHOLDS = {
  // 95 % of all requests must complete within 500 ms
  http_req_duration: ['p(95)<500'],
  // 99 % within 1 s
  'http_req_duration{scenario:default}': ['p(99)<1000'],
  // Error rate must stay below 1 %
  http_req_failed: ['rate<0.01'],
  // All custom checks must pass at > 98 %
  checks: ['rate>0.98'],
};

// ── Shared virtual-user data ──────────────────────────────────────────────────
export function randomEmail() {
  return `k6_${__VU}_${Date.now()}@perf.test`;
}

export function randomUser() {
  return {
    username: `PerfChef${__VU}`,
    email:    randomEmail(),
    password: 'PerfPass123!',
  };
}

// ── Helper: POST JSON ─────────────────────────────────────────────────────────
export function postJSON(url, payload, params = {}) {
  return http.post(url, JSON.stringify(payload), {
    headers: JSON_HEADERS,
    ...params,
  });
}

// ── Helper: register + login, return session cookies ─────────────────────────
export function loginOrRegister(user) {
  // Try login first (user may already exist from a previous iteration)
  let res = postJSON(`${API}/auth.php?action=login`, {
    email:    user.email,
    password: user.password,
  });

  if (res.status === 401) {
    // Not found — register
    postJSON(`${API}/auth.php?action=register`, user);
    res = postJSON(`${API}/auth.php?action=login`, {
      email:    user.email,
      password: user.password,
    });
  }

  check(res, {
    'auth: status 200': r => r.status === 200,
    'auth: has user in body': r => {
      try { return JSON.parse(r.body).user !== undefined; }
      catch { return false; }
    },
  });

  // Return the cookies jar so subsequent requests are authenticated
  return res.cookies;
}

// ── Helper: GET with simple ok-check ─────────────────────────────────────────
export function getAndCheck(url, label, params = {}) {
  const res = http.get(url, params);
  check(res, {
    [`${label}: status 200`]: r => r.status === 200,
    [`${label}: body not empty`]: r => r.body && r.body.length > 2,
  });
  return res;
}

// ── Think-time helpers ────────────────────────────────────────────────────────
export function thinkShort()  { sleep(Math.random() * 1 + 0.5);  } // 0.5–1.5 s
export function thinkMedium() { sleep(Math.random() * 2 + 1);    } // 1–3 s
export function thinkLong()   { sleep(Math.random() * 3 + 2);    } // 2–5 s

// ── Sample recipe payload (for create-recipe tests) ──────────────────────────
export function randomRecipe() {
  const titles = ['Tagine Marocain', 'Kabsa Saudienne', 'Shakshuka', 'Couscous Berbère', 'Hummus Libanais'];
  return {
    title:       `${titles[Math.floor(Math.random() * titles.length)]} ${__VU}_${Date.now()}`,
    story:       'A traditional dish passed down through generations.',
    country:     'Morocco',
    level:       'Beginner',
    prep_time:   '30m',
    category:    'arabic',
    image_url:   '',
    servings:    4,
    ingredients: [
      { name: 'Chicken', amount: '500g' },
      { name: 'Tomatoes', amount: '3' },
      { name: 'Spices', amount: '1 tsp' },
    ],
    steps: [
      { instruction: 'Prepare all ingredients.', timer_seconds: 0 },
      { instruction: 'Cook on medium heat for 30 minutes.', timer_seconds: 1800 },
    ],
  };
}

// ── Shared handleSummary factory ──────────────────────────────────────────────
// Usage: export const handleSummary = createSummaryHandler('smoke');
export function createSummaryHandler(testName) {
  return function (data) {
    const p95      = data.metrics.http_req_duration?.values?.['p(95)']  || 0;
    const p99      = data.metrics.http_req_duration?.values?.['p(99)']  || 0;
    const errRate  = (data.metrics.http_req_failed?.values?.rate        || 0) * 100;
    const checksPct = (data.metrics.checks?.values?.rate               || 0) * 100;
    const totalReqs = data.metrics.http_reqs?.values?.count             || 0;
    const passed   = errRate < (testName === 'stress' ? 10 : 1) && checksPct > (testName === 'spike' ? 80 : 98);

    console.log('\n════════════════════════════════════════');
    console.log(`  ${testName.toUpperCase()} TEST SUMMARY`);
    console.log('════════════════════════════════════════');
    console.log(`  Total Requests : ${totalReqs}`);
    console.log(`  p(95) Latency  : ${p95.toFixed(0)} ms`);
    console.log(`  p(99) Latency  : ${p99.toFixed(0)} ms`);
    console.log(`  Error Rate     : ${errRate.toFixed(2)} %`);
    console.log(`  Check Pass     : ${checksPct.toFixed(2)} %`);
    console.log(`  Result         : ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log('════════════════════════════════════════\n');

    return {
      [`results/${testName}-summary.json`]: JSON.stringify(data, null, 2),
    };
  };
}

// ── Authenticated-session helper ──────────────────────────────────────────────
// Registers (idempotent) and logs in a user; returns true on success.
// After this call the VU's cookie jar holds the PHPSESSID for this domain.
export function ensureLoggedIn(user) {
  postJSON(`${API}/auth.php?action=register`, user); // may return 409 — that is fine
  const res = postJSON(`${API}/auth.php?action=login`, {
    email:    user.email,
    password: user.password,
  });
  return res.status === 200;
}
