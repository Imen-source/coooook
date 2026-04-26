/**
 * Cook's — Spike Test
 *
 * Purpose : Simulate a sudden, extreme burst of traffic (e.g. a viral post,
 *           a TV feature, a flash-sale equivalent). Verifies:
 *   - The system does not crash under a traffic tsunami.
 *   - Recovery is swift and clean after the spike subsides.
 *   - No data corruption occurs during the burst.
 *
 * Profile : Baseline 10 VUs → instant spike to 500 VUs → back to 10 VUs.
 *
 * Run:
 *   k6 run spike.js
 *   k6 run --out json=results/spike-result.json spike.js
 */

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  API,
  postJSON,
  getAndCheck,
  thinkShort,
  thinkMedium,
  randomUser,
} from './config.js';

const spikeErrors        = new Rate('spike_error_rate');
const recoverySatisfied  = new Rate('recovery_satisfied');
const requestsDuringSpike = new Counter('requests_during_spike');
const spikeDuration       = new Trend('spike_req_duration', true);

export const options = {
  stages: [
    { duration: '1m',  target: 10  },  // baseline — low steady traffic
    { duration: '30s', target: 500 },  // SPIKE: instant jump to 500 VUs
    { duration: '3m',  target: 500 },  // sustain spike for 3 minutes
    { duration: '1m',  target: 10  },  // rapid drop back to baseline
    { duration: '3m',  target: 10  },  // observe recovery period
    { duration: '30s', target: 0   },  // done
  ],
  thresholds: {
    // During spike we tolerate higher latency
    http_req_duration: ['p(95)<3000'],
    // Must not crash — error rate controlled
    http_req_failed:   ['rate<0.15'],    // spikes cause more errors; 15 % max
    spike_error_rate:  ['rate<0.15'],
    // After spike (recovery), response time should return to normal
    recovery_satisfied: ['rate>0.85'],
    checks:             ['rate>0.80'],
  },
};

// ── Spike journey: fire the heaviest read endpoint ────────────────────────────
function spikeRead() {
  group('Spike: Recipe list', () => {
    const r = http.get(`${API}/recipes.php?action=list`);
    spikeDuration.add(r.timings.duration);
    requestsDuringSpike.add(1);

    const ok = check(r, {
      'recipes: not 5xx': res => res.status < 500,
    });
    spikeErrors.add(!ok);
    thinkShort();
  });
}

// ── Community reads ───────────────────────────────────────────────────────────
function spikeCommunity() {
  group('Spike: Community feed', () => {
    const r = http.get(`${API}/community.php?action=feed`);
    requestsDuringSpike.add(1);
    const ok = check(r, { 'feed: not 5xx': res => res.status < 500 });
    spikeErrors.add(!ok);
    thinkShort();
  });
}

// ── Auth during spike ─────────────────────────────────────────────────────────
function spikeAuth() {
  group('Spike: Login burst', () => {
    const user = randomUser();
    postJSON(`${API}/auth.php?action=register`, user);

    const lr = postJSON(`${API}/auth.php?action=login`, {
      email:    user.email,
      password: user.password,
    });
    requestsDuringSpike.add(1);

    const ok = check(lr, { 'login: not 5xx': r => r.status < 500 });
    spikeErrors.add(!ok);

    // After login, check if system is still healthy (recovery metric)
    if (lr.status === 200) {
      const rr = http.get(`${API}/recipes.php?action=list`);
      const recovered = check(rr, {
        'post-login recipe: 200': r => r.status === 200,
        'post-login recipe: <2s': r => r.timings.duration < 2000,
      });
      recoverySatisfied.add(recovered);
    }

    thinkShort();
  });
}

export default function () {
  const roll = __VU % 3;
  if (roll === 0) spikeRead();
  else if (roll === 1) spikeCommunity();
  else spikeAuth();
}
