/**
 * Cook's — Extended Unit Tests
 *
 * Covers every pure / localStorage function extracted from script.js that is
 * not already covered by unit-tests.js:
 *
 *   Suite  6  — slugifyIngredient()
 *   Suite  7  — getIngredientEmoji()
 *   Suite  8  — buildIngredientDb()
 *   Suite  9  — getMatchPct()
 *   Suite 10  — getUnlockedReactions()
 *   Suite 11  — getStoredProfiles() / setStoredProfiles()
 *   Suite 12  — getFollowingMap() / setFollowingMap()
 *   Suite 13  — ensureSocialProfile()
 *   Suite 14  — isFollowingUser()
 *   Suite 15  — getPostReactions() / handleReaction()
 *   Suite 16  — getCurrentUserKey()
 *   Suite 17  — getUserCommunityPosts()
 *   Suite 18  — getAllRecipes() / recipe filtering
 *   Suite 19  — timer helpers (formatTimer)
 *   Suite 20  — populateSavedSignin() (localStorage-only path)
 */

// ─────────────────────────────────────────────────────────────
// RE-USE THE SAME MINI FRAMEWORK FROM unit-tests.js
// (That file is loaded first by test-runner.html, so describe /
//  it / assertEqual / … are already defined.)
// ─────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════
// LOCAL RE-IMPLEMENTATIONS
// Mirror the exact logic of each function from script.js.
// This keeps tests self-contained and decoupled from DOM state.
// ═════════════════════════════════════════════════════════════

// ── Ingredient helpers ────────────────────────────────────────────────────────
const _SUGGESTION_EMOJIS = {
  Chicken: '🍗', Lamb: '🥩', Beef: '🥩', Tuna: '🐟', Eggs: '🥚',
  Salmon: '🐟', Shrimp: '🦐', Turkey: '🦃', Sardines: '🐟', 'Minced Meat': '🥩',
  Tomato: '🍅', Onion: '🧅', Garlic: '🧄', Potato: '🥔', Carrot: '🥕',
  Spinach: '🥬', Pepper: '🌶️', Zucchini: '🥒', Eggplant: '🍆', Cucumber: '🥒',
  Leek: '🌿', Celery: '🌿', Milk: '🥛', Cheese: '🧀', Butter: '🧈',
  Yogurt: '🥛', Cream: '🥛', Feta: '🧀', Lemon: '🍋', Orange: '🍊',
  Apple: '🍎', Banana: '🍌', Dates: '🫐', Figs: '🫐', Pomegranate: '🍎',
  Cumin: '🌰', Coriander: '🌿', Saffron: '🌼', Turmeric: '🟡', Cinnamon: '🪵',
  Harissa: '🌶️', Paprika: '🌶️', Cardamom: '🌿', 'Ras El Hanout': '🌿',
  Mint: '🌿', Rice: '🍚', Couscous: '🍛', Pasta: '🍝', Flour: '🌾',
  'Olive Oil': '🫒', Chickpeas: '🫛', Lentils: '🫛', 'Tomato Paste': '🍅',
  Bread: '🍞', Semolina: '🌾',
};

const _INGREDIENT_SUGGESTIONS = {
  protein:   ['Chicken','Lamb','Beef','Tuna','Eggs','Salmon','Shrimp','Turkey','Sardines','Minced Meat'],
  vegetables:['Tomato','Onion','Garlic','Potato','Carrot','Spinach','Pepper','Zucchini','Eggplant','Cucumber','Leek','Celery'],
  dairy:     ['Milk','Cheese','Butter','Yogurt','Cream','Feta'],
  fruits:    ['Lemon','Orange','Apple','Banana','Dates','Figs','Pomegranate'],
  spices:    ['Cumin','Coriander','Saffron','Turmeric','Cinnamon','Harissa','Paprika','Cardamom','Ras El Hanout','Mint'],
  pantry:    ['Rice','Couscous','Pasta','Flour','Olive Oil','Chickpeas','Lentils','Tomato Paste','Bread','Semolina'],
};

const _CATEGORY_KEY_MAP = {
  protein: 'protein', vegetables: 'veg', dairy: 'dairy',
  fruits: 'fruit', spices: 'spice', pantry: 'pantry',
};

const _REACTION_FREE   = ['❤️','👏','🔥'];
const _REACTION_LOCKED = ['🫕','🧆','🥙'];

function _slugifyIngredient(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function _getIngredientEmoji(name) {
  return _SUGGESTION_EMOJIS[name] || '🥣';
}

function _buildIngredientDb() {
  const db = { protein: [], veg: [], dairy: [], fruit: [], spice: [], pantry: [] };
  for (const [group, items] of Object.entries(_INGREDIENT_SUGGESTIONS)) {
    const shelfKey = _CATEGORY_KEY_MAP[group];
    items.forEach(name => {
      db[shelfKey].push({
        id:       _slugifyIngredient(name),
        name,
        emoji:    _getIngredientEmoji(name),
        category: shelfKey,
      });
    });
  }
  return db;
}

function _getMatchPct(recipe, fridge) {
  if (!fridge || Array.isArray(fridge)) return 0;
  if (!recipe.ingredients || recipe.ingredients.length === 0) return 0;
  const have = recipe.ingredients.filter(i => fridge[i.id]).length;
  return Math.round((have / recipe.ingredients.length) * 100);
}

function _getUnlockedReactions(streak) {
  const out = [];
  if (streak >= 3)  out.push('🫕');
  if (streak >= 7)  out.push('🧆');
  if (streak >= 14) out.push('🥙');
  return out;
}

function _getStoredProfiles() {
  return JSON.parse(localStorage.getItem('cooks_social_profiles') || '{}');
}

function _setStoredProfiles(profiles) {
  localStorage.setItem('cooks_social_profiles', JSON.stringify(profiles));
}

function _getFollowingMap() {
  return JSON.parse(localStorage.getItem('cooks_following') || '{}');
}

function _setFollowingMap(map) {
  localStorage.setItem('cooks_following', JSON.stringify(map));
}

const _DEMO_PROFILE_DEFAULTS = {
  RaniaCooks:     { followers: 31, following: 84, joined: 'Jan 2025', bio: 'Couscous lover.', avatar: '👩‍🍳' },
  ChefAmine:      { followers: 24, following: 39, joined: 'Feb 2025', bio: 'Breakfast experiments.', avatar: '🧑‍🍳' },
  MalikaCooks:    { followers: 41, following: 52, joined: 'Mar 2025', bio: 'Tagines and heritage.', avatar: '👩‍🍳' },
  YoussefKitchen: { followers: 18, following: 26, joined: 'Apr 2025', bio: 'Fresh flavours.', avatar: '🧑‍🍳' },
};

function _ensureSocialProfile(username, overrides = {}) {
  if (!username) return null;
  const profiles = _getStoredProfiles();
  const current  = profiles[username] || {};
  const base     = _DEMO_PROFILE_DEFAULTS[username] || {};
  profiles[username] = {
    followers: 0, following: 0, posts: 0, bio: '', avatar: '👨‍🍳',
    ...base, ...current, ...overrides,
  };
  _setStoredProfiles(profiles);
  return profiles[username];
}

function _getCurrentUserKey(currentUser) {
  return currentUser?.email || currentUser?.name || 'guest';
}

function _isFollowingUser(username, currentUser) {
  const followingMap  = _getFollowingMap();
  const userKey       = _getCurrentUserKey(currentUser);
  const followingList = followingMap[userKey] || [];
  return followingList.includes(username);
}

function _getPostReactions(postId) {
  const all = JSON.parse(localStorage.getItem('cooks_reactions') || '{}');
  return all[String(postId)] || {};
}

function _handleReaction(postId, emoji) {
  const all = JSON.parse(localStorage.getItem('cooks_reactions') || '{}');
  const key = String(postId);
  if (!all[key]) all[key] = {};
  all[key][emoji] = (all[key][emoji] || 0) + 1;
  localStorage.setItem('cooks_reactions', JSON.stringify(all));
}

const _DEMO_POSTS = [
  { postId: 'demo_0', username: 'RaniaCooks',     dish: 'Couscous',       caption: 'Friday couscous 🫶', time: '2 days ago',  likes: 67 },
  { postId: 'demo_1', username: 'ChefAmine',      dish: 'Shakshuka',      caption: 'Perfect egg yolks 🍳', time: '2 hours ago', likes: 24 },
  { postId: 'demo_2', username: 'MalikaCooks',    dish: 'Chicken Tagine', caption: 'Preserved lemon 🫕',  time: '5 hours ago', likes: 41 },
  { postId: 'demo_3', username: 'YoussefKitchen', dish: 'Tabbouleh',      caption: 'Fresh garden 🌿',     time: 'yesterday',   likes: 18 },
];

function _getUserCommunityPosts(username) {
  const userPosts = JSON.parse(localStorage.getItem('community_user_posts') || '[]');
  return [...userPosts, ..._DEMO_POSTS].filter(p => p.username === username);
}

function _formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ─────────────────────────────────────────────────────────────
// CLEANUP HELPERS
// ─────────────────────────────────────────────────────────────
function _cleanProfiles()   { localStorage.removeItem('cooks_social_profiles'); }
function _cleanFollowing()  { localStorage.removeItem('cooks_following'); }
function _cleanReactions()  { localStorage.removeItem('cooks_reactions'); }
function _cleanUserPosts()  { localStorage.removeItem('community_user_posts'); }


// ═════════════════════════════════════════════════════════════
// SUITE 6 — slugifyIngredient()
// ═════════════════════════════════════════════════════════════
describe('slugifyIngredient()', () => {

  it('converts a simple word to lowercase', () => {
    assertEqual(_slugifyIngredient('Lamb'), 'lamb');
  });

  it('replaces a space with a hyphen', () => {
    assertEqual(_slugifyIngredient('Olive Oil'), 'olive-oil');
  });

  it('replaces multiple spaces with a single hyphen', () => {
    assertEqual(_slugifyIngredient('Ras   El   Hanout'), 'ras-el-hanout');
  });

  it('strips leading and trailing hyphens', () => {
    assertEqual(_slugifyIngredient('  Garlic  '), 'garlic');
  });

  it('strips special characters', () => {
    assertEqual(_slugifyIngredient('Tomato!@#'), 'tomato');
  });

  it('handles mixed case correctly', () => {
    assertEqual(_slugifyIngredient('MiNcEd MeAt'), 'minced-meat');
  });

  it('handles already-lowercase input unchanged', () => {
    assertEqual(_slugifyIngredient('cumin'), 'cumin');
  });

  it('handles numbers in the name', () => {
    assertEqual(_slugifyIngredient('Spice Mix 7'), 'spice-mix-7');
  });

  it('returns empty string for empty input', () => {
    assertEqual(_slugifyIngredient(''), '');
  });

  it('handles name with only special characters', () => {
    assertEqual(_slugifyIngredient('!!!'), '');
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 7 — getIngredientEmoji()
// ═════════════════════════════════════════════════════════════
describe('getIngredientEmoji()', () => {

  it('returns 🍗 for Chicken', () => {
    assertEqual(_getIngredientEmoji('Chicken'), '🍗');
  });

  it('returns 🥚 for Eggs', () => {
    assertEqual(_getIngredientEmoji('Eggs'), '🥚');
  });

  it('returns 🍋 for Lemon', () => {
    assertEqual(_getIngredientEmoji('Lemon'), '🍋');
  });

  it('returns 🌼 for Saffron', () => {
    assertEqual(_getIngredientEmoji('Saffron'), '🌼');
  });

  it('returns 🍚 for Rice', () => {
    assertEqual(_getIngredientEmoji('Rice'), '🍚');
  });

  it('returns 🫒 for Olive Oil', () => {
    assertEqual(_getIngredientEmoji('Olive Oil'), '🫒');
  });

  it('returns default 🥣 for an unknown ingredient', () => {
    assertEqual(_getIngredientEmoji('Dragon Fruit'), '🥣');
  });

  it('returns default 🥣 for empty string', () => {
    assertEqual(_getIngredientEmoji(''), '🥣');
  });

  it('is case-sensitive — unknown if wrong case', () => {
    // 'chicken' (lowercase) is NOT in the map; only 'Chicken' is
    assertEqual(_getIngredientEmoji('chicken'), '🥣');
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 8 — buildIngredientDb()
// ═════════════════════════════════════════════════════════════
describe('buildIngredientDb()', () => {

  const db = _buildIngredientDb();

  it('returns object with exactly 6 shelf keys', () => {
    const keys = Object.keys(db);
    assertEqual(keys.length, 6);
  });

  it('contains the protein shelf', () => {
    assertTrue(Array.isArray(db.protein), 'protein should be an array');
  });

  it('protein shelf has correct item count (10)', () => {
    assertEqual(db.protein.length, 10);
  });

  it('veg shelf has correct item count (12)', () => {
    assertEqual(db.veg.length, 12);
  });

  it('dairy shelf has correct item count (6)', () => {
    assertEqual(db.dairy.length, 6);
  });

  it('fruit shelf has correct item count (7)', () => {
    assertEqual(db.fruit.length, 7);
  });

  it('spice shelf has correct item count (10)', () => {
    assertEqual(db.spice.length, 10);
  });

  it('pantry shelf has correct item count (10)', () => {
    assertEqual(db.pantry.length, 10);
  });

  it('each item has id, name, emoji, category fields', () => {
    const item = db.protein[0];
    assertTrue(typeof item.id       === 'string', 'id should be string');
    assertTrue(typeof item.name     === 'string', 'name should be string');
    assertTrue(typeof item.emoji    === 'string', 'emoji should be string');
    assertTrue(typeof item.category === 'string', 'category should be string');
  });

  it('item id is the slugified name', () => {
    const item = db.protein.find(i => i.name === 'Minced Meat');
    assertEqual(item.id, 'minced-meat');
  });

  it('item category matches shelf key', () => {
    db.protein.forEach(i => assertEqual(i.category, 'protein', `${i.name} should have category protein`));
    db.veg.forEach(i =>     assertEqual(i.category, 'veg',     `${i.name} should have category veg`));
    db.dairy.forEach(i =>   assertEqual(i.category, 'dairy'));
    db.spice.forEach(i =>   assertEqual(i.category, 'spice'));
    db.pantry.forEach(i =>  assertEqual(i.category, 'pantry'));
  });

  it('no duplicate ids within a shelf', () => {
    Object.entries(db).forEach(([shelf, items]) => {
      const ids = items.map(i => i.id);
      const unique = new Set(ids);
      assertEqual(ids.length, unique.size, `Duplicate id found in shelf: ${shelf}`);
    });
  });

  it('Ras El Hanout slugifies to ras-el-hanout', () => {
    const item = db.spice.find(i => i.name === 'Ras El Hanout');
    assertTrue(!!item, 'Ras El Hanout should be in spice shelf');
    assertEqual(item.id, 'ras-el-hanout');
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 9 — getMatchPct()
// ═════════════════════════════════════════════════════════════
describe('getMatchPct()', () => {

  const recipe = {
    ingredients: [
      { id: 'lamb',     name: 'Lamb' },
      { id: 'rice',     name: 'Rice' },
      { id: 'onions',   name: 'Onions' },
      { id: 'saffron',  name: 'Saffron' },
    ],
  };

  it('returns 0 when fridge is empty', () => {
    assertEqual(_getMatchPct(recipe, {}), 0);
  });

  it('returns 100 when all ingredients are in fridge', () => {
    const fridge = { lamb: true, rice: true, onions: true, saffron: true };
    assertEqual(_getMatchPct(recipe, fridge), 100);
  });

  it('returns 50 when half the ingredients are present', () => {
    const fridge = { lamb: true, rice: true };
    assertEqual(_getMatchPct(recipe, fridge), 50);
  });

  it('returns 25 when one of four ingredients is present', () => {
    const fridge = { saffron: true };
    assertEqual(_getMatchPct(recipe, fridge), 25);
  });

  it('returns 75 when three of four ingredients are present', () => {
    const fridge = { lamb: true, rice: true, onions: true };
    assertEqual(_getMatchPct(recipe, fridge), 75);
  });

  it('returns 0 when fridge is an array (guard condition)', () => {
    assertEqual(_getMatchPct(recipe, []), 0);
  });

  it('returns 0 when fridge is null', () => {
    assertEqual(_getMatchPct(recipe, null), 0);
  });

  it('returns 0 for a recipe with no ingredients', () => {
    assertEqual(_getMatchPct({ ingredients: [] }, { lamb: true }), 0);
  });

  it('rounds to nearest integer', () => {
    const r = { ingredients: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
    // 1 out of 3 = 33.33…
    assertEqual(_getMatchPct(r, { a: true }), 33);
  });

  it('ingredients not in fridge do not count', () => {
    const fridge = { garlic: true, tomato: true }; // none match recipe
    assertEqual(_getMatchPct(recipe, fridge), 0);
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 10 — getUnlockedReactions()
// ═════════════════════════════════════════════════════════════
describe('getUnlockedReactions()', () => {

  it('returns empty array when streak is 0', () => {
    assertEqual(_getUnlockedReactions(0).length, 0);
  });

  it('returns empty array when streak is 1', () => {
    assertEqual(_getUnlockedReactions(1).length, 0);
  });

  it('returns empty array when streak is 2', () => {
    assertEqual(_getUnlockedReactions(2).length, 0);
  });

  it('unlocks 🫕 at streak 3', () => {
    const r = _getUnlockedReactions(3);
    assertContains(r, '🫕');
    assertEqual(r.length, 1);
  });

  it('still only 🫕 at streak 6', () => {
    const r = _getUnlockedReactions(6);
    assertContains(r, '🫕');
    assertEqual(r.length, 1);
  });

  it('unlocks 🧆 at streak 7', () => {
    const r = _getUnlockedReactions(7);
    assertContains(r, '🫕');
    assertContains(r, '🧆');
    assertEqual(r.length, 2);
  });

  it('still only two unlocked at streak 13', () => {
    const r = _getUnlockedReactions(13);
    assertEqual(r.length, 2);
  });

  it('unlocks 🥙 at streak 14', () => {
    const r = _getUnlockedReactions(14);
    assertContains(r, '🫕');
    assertContains(r, '🧆');
    assertContains(r, '🥙');
    assertEqual(r.length, 3);
  });

  it('all three still unlocked at very high streak (100)', () => {
    const r = _getUnlockedReactions(100);
    assertEqual(r.length, 3);
  });

  it('does not include free reactions (❤️ 👏 🔥) in unlocked set', () => {
    const r = _getUnlockedReactions(100);
    assertFalse(r.includes('❤️'), '❤️ is always free, not in unlocked');
    assertFalse(r.includes('👏'), '👏 is always free');
    assertFalse(r.includes('🔥'), '🔥 is always free');
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 11 — getStoredProfiles() / setStoredProfiles()
// ═════════════════════════════════════════════════════════════
describe('getStoredProfiles() / setStoredProfiles()', () => {

  it('returns empty object when nothing is stored', () => {
    _cleanProfiles();
    const p = _getStoredProfiles();
    assertEqual(typeof p, 'object');
    assertEqual(Object.keys(p).length, 0);
    _cleanProfiles();
  });

  it('setStoredProfiles persists data', () => {
    _cleanProfiles();
    _setStoredProfiles({ TestChef: { followers: 5 } });
    const p = _getStoredProfiles();
    assertEqual(p.TestChef.followers, 5);
    _cleanProfiles();
  });

  it('overwrites existing data on second set', () => {
    _cleanProfiles();
    _setStoredProfiles({ A: { followers: 1 } });
    _setStoredProfiles({ B: { followers: 2 } });
    const p = _getStoredProfiles();
    assertFalse('A' in p, 'A should be gone after overwrite');
    assertTrue('B' in p, 'B should be present');
    _cleanProfiles();
  });

  it('stores multiple profiles simultaneously', () => {
    _cleanProfiles();
    _setStoredProfiles({ Chef1: { followers: 10 }, Chef2: { followers: 20 } });
    const p = _getStoredProfiles();
    assertEqual(Object.keys(p).length, 2);
    _cleanProfiles();
  });

  it('returns correct value after round-trip JSON serialisation', () => {
    _cleanProfiles();
    const input = { Chef: { followers: 99, bio: 'Test bio', avatar: '🧑‍🍳' } };
    _setStoredProfiles(input);
    const p = _getStoredProfiles();
    assertEqual(p.Chef.followers, 99);
    assertEqual(p.Chef.bio, 'Test bio');
    assertEqual(p.Chef.avatar, '🧑‍🍳');
    _cleanProfiles();
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 12 — getFollowingMap() / setFollowingMap()
// ═════════════════════════════════════════════════════════════
describe('getFollowingMap() / setFollowingMap()', () => {

  it('returns empty object when nothing stored', () => {
    _cleanFollowing();
    assertEqual(Object.keys(_getFollowingMap()).length, 0);
    _cleanFollowing();
  });

  it('stores and retrieves a following list', () => {
    _cleanFollowing();
    _setFollowingMap({ 'user@test.local': ['ChefA', 'ChefB'] });
    const m = _getFollowingMap();
    assertEqual(m['user@test.local'].length, 2);
    _cleanFollowing();
  });

  it('handles multiple users in the map', () => {
    _cleanFollowing();
    _setFollowingMap({ 'alice@t.local': ['Bob'], 'bob@t.local': ['Alice'] });
    const m = _getFollowingMap();
    assertEqual(Object.keys(m).length, 2);
    _cleanFollowing();
  });

  it('overwrites previous map on second set', () => {
    _cleanFollowing();
    _setFollowingMap({ 'x@t.local': ['A'] });
    _setFollowingMap({ 'y@t.local': ['B'] });
    const m = _getFollowingMap();
    assertFalse('x@t.local' in m, 'Old key should be gone');
    assertTrue('y@t.local' in m, 'New key should be present');
    _cleanFollowing();
  });

  it('preserves array contents after round-trip', () => {
    _cleanFollowing();
    const list = ['ChefAmine', 'MalikaCooks', 'RaniaCooks'];
    _setFollowingMap({ 'me@t.local': list });
    const retrieved = _getFollowingMap()['me@t.local'];
    assertEqual(retrieved.length, 3);
    assertEqual(retrieved[0], 'ChefAmine');
    assertEqual(retrieved[2], 'RaniaCooks');
    _cleanFollowing();
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 13 — ensureSocialProfile()
// ═════════════════════════════════════════════════════════════
describe('ensureSocialProfile()', () => {

  it('returns null for falsy username', () => {
    _cleanProfiles();
    assertEqual(_ensureSocialProfile(null), null);
    assertEqual(_ensureSocialProfile(''),   null);
    _cleanProfiles();
  });

  it('creates a profile with default values for unknown user', () => {
    _cleanProfiles();
    const p = _ensureSocialProfile('NewChef');
    assertEqual(p.followers, 0);
    assertEqual(p.following, 0);
    assertEqual(p.posts,     0);
    assertEqual(p.avatar,    '👨‍🍳');
    _cleanProfiles();
  });

  it('merges DEMO_PROFILE_DEFAULTS for known demo user (RaniaCooks)', () => {
    _cleanProfiles();
    const p = _ensureSocialProfile('RaniaCooks');
    assertEqual(p.followers, 31);
    assertEqual(p.avatar,    '👩‍🍳');
    _cleanProfiles();
  });

  it('overrides take highest precedence over base and defaults', () => {
    _cleanProfiles();
    const p = _ensureSocialProfile('RaniaCooks', { followers: 999 });
    assertEqual(p.followers, 999);
    _cleanProfiles();
  });

  it('persists profile to localStorage', () => {
    _cleanProfiles();
    _ensureSocialProfile('PersistTest', { bio: 'Saved bio' });
    const stored = _getStoredProfiles();
    assertTrue('PersistTest' in stored, 'Profile should be stored');
    assertEqual(stored.PersistTest.bio, 'Saved bio');
    _cleanProfiles();
  });

  it('existing stored data takes precedence over defaults', () => {
    _cleanProfiles();
    _setStoredProfiles({ ChefAmine: { followers: 500, following: 1, posts: 0, bio: '', avatar: '👨‍🍳' } });
    const p = _ensureSocialProfile('ChefAmine');
    // Stored 500 should win over the DEMO_PROFILE_DEFAULTS followers of 24
    assertEqual(p.followers, 500);
    _cleanProfiles();
  });

  it('does not reset existing profile on second call without overrides', () => {
    _cleanProfiles();
    _ensureSocialProfile('ChefX', { posts: 7 });
    _ensureSocialProfile('ChefX');           // second call, no override
    const p = _getStoredProfiles()['ChefX'];
    assertEqual(p.posts, 7, 'posts should be preserved across calls');
    _cleanProfiles();
  });

  it('handles multiple different users without collision', () => {
    _cleanProfiles();
    _ensureSocialProfile('Alpha', { followers: 1 });
    _ensureSocialProfile('Beta',  { followers: 2 });
    const stored = _getStoredProfiles();
    assertEqual(stored.Alpha.followers, 1);
    assertEqual(stored.Beta.followers,  2);
    _cleanProfiles();
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 14 — isFollowingUser()
// ═════════════════════════════════════════════════════════════
describe('isFollowingUser()', () => {

  const ME = { email: 'me@test.local', name: 'Me' };

  it('returns false when following map is empty', () => {
    _cleanFollowing();
    assertFalse(_isFollowingUser('ChefAmine', ME));
    _cleanFollowing();
  });

  it('returns true when user is in following list', () => {
    _cleanFollowing();
    _setFollowingMap({ 'me@test.local': ['ChefAmine'] });
    assertTrue(_isFollowingUser('ChefAmine', ME));
    _cleanFollowing();
  });

  it('returns false when user is NOT in following list', () => {
    _cleanFollowing();
    _setFollowingMap({ 'me@test.local': ['RaniaCooks'] });
    assertFalse(_isFollowingUser('ChefAmine', ME));
    _cleanFollowing();
  });

  it('uses email as the user key (not name)', () => {
    _cleanFollowing();
    _setFollowingMap({ 'me@test.local': ['MalikaCooks'] });
    assertTrue(_isFollowingUser('MalikaCooks', ME));
    _cleanFollowing();
  });

  it('falls back to name when no email', () => {
    _cleanFollowing();
    const user = { name: 'NoEmailUser' };
    _setFollowingMap({ 'NoEmailUser': ['ChefX'] });
    assertTrue(_isFollowingUser('ChefX', user));
    _cleanFollowing();
  });

  it('falls back to "guest" when no user object', () => {
    _cleanFollowing();
    _setFollowingMap({ 'guest': ['ChefY'] });
    assertTrue(_isFollowingUser('ChefY', null));
    _cleanFollowing();
  });

  it('is case-sensitive for usernames', () => {
    _cleanFollowing();
    _setFollowingMap({ 'me@test.local': ['ChefAmine'] });
    assertFalse(_isFollowingUser('chefamine', ME), 'lowercase should not match');
    _cleanFollowing();
  });

  it('handles following multiple users correctly', () => {
    _cleanFollowing();
    _setFollowingMap({ 'me@test.local': ['A', 'B', 'C'] });
    assertTrue(_isFollowingUser('A', ME));
    assertTrue(_isFollowingUser('B', ME));
    assertTrue(_isFollowingUser('C', ME));
    assertFalse(_isFollowingUser('D', ME));
    _cleanFollowing();
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 15 — getPostReactions() / handleReaction()
// ═════════════════════════════════════════════════════════════
describe('getPostReactions() / handleReaction()', () => {

  it('returns empty object when no reactions exist', () => {
    _cleanReactions();
    const r = _getPostReactions('post_1');
    assertEqual(Object.keys(r).length, 0);
    _cleanReactions();
  });

  it('handleReaction increments count for a new emoji', () => {
    _cleanReactions();
    _handleReaction('post_1', '❤️');
    const r = _getPostReactions('post_1');
    assertEqual(r['❤️'], 1);
    _cleanReactions();
  });

  it('handleReaction increments count on repeated calls', () => {
    _cleanReactions();
    _handleReaction('post_1', '❤️');
    _handleReaction('post_1', '❤️');
    _handleReaction('post_1', '❤️');
    const r = _getPostReactions('post_1');
    assertEqual(r['❤️'], 3);
    _cleanReactions();
  });

  it('handles multiple emoji on the same post independently', () => {
    _cleanReactions();
    _handleReaction('post_1', '❤️');
    _handleReaction('post_1', '🔥');
    _handleReaction('post_1', '🔥');
    const r = _getPostReactions('post_1');
    assertEqual(r['❤️'], 1);
    assertEqual(r['🔥'], 2);
    _cleanReactions();
  });

  it('reactions for different posts do not interfere', () => {
    _cleanReactions();
    _handleReaction('post_1', '❤️');
    _handleReaction('post_2', '👏');
    assertEqual(_getPostReactions('post_1')['❤️'], 1);
    assertEqual(_getPostReactions('post_2')['👏'], 1);
    assertFalse('👏' in _getPostReactions('post_1'), '👏 should not bleed to post_1');
    _cleanReactions();
  });

  it('numeric and string postIds both work (coerced to string)', () => {
    _cleanReactions();
    _handleReaction(42, '🫕');
    const r = _getPostReactions(42);
    assertEqual(r['🫕'], 1);
    _cleanReactions();
  });

  it('getPostReactions returns fresh state after multiple handleReaction calls', () => {
    _cleanReactions();
    for (let i = 0; i < 5; i++) _handleReaction('p', '🧆');
    assertEqual(_getPostReactions('p')['🧆'], 5);
    _cleanReactions();
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 16 — getCurrentUserKey()
// ═════════════════════════════════════════════════════════════
describe('getCurrentUserKey()', () => {

  it('returns email when user has email', () => {
    const user = { email: 'chef@test.local', name: 'Chef' };
    assertEqual(_getCurrentUserKey(user), 'chef@test.local');
  });

  it('returns name when user has no email', () => {
    const user = { name: 'GuestChef' };
    assertEqual(_getCurrentUserKey(user), 'GuestChef');
  });

  it('returns "guest" when user is null', () => {
    assertEqual(_getCurrentUserKey(null), 'guest');
  });

  it('returns "guest" when user is undefined', () => {
    assertEqual(_getCurrentUserKey(undefined), 'guest');
  });

  it('prefers email over name when both are present', () => {
    const user = { email: 'a@b.com', name: 'A' };
    assertEqual(_getCurrentUserKey(user), 'a@b.com');
  });

  it('returns "guest" when user object is empty', () => {
    assertEqual(_getCurrentUserKey({}), 'guest');
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 17 — getUserCommunityPosts()
// ═════════════════════════════════════════════════════════════
describe('getUserCommunityPosts()', () => {

  it('returns demo posts for RaniaCooks', () => {
    _cleanUserPosts();
    const posts = _getUserCommunityPosts('RaniaCooks');
    assertTrue(posts.length >= 1, 'Should have at least one demo post');
    posts.forEach(p => assertEqual(p.username, 'RaniaCooks'));
    _cleanUserPosts();
  });

  it('returns empty array for unknown demo user', () => {
    _cleanUserPosts();
    const posts = _getUserCommunityPosts('NoSuchUser');
    assertEqual(posts.length, 0);
    _cleanUserPosts();
  });

  it('includes user-created posts from localStorage', () => {
    _cleanUserPosts();
    const myPost = { postId: 'user_1', username: 'TestUser', caption: 'Hello world', time: 'now', likes: 0 };
    localStorage.setItem('community_user_posts', JSON.stringify([myPost]));
    const posts = _getUserCommunityPosts('TestUser');
    assertEqual(posts.length, 1);
    assertEqual(posts[0].caption, 'Hello world');
    _cleanUserPosts();
  });

  it('does not return posts from other users', () => {
    _cleanUserPosts();
    const otherPost = { postId: 'user_2', username: 'SomeoneElse', caption: 'Other', time: 'now', likes: 0 };
    localStorage.setItem('community_user_posts', JSON.stringify([otherPost]));
    const posts = _getUserCommunityPosts('TestUser');
    assertEqual(posts.length, 0);
    _cleanUserPosts();
  });

  it('combines localStorage posts with demo posts for the same username', () => {
    _cleanUserPosts();
    // RaniaCooks has 1 demo post; add a user post for her too
    const ownPost = { postId: 'user_r', username: 'RaniaCooks', caption: 'Extra post', time: 'now', likes: 0 };
    localStorage.setItem('community_user_posts', JSON.stringify([ownPost]));
    const posts = _getUserCommunityPosts('RaniaCooks');
    assertTrue(posts.length >= 2, 'Should have localStorage + demo post');
    _cleanUserPosts();
  });

  it('all returned posts belong to the requested username', () => {
    _cleanUserPosts();
    const posts = _getUserCommunityPosts('ChefAmine');
    posts.forEach(p => assertEqual(p.username, 'ChefAmine'));
    _cleanUserPosts();
  });

  it('returns posts in order: localStorage posts first, demo posts second', () => {
    _cleanUserPosts();
    const ownPost = { postId: 'user_c', username: 'ChefAmine', caption: 'My post', time: 'now', likes: 0 };
    localStorage.setItem('community_user_posts', JSON.stringify([ownPost]));
    const posts = _getUserCommunityPosts('ChefAmine');
    assertEqual(posts[0].postId, 'user_c', 'localStorage post should come first');
    _cleanUserPosts();
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 18 — getAllRecipes() / recipe category filtering logic
// ═════════════════════════════════════════════════════════════
describe('Recipe filtering logic', () => {

  const RECIPES = [
    { id: 'r1', cat: 'arabic',  name: 'Kabsa',     quick: false, ingredients: [{ id: 'lamb' }] },
    { id: 'r2', cat: 'maghreb', name: 'Ojja',      quick: true,  ingredients: [{ id: 'eggs' }] },
    { id: 'r3', cat: 'levant',  name: 'Tabbouleh', quick: true,  ingredients: [{ id: 'parsley' }] },
    { id: 'r4', cat: 'world',   name: 'Shakshuka', quick: true,  ingredients: [{ id: 'eggs' }, { id: 'tomatoes' }] },
  ];

  function _filterRecipes(recipes, cat, search) {
    return recipes.filter(r => {
      const catMatch    = cat === 'all' || r.cat === cat || (cat === 'quick' && r.quick);
      const searchMatch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      return catMatch && searchMatch;
    });
  }

  it('returns all recipes when category is "all" and no search', () => {
    assertEqual(_filterRecipes(RECIPES, 'all', '').length, 4);
  });

  it('filters to arabic category only', () => {
    const result = _filterRecipes(RECIPES, 'arabic', '');
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'r1');
  });

  it('filters to maghreb category only', () => {
    const result = _filterRecipes(RECIPES, 'maghreb', '');
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'r2');
  });

  it('quick filter returns all quick recipes regardless of category', () => {
    const result = _filterRecipes(RECIPES, 'quick', '');
    assertEqual(result.length, 3, 'Ojja, Tabbouleh, Shakshuka are all quick');
  });

  it('search filters by name (case-insensitive)', () => {
    const result = _filterRecipes(RECIPES, 'all', 'kabsa');
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'r1');
  });

  it('search is case-insensitive', () => {
    assertEqual(_filterRecipes(RECIPES, 'all', 'TABBOULEH').length, 1);
  });

  it('search returns 0 results for unknown term', () => {
    assertEqual(_filterRecipes(RECIPES, 'all', 'xyz123').length, 0);
  });

  it('combining category + search narrows results', () => {
    // quick + "ojja" => only r2
    assertEqual(_filterRecipes(RECIPES, 'quick', 'ojja').length, 1);
  });

  it('non-matching category returns empty array', () => {
    assertEqual(_filterRecipes(RECIPES, 'nonexistent', '').length, 0);
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 19 — Timer formatter
// ═════════════════════════════════════════════════════════════
describe('formatTimer()', () => {

  it('formats 0 seconds as 00:00', () => {
    assertEqual(_formatTimer(0), '00:00');
  });

  it('formats 59 seconds as 00:59', () => {
    assertEqual(_formatTimer(59), '00:59');
  });

  it('formats 60 seconds as 01:00', () => {
    assertEqual(_formatTimer(60), '01:00');
  });

  it('formats 90 seconds as 01:30', () => {
    assertEqual(_formatTimer(90), '01:30');
  });

  it('formats 3600 seconds as 60:00', () => {
    assertEqual(_formatTimer(3600), '60:00');
  });

  it('formats 125 seconds as 02:05', () => {
    assertEqual(_formatTimer(125), '02:05');
  });

  it('zero-pads single-digit minutes', () => {
    assertEqual(_formatTimer(5 * 60 + 3), '05:03');
  });

  it('zero-pads single-digit seconds', () => {
    assertEqual(_formatTimer(10 * 60 + 7), '10:07');
  });

});


// ═════════════════════════════════════════════════════════════
// SUITE 20 — populateSavedSignin() localStorage path
// ═════════════════════════════════════════════════════════════
describe('populateSavedSignin() — localStorage logic', () => {

  function _readSavedCredentials() {
    const stored = localStorage.getItem('cooks_user');
    if (!stored) return null;
    try {
      const user = JSON.parse(stored);
      return { email: user.email, password: user.password };
    } catch {
      return null;
    }
  }

  it('returns null when nothing is stored', () => {
    localStorage.removeItem('cooks_user');
    assertEqual(_readSavedCredentials(), null);
  });

  it('returns email and password from stored user', () => {
    localStorage.setItem('cooks_user', JSON.stringify({ email: 'a@b.com', password: 'Pass1!' }));
    const creds = _readSavedCredentials();
    assertEqual(creds.email,    'a@b.com');
    assertEqual(creds.password, 'Pass1!');
    localStorage.removeItem('cooks_user');
  });

  it('returns null for malformed JSON', () => {
    localStorage.setItem('cooks_user', 'NOT_JSON');
    assertEqual(_readSavedCredentials(), null);
    localStorage.removeItem('cooks_user');
  });

  it('handles user object without password field gracefully', () => {
    localStorage.setItem('cooks_user', JSON.stringify({ email: 'a@b.com' }));
    const creds = _readSavedCredentials();
    assertEqual(creds.email, 'a@b.com');
    assertEqual(creds.password, undefined);
    localStorage.removeItem('cooks_user');
  });

});


// ─────────────────────────────────────────────────────────────
// Append to global TestResults so test-runner.html picks it up
// (unit-tests.js already set window.TestResults; we push to it)
// ─────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.TestResults = window.TestResults || [];
  // TestResults is already the live array used by describe/it above
}
