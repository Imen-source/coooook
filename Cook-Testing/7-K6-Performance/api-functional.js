/**
 * Cook's — API Functional Test
 *
 * Purpose : Verify that EVERY endpoint returns the correct status code and
 *           a well-formed JSON body.  This is the functional correctness gate;
 *           run it before any performance test to confirm the API is healthy.
 * Load    : 1 VU, 1 iteration (zero performance pressure).
 * Pass criteria: ALL checks must pass (rate == 1.0).
 *
 * Coverage:
 *   Auth     — register, login, status, logout
 *   Recipes  — list, list+category, list+search, detail, create, toggle_save
 *   Fridge   — add, list, remove
 *   Planner  — save, list, remove
 *   Community— feed, challenges, post
 *
 * Run:
 *   k6 run api-functional.js
 *   k6 run -e BASE_URL=http://localhost/cook api-functional.js
 */

import { group, check } from 'k6';
import http from 'k6/http';
import {
  API,
  postJSON,
  getAndCheck,
  thinkShort,
  randomUser,
  randomRecipe,
  createSummaryHandler,
} from './config.js';

export const options = {
  vus:        1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.01'],
    checks:            ['rate==1.0'],  // every single assertion must pass
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseBody(res) {
  try { return JSON.parse(res.body); } catch { return null; }
}

function isArray(val)  { return Array.isArray(val); }
function isObject(val) { return val !== null && typeof val === 'object' && !Array.isArray(val); }

// ── Test suite ────────────────────────────────────────────────────────────────
export default function () {
  const user      = randomUser();
  let   createdRecipeId = 0;
  let   fridgeItemId    = 0;
  const planDate  = '2026-12-01';

  // ════════════════════════════════════════════════════════════════════
  // GROUP 1 — Authentication
  // ════════════════════════════════════════════════════════════════════
  group('Auth: register', () => {
    const res  = postJSON(`${API}/auth.php?action=register`, user);
    const body = parseBody(res);
    check(res, {
      'register → 200':         r => r.status === 200,
      'register → has message': () => typeof body?.message === 'string',
      'register → has user.id': () => typeof body?.user?.id === 'number',
      'register → has username': () => body?.user?.username === user.username,
    });
    thinkShort();
  });

  group('Auth: login', () => {
    const res  = postJSON(`${API}/auth.php?action=login`, {
      email:    user.email,
      password: user.password,
    });
    const body = parseBody(res);
    check(res, {
      'login → 200':          r => r.status === 200,
      'login → has user':     () => isObject(body?.user),
      'login → user.id > 0':  () => body?.user?.id > 0,
      'login → has username': () => typeof body?.user?.username === 'string',
    });
    thinkShort();
  });

  group('Auth: status (logged in)', () => {
    const res  = http.get(`${API}/auth.php?action=status`);
    const body = parseBody(res);
    check(res, {
      'status → 200':          r => r.status === 200,
      'status → loggedIn true': () => body?.loggedIn === true,
      'status → has user':      () => isObject(body?.user),
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // GROUP 2 — Recipes (public)
  // ════════════════════════════════════════════════════════════════════
  group('Recipes: list all', () => {
    const res  = http.get(`${API}/recipes.php?action=list`);
    const body = parseBody(res);
    check(res, {
      'recipe-list → 200':      r => r.status === 200,
      'recipe-list → is array': () => isArray(body),
    });
    thinkShort();
  });

  group('Recipes: list by category', () => {
    const res  = http.get(`${API}/recipes.php?action=list&category=arabic`);
    const body = parseBody(res);
    check(res, {
      'recipe-list-cat → 200':      r => r.status === 200,
      'recipe-list-cat → is array': () => isArray(body),
    });
    thinkShort();
  });

  group('Recipes: search', () => {
    const res  = http.get(`${API}/recipes.php?action=list&search=tagine`);
    const body = parseBody(res);
    check(res, {
      'recipe-search → 200':      r => r.status === 200,
      'recipe-search → is array': () => isArray(body),
    });
    thinkShort();
  });

  group('Recipes: detail (id=1 or 404)', () => {
    const res  = http.get(`${API}/recipes.php?action=detail&id=1`);
    const body = parseBody(res);
    check(res, {
      'recipe-detail → 200 or 404': r => r.status === 200 || r.status === 404,
      'recipe-detail → json body':  () => isObject(body),
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // GROUP 3 — Recipe create & toggle_save (auth required)
  // ════════════════════════════════════════════════════════════════════
  group('Recipes: create (auth)', () => {
    const recipe = randomRecipe();
    const res    = postJSON(`${API}/recipes.php?action=create`, recipe);
    const body   = parseBody(res);
    check(res, {
      'recipe-create → 200':    r => r.status === 200,
      'recipe-create → has id': () => body?.id > 0,
      'recipe-create → message': () => typeof body?.message === 'string',
    });
    if (body?.id) createdRecipeId = body.id;
    thinkShort();
  });

  group('Recipes: toggle_save — save (auth)', () => {
    const rid = createdRecipeId || 1;
    const res  = postJSON(`${API}/recipes.php?action=toggle_save`, { recipe_id: rid });
    const body = parseBody(res);
    check(res, {
      'toggle-save → 200':        r => r.status === 200,
      'toggle-save → has saved':  () => typeof body?.saved === 'boolean',
    });
    thinkShort();
  });

  group('Recipes: toggle_save — unsave (auth)', () => {
    const rid = createdRecipeId || 1;
    const res  = postJSON(`${API}/recipes.php?action=toggle_save`, { recipe_id: rid });
    const body = parseBody(res);
    check(res, {
      'toggle-unsave → 200':       r => r.status === 200,
      'toggle-unsave → has saved': () => typeof body?.saved === 'boolean',
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // GROUP 4 — Fridge (auth required)
  // ════════════════════════════════════════════════════════════════════
  group('Fridge: add item', () => {
    const res  = postJSON(`${API}/fridge.php?action=add`, { name: 'Tomatoes', category: 'Vegetables' });
    const body = parseBody(res);
    check(res, {
      'fridge-add → 200':    r => r.status === 200,
      'fridge-add → has id': () => body?.id > 0,
      'fridge-add → message': () => typeof body?.message === 'string',
    });
    if (body?.id) fridgeItemId = body.id;
    thinkShort();
  });

  group('Fridge: add second item', () => {
    const res  = postJSON(`${API}/fridge.php?action=add`, { name: 'Olive Oil', category: 'Oils' });
    const body = parseBody(res);
    check(res, {
      'fridge-add2 → 200':    r => r.status === 200,
      'fridge-add2 → has id': () => body?.id > 0,
    });
    thinkShort();
  });

  group('Fridge: list', () => {
    const res  = http.get(`${API}/fridge.php?action=list`);
    const body = parseBody(res);
    check(res, {
      'fridge-list → 200':      r => r.status === 200,
      'fridge-list → is array': () => isArray(body),
      'fridge-list → ≥1 item':  () => isArray(body) && body.length >= 1,
    });
    thinkShort();
  });

  group('Fridge: remove item', () => {
    const id  = fridgeItemId || 1;
    const res = postJSON(`${API}/fridge.php?action=remove`, { id });
    const body = parseBody(res);
    check(res, {
      'fridge-remove → 200':     r => r.status === 200,
      'fridge-remove → message': () => typeof body?.message === 'string',
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // GROUP 5 — Meal Planner (auth required)
  // ════════════════════════════════════════════════════════════════════
  group('Planner: save entry', () => {
    const rid = createdRecipeId || 1;
    const res = postJSON(`${API}/planner.php?action=save`, { date: planDate, recipe_id: rid });
    const body = parseBody(res);
    check(res, {
      'planner-save → 200':     r => r.status === 200,
      'planner-save → message': () => typeof body?.message === 'string',
    });
    thinkShort();
  });

  group('Planner: list', () => {
    const res  = http.get(`${API}/planner.php?action=list`);
    const body = parseBody(res);
    check(res, {
      'planner-list → 200':       r => r.status === 200,
      'planner-list → is object': () => isObject(body),
      'planner-list → has entry': () => Object.keys(body).length >= 1,
    });
    thinkShort();
  });

  group('Planner: remove entry', () => {
    const res  = postJSON(`${API}/planner.php?action=remove`, { date: planDate });
    const body = parseBody(res);
    check(res, {
      'planner-remove → 200':     r => r.status === 200,
      'planner-remove → message': () => typeof body?.message === 'string',
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // GROUP 6 — Community (public + auth)
  // ════════════════════════════════════════════════════════════════════
  group('Community: feed (public)', () => {
    const res  = http.get(`${API}/community.php?action=feed`);
    const body = parseBody(res);
    check(res, {
      'community-feed → 200':      r => r.status === 200,
      'community-feed → is array': () => isArray(body),
    });
    thinkShort();
  });

  group('Community: challenges (public)', () => {
    const res  = http.get(`${API}/community.php?action=challenges`);
    const body = parseBody(res);
    check(res, {
      'community-challenges → 200':      r => r.status === 200,
      'community-challenges → is array': () => isArray(body),
    });
    thinkShort();
  });

  group('Community: create post (auth)', () => {
    const res  = postJSON(`${API}/community.php?action=post`, {
      content:   `K6 functional test post at ${Date.now()}`,
      image_url: '',
    });
    const body = parseBody(res);
    check(res, {
      'community-post → 200':    r => r.status === 200,
      'community-post → has id': () => body?.id > 0,
      'community-post → message': () => typeof body?.message === 'string',
    });
    thinkShort();
  });

  // ════════════════════════════════════════════════════════════════════
  // GROUP 7 — Logout
  // ════════════════════════════════════════════════════════════════════
  group('Auth: logout', () => {
    const res  = http.get(`${API}/auth.php?action=logout`);
    const body = parseBody(res);
    check(res, {
      'logout → 200':     r => r.status === 200,
      'logout → message': () => typeof body?.message === 'string',
    });
  });

  group('Auth: status (logged out)', () => {
    const res  = http.get(`${API}/auth.php?action=status`);
    const body = parseBody(res);
    check(res, {
      'status-out → 200':           r => r.status === 200,
      'status-out → loggedIn false': () => body?.loggedIn === false,
    });
  });
}

export const handleSummary = createSummaryHandler('api-functional');
