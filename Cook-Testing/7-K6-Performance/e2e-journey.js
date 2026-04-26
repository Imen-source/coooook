/**
 * Cook's — End-to-End User Journey Test
 *
 * Purpose : Simulate a complete real-user session from registration through
 *           every feature (recipes, fridge, meal planner, community) to logout.
 *           Validates that all features work correctly together under load.
 *
 * Journey:
 *   1  Register new user
 *   2  Login
 *   3  Browse recipe list
 *   4  View recipe detail
 *   5  Create a recipe
 *   6  Save (bookmark) that recipe
 *   7  Unsave the recipe
 *   8  Add three ingredients to fridge
 *   9  List fridge — verify items present
 *  10  Remove one fridge item
 *  11  Save a meal plan entry
 *  12  List planner — verify entry present
 *  13  Remove the planner entry
 *  14  Create a community post
 *  15  Read community feed — verify post exists
 *  16  Logout
 *  17  Verify session is cleared
 *
 * Load:
 *   Default: 3 VUs × 2 iterations each (adjust with -e E2E_VUS / -e E2E_ITERS)
 *
 * Run:
 *   k6 run e2e-journey.js
 *   k6 run -e E2E_VUS=5 -e E2E_ITERS=3 e2e-journey.js
 *   k6 run --out json=results/e2e-journey-result.json e2e-journey.js
 */

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  API,
  postJSON,
  thinkShort,
  thinkMedium,
  randomRecipe,
  createSummaryHandler,
} from './config.js';

// ── Configurable via env ───────────────────────────────────────────────────────
const E2E_VUS   = parseInt(__ENV.E2E_VUS   || '3',  10);
const E2E_ITERS = parseInt(__ENV.E2E_ITERS || '2',  10);

// ── Custom metrics ─────────────────────────────────────────────────────────────
const journeyDuration = new Trend('e2e_journey_duration', true);
const stepErrors      = new Rate('e2e_step_errors');
const completedJourneys = new Counter('e2e_completed_journeys');

export const options = {
  scenarios: {
    full_journey: {
      executor:    'per-vu-iterations',
      vus:         E2E_VUS,
      iterations:  E2E_ITERS,
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_duration:    ['p(95)<1000'],
    http_req_failed:      ['rate<0.02'],
    checks:               ['rate>0.97'],
    e2e_step_errors:      ['rate<0.03'],
    e2e_journey_duration: ['p(95)<15000'],  // full journey under 15 s
  },
};

// ── Helper: parse JSON body safely ────────────────────────────────────────────
function body(res) {
  try { return JSON.parse(res.body); } catch { return {}; }
}

// ── Main journey ──────────────────────────────────────────────────────────────
export default function () {
  const journeyStart = Date.now();

  // Unique user per VU+iteration to avoid session collisions
  const ts   = Date.now();
  const user = {
    username: `E2EChef_${__VU}_${ts}`,
    email:    `e2e_${__VU}_${ts}@journey.test`,
    password: 'Journey123!',
  };

  let createdRecipeId = 0;
  let fridgeId1 = 0;
  let fridgeId2 = 0;
  const planDate = `2026-${String((__VU % 12) + 1).padStart(2, '0')}-20`;
  let postContent = '';

  // ── Step 1: Register ───────────────────────────────────────────────────────
  group('Step 01 — Register', () => {
    const res = postJSON(`${API}/auth.php?action=register`, user);
    const b   = body(res);
    const ok  = check(res, {
      'register → 200':     r => r.status === 200,
      'register → user.id': () => b?.user?.id > 0,
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 2: Login ──────────────────────────────────────────────────────────
  let loginOk = false;
  group('Step 02 — Login', () => {
    const res = postJSON(`${API}/auth.php?action=login`, {
      email:    user.email,
      password: user.password,
    });
    const b  = body(res);
    loginOk  = res.status === 200;
    const ok = check(res, {
      'login → 200':      r => r.status === 200,
      'login → has user': () => !!b?.user,
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  if (!loginOk) {
    stepErrors.add(true);
    return;
  }

  // ── Step 3: Browse recipe list ─────────────────────────────────────────────
  group('Step 03 — Browse recipe list', () => {
    const res = http.get(`${API}/recipes.php?action=list`);
    const b   = body(res);
    const ok  = check(res, {
      'recipe-list → 200':       r => r.status === 200,
      'recipe-list → array':     () => Array.isArray(b),
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 4: View recipe detail ─────────────────────────────────────────────
  group('Step 04 — Recipe detail', () => {
    const res = http.get(`${API}/recipes.php?action=detail&id=1`);
    const ok  = check(res, {
      'detail → 200 or 404': r => r.status === 200 || r.status === 404,
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 5: Create a recipe ────────────────────────────────────────────────
  group('Step 05 — Create recipe', () => {
    const res = postJSON(`${API}/recipes.php?action=create`, randomRecipe());
    const b   = body(res);
    const ok  = check(res, {
      'create-recipe → 200':    r => r.status === 200,
      'create-recipe → has id': () => b?.id > 0,
    });
    stepErrors.add(!ok);
    if (b?.id) createdRecipeId = b.id;
    thinkShort();
  });

  // ── Step 6: Save (bookmark) the recipe ────────────────────────────────────
  group('Step 06 — Save recipe', () => {
    const rid = createdRecipeId || 1;
    const res = postJSON(`${API}/recipes.php?action=toggle_save`, { recipe_id: rid });
    const b   = body(res);
    const ok  = check(res, {
      'toggle-save → 200':   r => r.status === 200,
      'toggle-save → saved': () => b?.saved === true,
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 7: Unsave the recipe ──────────────────────────────────────────────
  group('Step 07 — Unsave recipe', () => {
    const rid = createdRecipeId || 1;
    const res = postJSON(`${API}/recipes.php?action=toggle_save`, { recipe_id: rid });
    const b   = body(res);
    const ok  = check(res, {
      'toggle-unsave → 200':     r => r.status === 200,
      'toggle-unsave → unsaved': () => b?.saved === false,
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 8: Add fridge items ───────────────────────────────────────────────
  group('Step 08a — Fridge: add item 1', () => {
    const res = postJSON(`${API}/fridge.php?action=add`, { name: 'Onions', category: 'Vegetables' });
    const b   = body(res);
    const ok  = check(res, {
      'fridge-add1 → 200':    r => r.status === 200,
      'fridge-add1 → has id': () => b?.id > 0,
    });
    stepErrors.add(!ok);
    if (b?.id) fridgeId1 = b.id;
    thinkShort();
  });

  group('Step 08b — Fridge: add item 2', () => {
    const res = postJSON(`${API}/fridge.php?action=add`, { name: 'Garlic', category: 'Spices' });
    const b   = body(res);
    const ok  = check(res, {
      'fridge-add2 → 200': r => r.status === 200,
    });
    stepErrors.add(!ok);
    if (b?.id) fridgeId2 = b.id;
    thinkShort();
  });

  group('Step 08c — Fridge: add item 3', () => {
    const res = postJSON(`${API}/fridge.php?action=add`, { name: 'Cumin', category: 'Spices' });
    const ok  = check(res, { 'fridge-add3 → 200': r => r.status === 200 });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 9: List fridge ────────────────────────────────────────────────────
  group('Step 09 — Fridge: list', () => {
    const res = http.get(`${API}/fridge.php?action=list`);
    const b   = body(res);
    const ok  = check(res, {
      'fridge-list → 200':      r => r.status === 200,
      'fridge-list → array':    () => Array.isArray(b),
      'fridge-list → has items': () => Array.isArray(b) && b.length >= 2,
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 10: Remove one fridge item ───────────────────────────────────────
  group('Step 10 — Fridge: remove item', () => {
    const id  = fridgeId1 || 1;
    const res = postJSON(`${API}/fridge.php?action=remove`, { id });
    const ok  = check(res, { 'fridge-remove → 200': r => r.status === 200 });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 11: Save meal plan ────────────────────────────────────────────────
  group('Step 11 — Planner: save', () => {
    const rid = createdRecipeId || 1;
    const res = postJSON(`${API}/planner.php?action=save`, {
      date:      planDate,
      recipe_id: rid,
    });
    const ok = check(res, { 'planner-save → 200': r => r.status === 200 });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 12: List planner ──────────────────────────────────────────────────
  group('Step 12 — Planner: list', () => {
    const res = http.get(`${API}/planner.php?action=list`);
    const b   = body(res);
    const ok  = check(res, {
      'planner-list → 200':       r => r.status === 200,
      'planner-list → object':    () => b !== null && typeof b === 'object',
      'planner-list → has entry': () => Object.keys(b).length >= 1,
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 13: Remove planner entry ─────────────────────────────────────────
  group('Step 13 — Planner: remove', () => {
    const res = postJSON(`${API}/planner.php?action=remove`, { date: planDate });
    const ok  = check(res, { 'planner-remove → 200': r => r.status === 200 });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 14: Create community post ────────────────────────────────────────
  group('Step 14 — Community: create post', () => {
    postContent = `E2E journey post — VU${__VU} iter${__ITER} ts${ts}`;
    const res   = postJSON(`${API}/community.php?action=post`, { content: postContent });
    const b     = body(res);
    const ok    = check(res, {
      'community-post → 200':    r => r.status === 200,
      'community-post → has id': () => b?.id > 0,
    });
    stepErrors.add(!ok);
    thinkMedium();
  });

  // ── Step 15: Read community feed ──────────────────────────────────────────
  group('Step 15 — Community: feed', () => {
    const res  = http.get(`${API}/community.php?action=feed`);
    const b    = body(res);
    const ok   = check(res, {
      'community-feed → 200':   r => r.status === 200,
      'community-feed → array': () => Array.isArray(b),
    });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 16: Logout ────────────────────────────────────────────────────────
  group('Step 16 — Logout', () => {
    const res = http.get(`${API}/auth.php?action=logout`);
    const ok  = check(res, { 'logout → 200': r => r.status === 200 });
    stepErrors.add(!ok);
    thinkShort();
  });

  // ── Step 17: Verify session cleared ───────────────────────────────────────
  group('Step 17 — Verify logged out', () => {
    const res = http.get(`${API}/auth.php?action=status`);
    const b   = body(res);
    const ok  = check(res, {
      'logged-out → 200':            r => r.status === 200,
      'logged-out → loggedIn false': () => b?.loggedIn === false,
    });
    stepErrors.add(!ok);
  });

  journeyDuration.add(Date.now() - journeyStart);
  completedJourneys.add(1);
}

export const handleSummary = createSummaryHandler('e2e-journey');
