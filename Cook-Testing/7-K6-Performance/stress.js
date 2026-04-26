/**
 * Cook's — Stress Test
 *
 * Purpose : Push the system beyond normal capacity to find the breaking point
 *           and observe failure behaviour (graceful degradation vs. hard crash).
 * Profile : Aggressive ramp-up to 200 VUs, sustain, then ramp further.
 * What to watch:
 *   - At what VU count does p(95) breach 500 ms?
 *   - Does the error rate spike above 5 %?
 *   - Does the system recover after load drops?
 *
 * Run:
 *   k6 run stress.js
 *   k6 run --out json=results/stress-result.json stress.js
 */

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Rate } from 'k6/metrics';
import {
  API,
  postJSON,
  getAndCheck,
  thinkShort,
  thinkMedium,
  randomUser,
  createSummaryHandler,
} from './config.js';

const errorRate    = new Rate('error_rate');
const recipeLatency = new Trend('recipe_latency', true);

export const options = {
  stages: [
    { duration: '2m',  target: 50  },  // warm-up
    { duration: '3m',  target: 100 },  // stress begins
    { duration: '3m',  target: 150 },  // heavy stress
    { duration: '2m',  target: 200 },  // peak stress
    { duration: '5m',  target: 200 },  // sustain peak
    { duration: '3m',  target: 0   },  // recovery — does it bounce back?
  ],
  thresholds: {
    // These are deliberately lenient for stress — we expect degradation.
    // Thresholds here document when the system BREAKS, not when it's healthy.
    http_req_duration: ['p(95)<2000'],  // system may struggle; allow up to 2 s
    http_req_failed:   ['rate<0.10'],   // allow up to 10 % errors under stress
    error_rate:        ['rate<0.10'],
    checks:            ['rate>0.85'],
  },
};

export default function () {
  const roll = __VU % 4;

  // ── Journey A: Recipe browsing (40 % of users) ───────────────────────────
  if (roll === 0 || roll === 1) {
    group('Stress: Recipe browsing', () => {
      const r = http.get(`${API}/recipes.php?action=list`);
      recipeLatency.add(r.timings.duration);
      const ok = check(r, {
        'recipes: 200':        res => res.status === 200,
        'recipes: latency ok': res => res.timings.duration < 2000,
      });
      errorRate.add(!ok);
      thinkShort();

      const dr = http.get(`${API}/recipes.php?action=detail&id=${(__VU % 6) + 1}`);
      check(dr, { 'detail: 2xx or 404': res => res.status < 500 });
      thinkShort();
    });
  }

  // ── Journey B: Community (30 % of users) ────────────────────────────────
  else if (roll === 2) {
    group('Stress: Community', () => {
      const fr = http.get(`${API}/community.php?action=feed`);
      const ok = check(fr, {
        'feed: 200':        res => res.status === 200,
        'feed: latency ok': res => res.timings.duration < 2000,
      });
      errorRate.add(!ok);
      thinkShort();

      const cr = http.get(`${API}/community.php?action=challenges`);
      check(cr, { 'challenges: 200': res => res.status === 200 });
      thinkShort();
    });
  }

  // ── Journey C: Auth + Browse (30 % of users) ────────────────────────────
  else {
    group('Stress: Auth + Browse', () => {
      const user = randomUser();
      postJSON(`${API}/auth.php?action=register`, user);

      const lr = postJSON(`${API}/auth.php?action=login`, {
        email:    user.email,
        password: user.password,
      });
      const ok = check(lr, { 'login: 200': r => r.status === 200 });
      errorRate.add(!ok);
      thinkShort();

      if (lr.status === 200) {
        const rr = http.get(`${API}/recipes.php?action=list`);
        check(rr, { 'authed-recipes: 200': r => r.status === 200 });
      }
      thinkMedium();
    });
  }
}

export const handleSummary = createSummaryHandler('stress');
