/**
 * Cook's — Scenario-Based Test
 *
 * Purpose : Run multiple named scenarios in parallel, each with a different
 *           executor and user behaviour.  This gives realistic mixed traffic
 *           (anon browsers, authenticated users, community readers, planner
 *           users) hitting the API simultaneously.
 *
 * Executors used:
 *   constant-vus         — steady anon browse load
 *   ramping-vus          — auth-user load that ramps up and down
 *   constant-arrival-rate— fixed request-rate community polling
 *   per-vu-iterations    — each VU runs one complete fridge+planner journey
 *
 * Per-scenario thresholds let you pinpoint which user type causes latency.
 *
 * Run:
 *   k6 run scenarios.js
 *   k6 run --out json=results/scenarios-result.json scenarios.js
 */

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Rate, Counter } from 'k6/metrics';
import {
  API,
  postJSON,
  getAndCheck,
  thinkShort,
  thinkMedium,
  thinkLong,
  randomUser,
  randomRecipe,
  ensureLoggedIn,
} from './config.js';

// ── Custom metrics ─────────────────────────────────────────────────────────────
const anonLatency      = new Trend('anon_req_duration',      true);
const authLatency      = new Trend('auth_req_duration',      true);
const communityLatency = new Trend('community_req_duration', true);
const plannerLatency   = new Trend('planner_req_duration',   true);
const scenarioErrors   = new Rate('scenario_error_rate');
const totalRequests    = new Counter('scenarios_total_requests');

// ── Scenario configuration ─────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // ── Scenario A: Anonymous recipe browsing ─────────────────────────────────
    anon_browse: {
      executor:    'constant-vus',
      vus:         10,
      duration:    '3m',
      exec:        'anonBrowse',
      tags:        { scenario: 'anon' },
      startTime:   '0s',
    },

    // ── Scenario B: Authenticated users (ramp up → sustain → ramp down) ──────
    auth_users: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '1m', target: 15 },
        { duration: '2m', target: 15 },
        { duration: '1m', target: 0  },
      ],
      exec:      'authUser',
      tags:      { scenario: 'auth' },
      startTime: '0s',
    },

    // ── Scenario C: Community feed polling at constant arrival rate ───────────
    community_poll: {
      executor:         'constant-arrival-rate',
      rate:             5,
      timeUnit:         '1s',    // 5 requests per second
      duration:         '3m',
      preAllocatedVUs:  10,
      maxVUs:           20,
      exec:             'communityPoll',
      tags:             { scenario: 'community' },
      startTime:        '0s',
    },

    // ── Scenario D: Fridge & Planner full CRUD (per-VU iterations) ───────────
    planner_journey: {
      executor:    'per-vu-iterations',
      vus:         5,
      iterations:  2,
      maxDuration: '4m',
      exec:        'plannerJourney',
      tags:        { scenario: 'planner' },
      startTime:   '30s',  // start after anon/auth are warmed up
    },
  },

  thresholds: {
    // Global
    http_req_duration: ['p(95)<800'],
    http_req_failed:   ['rate<0.05'],
    checks:            ['rate>0.95'],
    scenario_error_rate: ['rate<0.05'],

    // Per-scenario thresholds (tag-based)
    'http_req_duration{scenario:anon}':      ['p(95)<500'],
    'http_req_duration{scenario:auth}':      ['p(95)<700'],
    'http_req_duration{scenario:community}': ['p(95)<450'],
    'http_req_duration{scenario:planner}':   ['p(95)<600'],

    // Custom metric thresholds
    anon_req_duration:      ['p(95)<500'],
    auth_req_duration:      ['p(95)<700'],
    community_req_duration: ['p(95)<450'],
    planner_req_duration:   ['p(95)<600'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO A — Anonymous browse
// ═══════════════════════════════════════════════════════════════════════════════
export function anonBrowse() {
  group('Anon: recipe list', () => {
    const r = http.get(`${API}/recipes.php?action=list`);
    anonLatency.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, {
      'anon-list → 200':      res => res.status === 200,
      'anon-list → has body': res => res.body && res.body.length > 2,
    });
    scenarioErrors.add(!ok);
    thinkShort();
  });

  group('Anon: recipe detail', () => {
    const id = ((__VU - 1) % 5) + 1;
    const r  = http.get(`${API}/recipes.php?action=detail&id=${id}`);
    anonLatency.add(r.timings.duration);
    totalRequests.add(1);
    check(r, { 'anon-detail → not 5xx': res => res.status < 500 });
    thinkMedium();
  });

  group('Anon: search', () => {
    const terms = ['kabsa', 'tagine', 'hummus', 'couscous'];
    const q     = terms[__VU % terms.length];
    const r     = http.get(`${API}/recipes.php?action=list&search=${q}`);
    anonLatency.add(r.timings.duration);
    totalRequests.add(1);
    check(r, { 'anon-search → 200': res => res.status === 200 });
    thinkShort();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO B — Authenticated user
// ═══════════════════════════════════════════════════════════════════════════════
export function authUser() {
  const user = randomUser();
  ensureLoggedIn(user);

  group('Auth: recipe list', () => {
    const r = http.get(`${API}/recipes.php?action=list`);
    authLatency.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { 'auth-list → 200': res => res.status === 200 });
    scenarioErrors.add(!ok);
    thinkShort();
  });

  group('Auth: create recipe', () => {
    const r = postJSON(`${API}/recipes.php?action=create`, randomRecipe());
    authLatency.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { 'auth-create → 200': res => res.status === 200 });
    scenarioErrors.add(!ok);
    thinkMedium();
  });

  group('Auth: status check', () => {
    const r = http.get(`${API}/auth.php?action=status`);
    authLatency.add(r.timings.duration);
    totalRequests.add(1);
    check(r, { 'auth-status → 200': res => res.status === 200 });
    thinkShort();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO C — Community polling (arrival-rate, no auth needed)
// ═══════════════════════════════════════════════════════════════════════════════
export function communityPoll() {
  group('Community: feed', () => {
    const r = http.get(`${API}/community.php?action=feed`);
    communityLatency.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { 'community-feed → 200': res => res.status === 200 });
    scenarioErrors.add(!ok);
  });

  if (__ITER % 2 === 0) {
    group('Community: challenges', () => {
      const r = http.get(`${API}/community.php?action=challenges`);
      communityLatency.add(r.timings.duration);
      totalRequests.add(1);
      check(r, { 'community-challenges → 200': res => res.status === 200 });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO D — Fridge + Planner CRUD journey
// ═══════════════════════════════════════════════════════════════════════════════
export function plannerJourney() {
  const user = {
    username: `PlannerVU${__VU}_${Date.now()}`,
    email:    `planner_${__VU}_${Date.now()}@perf.test`,
    password: 'PlannerPass1!',
  };

  if (!ensureLoggedIn(user)) return;

  let fridgeId = 0;

  group('Planner: add fridge item', () => {
    const r = postJSON(`${API}/fridge.php?action=add`, { name: 'Carrots', category: 'Vegetables' });
    plannerLatency.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { 'fridge-add → 200': res => res.status === 200 });
    scenarioErrors.add(!ok);
    try { fridgeId = JSON.parse(r.body).id || 0; } catch { /* noop */ }
    thinkShort();
  });

  group('Planner: list fridge', () => {
    const r = http.get(`${API}/fridge.php?action=list`);
    plannerLatency.add(r.timings.duration);
    totalRequests.add(1);
    check(r, { 'fridge-list → 200': res => res.status === 200 });
    thinkShort();
  });

  group('Planner: save meal plan', () => {
    const date = `2026-${String((__VU % 12) + 1).padStart(2, '0')}-15`;
    const r    = postJSON(`${API}/planner.php?action=save`, { date, recipe_id: 1 });
    plannerLatency.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { 'planner-save → 200': res => res.status === 200 });
    scenarioErrors.add(!ok);
    thinkMedium();
  });

  group('Planner: list meal plan', () => {
    const r = http.get(`${API}/planner.php?action=list`);
    plannerLatency.add(r.timings.duration);
    totalRequests.add(1);
    check(r, { 'planner-list → 200': res => res.status === 200 });
    thinkShort();
  });

  if (fridgeId > 0) {
    group('Planner: remove fridge item', () => {
      const r = postJSON(`${API}/fridge.php?action=remove`, { id: fridgeId });
      plannerLatency.add(r.timings.duration);
      totalRequests.add(1);
      check(r, { 'fridge-remove → 200': res => res.status === 200 });
      thinkShort();
    });
  }
}

export function handleSummary(data) {
  const p95       = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errRate   = (data.metrics.http_req_failed?.values?.rate       || 0) * 100;
  const checksPct = (data.metrics.checks?.values?.rate                || 0) * 100;
  const totalReqs = data.metrics.http_reqs?.values?.count             || 0;

  const scenarioStats = ['anon', 'auth', 'community', 'planner'].map(s => {
    const key = `http_req_duration{scenario:${s}}`;
    const p95s = data.metrics[key]?.values?.['p(95)'] || 0;
    return `  ${s.padEnd(12)}: p(95) = ${p95s.toFixed(0)} ms`;
  });

  console.log('\n════════════════════════════════════════');
  console.log('  SCENARIOS TEST SUMMARY');
  console.log('════════════════════════════════════════');
  console.log(`  Total Requests : ${totalReqs}`);
  console.log(`  Global p(95)   : ${p95.toFixed(0)} ms`);
  console.log(`  Error Rate     : ${errRate.toFixed(2)} %`);
  console.log(`  Check Pass     : ${checksPct.toFixed(2)} %`);
  console.log('  ── Per-Scenario p(95) ──────────────');
  scenarioStats.forEach(s => console.log(s));
  console.log('════════════════════════════════════════\n');

  return {
    'results/scenarios-summary.json': JSON.stringify(data, null, 2),
  };
}
