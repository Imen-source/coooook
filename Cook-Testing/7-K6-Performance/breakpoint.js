/**
 * Cook's — Breakpoint Test
 *
 * Purpose : Gradually and continuously increase load until the system fails.
 *           Records the EXACT VU count and request rate at which:
 *   - p(95) breaches 500 ms
 *   - Error rate exceeds 5 %
 *   - First 5xx response is observed
 *
 * Profile : Slow, linear ramp from 0 → 500 VUs over 60 minutes.
 *           Monitor in real-time; abort manually when failure is confirmed.
 *
 * Run:
 *   k6 run breakpoint.js
 *   k6 run --out json=results/breakpoint-result.json breakpoint.js
 *
 * Tip: Watch k6 summary output. The VU count at first threshold breach is
 *      your "breakpoint" — document it in 5-Performance-Testing/performance-results.md
 */

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  API,
  postJSON,
  getAndCheck,
  thinkShort,
  randomUser,
} from './config.js';

const errorRate       = new Rate('breakpoint_errors');
const successRate     = new Rate('breakpoint_success');
const vuAtFirstFail   = new Counter('first_failure_vu_marker');
let   firstFailLogged = false;

export const options = {
  stages: [
    { duration: '10m', target: 100  },
    { duration: '10m', target: 200  },
    { duration: '10m', target: 300  },
    { duration: '10m', target: 400  },
    { duration: '10m', target: 500  },
    { duration: '10m', target: 600  },  // beyond what most PHP/XAMPP setups handle
  ],
  // Thresholds are intentionally loose — we WANT to see these breach
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // just to ensure k6 doesn't halt early
    http_req_failed:   ['rate<0.50'],   // 50 % threshold — stop before total meltdown
  },
};

export default function () {
  const roll = __VU % 3;

  if (roll === 0) {
    group('Breakpoint: Recipe list', () => {
      const r = http.get(`${API}/recipes.php?action=list`);
      const ok = check(r, {
        'recipes: 200':   res => res.status === 200,
        'recipes: <500ms': res => res.timings.duration < 500,
      });

      if (!ok && !firstFailLogged) {
        firstFailLogged = true;
        vuAtFirstFail.add(__VU);
        console.warn(`⚠️  BREAKPOINT HIT at VU ${__VU}: recipe-list check failed`);
      }

      errorRate.add(!ok);
      successRate.add(ok);
      thinkShort();
    });
  }

  else if (roll === 1) {
    group('Breakpoint: Community feed', () => {
      const r = http.get(`${API}/community.php?action=feed`);
      const ok = check(r, {
        'feed: 200':   res => res.status === 200,
        'feed: <500ms': res => res.timings.duration < 500,
      });

      if (!ok && !firstFailLogged) {
        firstFailLogged = true;
        vuAtFirstFail.add(__VU);
        console.warn(`⚠️  BREAKPOINT HIT at VU ${__VU}: community-feed check failed`);
      }

      errorRate.add(!ok);
      successRate.add(ok);
      thinkShort();
    });
  }

  else {
    group('Breakpoint: Auth flow', () => {
      const user = randomUser();
      postJSON(`${API}/auth.php?action=register`, user);

      const lr = postJSON(`${API}/auth.php?action=login`, {
        email:    user.email,
        password: user.password,
      });
      const ok = check(lr, {
        'login: 200':   r => r.status === 200,
        'login: <600ms': r => r.timings.duration < 600,
      });

      if (!ok && !firstFailLogged) {
        firstFailLogged = true;
        vuAtFirstFail.add(__VU);
        console.warn(`⚠️  BREAKPOINT HIT at VU ${__VU}: auth-flow check failed`);
      }

      errorRate.add(!ok);
      successRate.add(ok);
      thinkShort();
    });
  }
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errRate = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const totalReqs = data.metrics.http_reqs?.values?.count || 0;

  console.log('\n════════════════════════════════════════');
  console.log('  BREAKPOINT TEST SUMMARY');
  console.log('════════════════════════════════════════');
  console.log(`  Total Requests : ${totalReqs}`);
  console.log(`  p(95) Latency  : ${p95.toFixed(0)} ms`);
  console.log(`  Error Rate     : ${errRate.toFixed(2)} %`);
  console.log('  → Document the VU count at first failure in');
  console.log('    5-Performance-Testing/performance-results.md');
  console.log('════════════════════════════════════════\n');

  return {
    'results/breakpoint-summary.json': JSON.stringify(data, null, 2),
  };
}
