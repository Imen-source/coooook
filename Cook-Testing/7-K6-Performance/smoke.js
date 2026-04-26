/**
 * Cook's — Smoke Test
 *
 * Purpose : Sanity-check that every critical endpoint is alive and returns
 *           a valid response. Run this before any other test type.
 * Load    : 1 virtual user, 1 full pass through all endpoints.
 * Pass criteria: 0 errors, all checks green.
 *
 * Run:
 *   k6 run smoke.js
 *   k6 run -e BASE_URL=http://localhost/cook smoke.js
 */

import { group, check } from 'k6';
import http from 'k6/http';
import {
  API,
  JSON_HEADERS,
  COMMON_THRESHOLDS,
  postJSON,
  getAndCheck,
  thinkShort,
} from './config.js';

export const options = {
  vus:        1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<800'],   // relaxed for smoke
    http_req_failed:   ['rate<0.01'],
    checks:            ['rate==1.0'],   // ALL checks must pass in smoke
  },
};

export default function () {

  // ── 1. Public: Recipes list ───────────────────────────────────────────────
  group('Public: Recipes', () => {
    getAndCheck(`${API}/recipes.php?action=list`, 'recipes-list');
    thinkShort();

    const detail = http.get(`${API}/recipes.php?action=list&category=arabic`);
    check(detail, { 'recipes by category: 200': r => r.status === 200 });
    thinkShort();
  });

  // ── 2. Public: Community feed ─────────────────────────────────────────────
  group('Public: Community', () => {
    getAndCheck(`${API}/community.php?action=feed`, 'community-feed');
    thinkShort();
    getAndCheck(`${API}/community.php?action=challenges`, 'community-challenges');
    thinkShort();
  });

  // ── 3. Auth: Register + Login + Status ───────────────────────────────────
  group('Auth: Register, Login, Status', () => {
    const user = {
      username: `SmokeChef_${Date.now()}`,
      email:    `smoke_${Date.now()}@test.local`,
      password: 'Smoke123!',
    };

    // Register
    const regRes = postJSON(`${API}/auth.php?action=register`, user);
    check(regRes, {
      'register: 200 or 409': r => r.status === 200 || r.status === 409,
    });
    thinkShort();

    // Login
    const loginRes = postJSON(`${API}/auth.php?action=login`, {
      email:    user.email,
      password: user.password,
    });
    check(loginRes, {
      'login: 200':     r => r.status === 200,
      'login: has user': r => {
        try { return !!JSON.parse(r.body).user; } catch { return false; }
      },
    });
    thinkShort();

    // Auth status (session-cookie request)
    const jar    = http.cookieJar();
    const cookies = loginRes.cookies;
    if (cookies) {
      Object.entries(cookies).forEach(([name, vals]) => {
        jar.set(`${API}/auth.php`, name, vals[0].value);
      });
    }
    const statusRes = http.get(`${API}/auth.php?action=status`);
    check(statusRes, { 'auth-status: 200': r => r.status === 200 });
    thinkShort();

    // Logout
    const logoutRes = http.get(`${API}/auth.php?action=logout`);
    check(logoutRes, { 'logout: 200': r => r.status === 200 });
  });

  // ── 4. Recipe detail ──────────────────────────────────────────────────────
  group('Recipe Detail', () => {
    // Use ID 1; adapt if your seed uses different IDs
    const res = http.get(`${API}/recipes.php?action=detail&id=1`);
    check(res, {
      'detail: 200 or 404': r => r.status === 200 || r.status === 404,
    });
    thinkShort();
  });
}
