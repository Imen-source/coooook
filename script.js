/* ═══════════════════════════════════════════════════════════════
   COOK'S — COMPLETE APPLICATION LOGIC v10
   Features: Auth (signup/signin/google), trilingual (EN/FR/AR),
   Smart Fridge (6 shelves, voice/cam), Recipe Discovery (search,
   categories, match%), Recipe Detail (portions, missing ings,
   schedule), Guided Cooking (steps+timer), Meal Planner (7-day),
   Saved Collection, Community Feed, Profile, Custom Recipes
═══════════════════════════════════════════════════════════════ */

// ────────────────────────────────────────────────
// API UTILITY
// ────────────────────────────────────────────────
const API_URL = 'api';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}/${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'API Error');
    return result;
  } catch (err) {
    showToast(err.message);
    throw err;
  }
}

// ────────────────────────────────────────────────
// TRANSLATIONS — EN / FR / AR
// ────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    nav_home: 'Home', nav_fridge: 'Fridge', nav_recipes: 'Discover',
    nav_planner: 'Planner', nav_saved: 'Saved', nav_community: 'Community',
    hero_title: 'Where Tradition Meets Smart Cooking',
    hero_sub: 'Arabic heritage, international flavors, and AI guidance — all in one beautiful kitchen.',
    dash_fridge: 'Smart Fridge', dash_plan: "Today's Plan",
    dash_challenge: 'Daily Challenge', dash_saved: 'Saved Recipes',
    trending: '🔥 Trending', quote: '"Food is the thread that ties generations together." — North African Proverb',
    fridge_title: 'Smart Fridge', fridge_sub: 'Click the fridge door to open and manage your ingredients.',
    recipes_title: 'Discover Recipes', planner_title: 'Meal Planner',
    saved_title: 'Saved Collection', comm_title: 'Community',
  },
  fr: {
    nav_home: 'Accueil', nav_fridge: 'Réfrigérateur', nav_recipes: 'Découvrir',
    nav_planner: 'Planning', nav_saved: 'Sauvegardés', nav_community: 'Communauté',
    hero_title: 'Là Où la Tradition Rencontre la Cuisine Moderne',
    hero_sub: 'Héritage arabe, saveurs internationales et assistance IA — dans une belle cuisine.',
    dash_fridge: 'Réfrigérateur', dash_plan: "Plan d'aujourd'hui",
    dash_challenge: 'Défi Quotidien', dash_saved: 'Recettes sauvegardées',
    trending: '🔥 Tendances', quote: '"La nourriture est le lien entre les générations." — Proverbe Nord-Africain',
    fridge_title: 'Réfrigérateur Intelligent', fridge_sub: 'Cliquez sur le réfrigérateur pour gérer vos ingrédients.',
    recipes_title: 'Découvrir des Recettes', planner_title: 'Planificateur',
    saved_title: 'Collection Sauvegardée', comm_title: 'Communauté',
  },
  ar: {
    nav_home: 'الرئيسية', nav_fridge: 'الثلاجة', nav_recipes: 'اكتشف',
    nav_planner: 'المخطط', nav_saved: 'المحفوظة', nav_community: 'المجتمع',
    hero_title: 'حيث يلتقي التراث بالطهي الذكي',
    hero_sub: 'التراث العربي، النكهات العالمية، وإرشاد الذكاء الاصطناعي — في مطبخ واحد جميل.',
    dash_fridge: 'الثلاجة الذكية', dash_plan: 'خطة اليوم',
    dash_challenge: 'تحدي اليوم', dash_saved: 'الوصفات المحفوظة',
    trending: '🔥 الأكثر رواجاً', quote: '"الطعام هو الخيط الذي يربط الأجيال ببعضها." — مثل أفريقي',
    fridge_title: 'الثلاجة الذكية', fridge_sub: 'انقر على باب الثلاجة لإدارة مكوناتك.',
    recipes_title: 'اكتشف الوصفات', planner_title: 'مخطط الوجبات',
    saved_title: 'مجموعتي', comm_title: 'المجتمع',
  }
};
let currentLang = 'en';

// ────────────────────────────────────────────────
// RECIPE DATABASE
// ────────────────────────────────────────────────
const RECIPES_DB = [
  {
    id: 'r1', cat: 'arabic', name: 'Kabsa with Spiced Lamb', quick: false,
    img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    country: 'Saudi Arabia', flag: '🇸🇦', level: 'Intermediate', time: '1h 45m',
    basePortions: 4,
    story: 'The jewel of Arabian hospitality. Long-grain rice cooked with saffron, warm spices, and fall-off-the-bone tender lamb — a feast worthy of any celebration.',
    steps: [
      'Brown the lamb pieces in hot oil until golden on all sides.',
      'Add diced onions, garlic, and cook until softened.',
      'Toast cumin, cardamom, and saffron in the pan.',
      'Add tomatoes, broth, and simmer for 60 minutes.',
      'Add washed rice and cook covered for 25 minutes.',
      'Serve on a large platter garnished with raisins and nuts.',
    ],
    stepTimes: [300, 180, 120, 3600, 1500, 0],
    ingredients: [
      { id: 'lamb', name: 'Lamb Shoulder', qty: 1000, unit: 'g' },
      { id: 'rice', name: 'Basmati Rice', qty: 500, unit: 'g' },
      { id: 'onions', name: 'Onions', qty: 2, unit: 'pcs' },
      { id: 'saffron', name: 'Saffron', qty: 1, unit: 'tsp' },
      { id: 'cumin', name: 'Cumin', qty: 1, unit: 'tbsp' },
      { id: 'tomatoes', name: 'Tomatoes', qty: 2, unit: 'pcs' },
    ]
  },
  {
    id: 'r2', cat: 'maghreb', name: 'Tunisian Ojja', quick: true,
    img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    country: 'Tunisia', flag: '🇹🇳', level: 'Beginner', time: '25m',
    basePortions: 2,
    story: 'A fiery, fragrant shakshuka from Tunisia featuring spicy merguez sausage and harissa. The ultimate quick weeknight dinner.',
    steps: [
      'Pan-fry merguez until crispy on the outside.',
      'Add chopped peppers, onions and sauté.',
      'Stir in harissa paste and canned tomatoes.',
      'Crack eggs directly into the sauce.',
      'Cover and cook until whites are set but yolks are runny.',
      'Garnish with flat parsley and serve immediately.',
    ],
    stepTimes: [300, 180, 120, 0, 360, 0],
    ingredients: [
      { id: 'eggs', name: 'Eggs', qty: 4, unit: 'pcs' },
      { id: 'tomatoes', name: 'Tomatoes', qty: 3, unit: 'pcs' },
      { id: 'merguez', name: 'Merguez', qty: 4, unit: 'pcs' },
      { id: 'harissa', name: 'Harissa', qty: 2, unit: 'tbsp' },
      { id: 'peppers', name: 'Bell Peppers', qty: 1, unit: 'pcs' },
    ]
  },
  {
    id: 'r3', cat: 'levant', name: 'Classic Lebanese Tabbouleh', quick: true,
    img: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800&q=80',
    country: 'Lebanon', flag: '🇱🇧', level: 'Beginner', time: '20m',
    basePortions: 4,
    story: 'The soul of Lebanese Mezze. Herb-forward, lemony, and refreshing. Parsley is the star; everything else is a supporting act.',
    steps: [
      'Soak bulgur in cold water for 15 minutes then drain.',
      'Finely chop parsley, mint, and spring onions.',
      'Dice tomatoes into small cubes.',
      'Mix everything in a large bowl.',
      'Dress with lemon juice, olive oil, salt and pepper.',
      'Adjust seasoning and serve chilled.',
    ],
    stepTimes: [900, 300, 120, 60, 0, 0],
    ingredients: [
      { id: 'parsley', name: 'Fresh Parsley', qty: 3, unit: 'bunches' },
      { id: 'bulgur', name: 'Bulgur', qty: 100, unit: 'g' },
      { id: 'tomatoes', name: 'Tomatoes', qty: 3, unit: 'pcs' },
      { id: 'lemon', name: 'Lemon', qty: 2, unit: 'pcs' },
      { id: 'mint', name: 'Fresh Mint', qty: 1, unit: 'bunch' },
    ]
  },
  {
    id: 'r4', cat: 'arabic', name: 'Creamy Hummus Bil Lahma', quick: false,
    img: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=800&q=80',
    country: 'Palestine', flag: '🇵🇸', level: 'Intermediate', time: '40m',
    basePortions: 6,
    story: 'Ultra-silky hummus topped with spiced ground lamb and pine nuts. A Palestinian staple that turns a humble dip into a full, hearty meal.',
    steps: [
      'Cook chickpeas from dry (or use canned for speed).',
      'Blend chickpeas with tahini, lemon, garlic while still warm.',
      'Slowly add ice water while blending for 3 minutes until silky.',
      'Fry minced lamb with seven-spice blend until cooked through.',
      'Toast pine nuts in butter until golden.',
      'Spread hummus on a plate, top with lamb and pine nuts.',
    ],
    stepTimes: [0, 300, 180, 480, 120, 0],
    ingredients: [
      { id: 'chickpeas', name: 'Chickpeas', qty: 400, unit: 'g' },
      { id: 'tahini', name: 'Tahini', qty: 4, unit: 'tbsp' },
      { id: 'lamb', name: 'Ground Lamb', qty: 300, unit: 'g' },
      { id: 'lemon', name: 'Lemon', qty: 2, unit: 'pcs' },
      { id: 'garlic', name: 'Garlic', qty: 3, unit: 'cloves' },
    ]
  },
  {
    id: 'r5', cat: 'maghreb', name: 'Lamb & Preserved Lemon Tagine', quick: false,
    img: 'https://images.unsplash.com/photo-1497888329096-51c27beff665?w=800&q=80',
    country: 'Morocco', flag: '🇲🇦', level: 'Intermediate', time: '2h',
    basePortions: 4,
    story: 'Slow-braised in a conical clay pot, this Moroccan classic balances sweet saffron, earthy cumin, and the zingy acidity of preserved lemons.',
    steps: [
      'Marinate lamb with ras el hanout spice blend overnight.',
      'Sear marinated lamb in the tagine base until browned.',
      'Layer sliced onions, carrots, and olives.',
      'Add preserved lemon quarters and chicken broth.',
      'Cover and cook on low heat for 90 minutes.',
      'Garnish with fresh coriander and serve with couscous.',
    ],
    stepTimes: [0, 480, 300, 120, 5400, 0],
    ingredients: [
      { id: 'lamb', name: 'Lamb', qty: 800, unit: 'g' },
      { id: 'onions', name: 'Onions', qty: 2, unit: 'pcs' },
      { id: 'olives', name: 'Green Olives', qty: 100, unit: 'g' },
      { id: 'saffron', name: 'Saffron', qty: 1, unit: 'pinch' },
      { id: 'cumin', name: 'Cumin', qty: 2, unit: 'tsp' },
    ]
  },
  {
    id: 'r6', cat: 'world', name: 'Shakshuka Revisited', quick: true,
    img: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80',
    country: 'Israel', flag: '🇮🇱', level: 'Beginner', time: '25m',
    basePortions: 2,
    story: 'A global reinvention of a North African egg dish. Poached eggs in a spiced tomato-pepper stew. Simple, healthy, and devastatingly satisfying.',
    steps: [
      'Sauté onion and garlic in olive oil.',
      'Add red peppers and cook until softened.',
      'Stir in cumin, paprika, and canned tomatoes.',
      'Simmer sauce for 10 minutes until thickened.',
      'Create wells in the sauce and crack in eggs.',
      'Cover and cook until eggs are done to your liking.',
    ],
    stepTimes: [180, 300, 120, 600, 0, 300],
    ingredients: [
      { id: 'eggs', name: 'Eggs', qty: 4, unit: 'pcs' },
      { id: 'tomatoes', name: 'Tomatoes', qty: 400, unit: 'g' },
      { id: 'peppers', name: 'Red Peppers', qty: 2, unit: 'pcs' },
      { id: 'cumin', name: 'Cumin', qty: 1, unit: 'tsp' },
      { id: 'garlic', name: 'Garlic', qty: 3, unit: 'cloves' },
    ]
  }
];

// ────────────────────────────────────────────────
// INGREDIENTS DATABASE (for fridge suggestions)
// ────────────────────────────────────────────────
const INGS_DB = {
  protein: [
    { id: 'lamb',    name: 'Lamb',    emoji: '🥩', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300&q=80' },
    { id: 'beef',    name: 'Beef Slice', emoji: '🥩', img: 'https://images.unsplash.com/photo-1608344824338-782d8d8ce867?w=300&q=80' },
    { id: 'chicken', name: 'Chicken Fillet', emoji: '🍗', img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80' },
    { id: 'fish',    name: 'Fish Fillet', emoji: '🐟', img: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300&q=80' },
    { id: 'shrimp',  name: 'Single Shrimp', emoji: '🦐', img: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=300&q=80' },
    { id: 'eggs',    name: 'One Egg', emoji: '🥚', img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&q=80' },
  ],
  veg: [
    { id: 'onions',   name: 'One Onion', emoji: '🧅', img: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=300&q=80' },
    { id: 'tomatoes', name: 'One Tomato', emoji: '🍅', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&q=80' },
    { id: 'potato',   name: 'One Potato', emoji: '🥔', img: 'https://images.unsplash.com/photo-1518977676601-b53f02ac10dd?w=300&q=80' },
    { id: 'peppers',  name: 'One Bell Pepper', emoji: '🌶️', img: 'https://images.unsplash.com/photo-1563513330627-5994e6876f11?w=300&q=80' },
    { id: 'garlic',   name: 'Garlic Clove', emoji: '🧄', img: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=300&q=80' },
    { id: 'carrot',   name: 'One Carrot', emoji: '🥕', img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&q=80' },
  ],
  fruit: [
    { id: 'lemon',  name: 'One Lemon', emoji: '🍋', img: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=300&q=80' },
    { id: 'orange', name: 'One Orange', emoji: '🍊', img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=300&q=80' },
    { id: 'dates',  name: 'One Date', emoji: '🫐', img: 'https://images.unsplash.com/photo-1569350080814-928fc5863391?w=300&q=80' },
  ],
  spice: [
    { id: 'sumac',    name: 'Sumac Powder', emoji: '🏺', img: 'https://images.unsplash.com/photo-1591122119106-44473859bc06?w=300&q=80' },
    { id: 'zaatar',   name: 'Zaatar Mix', emoji: '🌿', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&q=80' },
    { id: 'tahini',   name: 'Tahini Paste', emoji: '🫙', img: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=300&q=80' },
  ],
  pantry: [
    { id: 'rice',      name: 'Basmati Rice', emoji: '🍚', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80' },
    { id: 'couscous',  name: 'Couscous Grains', emoji: '🍛', img: 'https://images.unsplash.com/photo-1541518763669-27f704fa1ad2?w=300&q=80' },
  ]
};

const catLabels = { protein: 'Proteins', veg: 'Vegetables', dairy: 'Dairy', fruit: 'Fruits', spice: 'Spices & Sauces', pantry: 'Pantry & Grains' };

// ────────────────────────────────────────────────
// APPLICATION STATE
// ────────────────────────────────────────────────
let currentUser   = null;
let fridge        = [];
let savedRecipes  = [];
let mealPlan      = {};
let customRecipes = []; // Local ones if any, otherwise from DB
let communityPosts= [];
let challenges    = [];

let activeRecipe  = null;
let portions      = 4;
let currentCat    = 'all';
let recipeSearch  = '';

// Guided cooking
let guidedSteps   = [];
let guidedStep    = 0;
let timerSeconds  = 0;
let timerInterval = null;

// ────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  applyTranslations();
  
  // Check auth status — try backend session first, fall back to localStorage
  try {
    const status = await apiRequest('auth.php?action=status');
    if (status.loggedIn) {
      bootApp(status.user);
    } else {
      const localUser = JSON.parse(localStorage.getItem('cooks_user'));
      if (localUser) bootApp(localUser);
      else document.getElementById('authOverlay').classList.remove('hidden');
    }
  } catch (err) {
    // No PHP server — use localStorage fallback
    const localUser = JSON.parse(localStorage.getItem('cooks_user'));
    if (localUser) bootApp(localUser);
    else document.getElementById('authOverlay').classList.remove('hidden');
  }

  // Nav click listeners
  document.querySelectorAll('.tnav').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Language
  document.querySelectorAll('.lbtn').forEach(btn => {
    btn.addEventListener('click', () => switchLang(btn.dataset.lang));
  });

  // Theme
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);

  // Category filters (Recipes)
  document.getElementById('catPills').addEventListener('click', e => {
    const cp = e.target.closest('.cp');
    if (!cp) return;
    document.querySelectorAll('.cp').forEach(x => x.classList.remove('active'));
    cp.classList.add('active');
    currentCat = cp.dataset.cat;
    renderRecipes();
  });

  // Recipe search live
  document.getElementById('recipeSearch').addEventListener('input', () => {
    recipeSearch = document.getElementById('recipeSearch').value.trim();
    renderRecipes();
  });

  // Initial data load (even before login)
  loadInitialData();
});

async function loadInitialData() {
  await fetchRecipes();
  renderAll();
}

function filterByCategory(cat) {
  currentCat = cat;
  // Update pills UI
  document.querySelectorAll('.cp').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  navigateTo('recipes');
  renderRecipes();
}

function bootApp(user) {
  currentUser = user;
  document.getElementById('authOverlay').classList.add('hidden');
  document.getElementById('topbar').classList.remove('hidden');
  
  const displayName = user.username || user.name || 'Chef';
  document.getElementById('upName').textContent = displayName;
  
  const chefSticker = document.getElementById('fridgeChefSticker');
  if (chefSticker) chefSticker.textContent = 'Chef ' + displayName;

  // Set a session cookie/token if mock
  if (user.isMock) {
    document.cookie = "is_guest=true; path=/";
  }

  loadAndRender();
  navigateTo('home');
}

async function loadAndRender() {
  // Try to load from backend; fall back to localStorage if no server
  await Promise.allSettled([
    fetchRecipes(),
    fetchFridge(),
    fetchCommunity(),
    fetchChallenges(),
    fetchMealPlan()
  ]);
  renderAll();
}

function browseAsGuest() {
  const guestUser = { username: 'Guest', name: 'Guest Chef', level: 'Guest', isMock: true };
  bootApp(guestUser);
  showToast('Welcome to Cook\'s! 🥘 (Guest Mode)');
}

async function fetchMealPlan() {
  try {
    const plan = await apiRequest('planner.php?action=list');
    mealPlan = plan;
  } catch (e) {
    mealPlan = JSON.parse(localStorage.getItem('cooks_plan') || '{}');
  }
}

async function fetchRecipes() {
  try {
    const recipes = await apiRequest(`recipes.php?action=list&category=${currentCat}&search=${recipeSearch}`);
    RECIPES_DB.length = 0;
    recipes.forEach(r => RECIPES_DB.push({
      ...r,
      id: r.id.toString(),
      name: r.title,
      img: r.image_url,
      time: r.prep_time,
      basePortions: r.servings || 4
    }));
  } catch (e) { /* keep built-in RECIPES_DB */ }
}

async function fetchFridge() {
  try {
    const items = await apiRequest('fridge.php?action=list');
    fridge = {};
    items.forEach(i => fridge[i.ingredient_name.toLowerCase()] = i);
  } catch (e) {
    fridge = JSON.parse(localStorage.getItem('cooks_fridge') || '{}');
  }
}

async function fetchCommunity() {
  try {
    communityPosts = await apiRequest('community.php?action=feed');
  } catch (e) {
    communityPosts = JSON.parse(localStorage.getItem('cooks_posts') || '[]');
  }
}

async function fetchChallenges() {
  try {
    challenges = await apiRequest('community.php?action=challenges');
  } catch (e) { challenges = []; }
}

function renderAll() {
  renderHome();
  renderFridgeSuggestions();
  renderFridgeShelves();
  renderFridgeDoorScreen();
  renderRecipes();
  renderPlanner();
  renderSaved();
  renderCommunity();
  renderProfile();
}

// ────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────
function navigateTo(pId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.tnav').forEach(b => b.classList.toggle('active', b.dataset.page === pId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ────────────────────────────────────────────────
// LANGUAGE
// ────────────────────────────────────────────────
function switchLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lbtn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  applyTranslations();
}

function applyTranslations() {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.innerHTML = t[key];
  });
}

// ────────────────────────────────────────────────
// THEME
// ────────────────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle('dark');
  const icon = document.querySelector('#themeBtn i');
  icon.className = document.body.classList.contains('dark') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// ────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────
function switchAuthTab(tab) {
  document.getElementById('tabSignin').classList.toggle('active', tab === 'signin');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('formSignin').classList.toggle('active', tab === 'signin');
  document.getElementById('formSignup').classList.toggle('active', tab === 'signup');
}

async function handleSignin(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;
  
  try {
    const res = await apiRequest('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    bootApp(res.user);
    showToast(`Welcome back, ${res.user.username}! 👋`);
  } catch (err) {}
}

async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('suName').value.trim();
  const email    = document.getElementById('suEmail').value.trim();
  const password = document.getElementById('suPass').value;
  const confirm  = document.getElementById('suConfirm').value;
  const agreed   = document.getElementById('agreePrivacy').checked;

  if (!username)       return showToast('Please enter a username');
  if (password !== confirm) return showToast('Passwords do not match ❌');
  if (!agreed)        return showToast('Please agree to the privacy terms');

  try {
    const res = await apiRequest('auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    bootApp(res.user);
    showToast('Account created successfully! 🎉');
  } catch (err) {}
}

function mockGoogleLogin() {
  const user = { username: 'GuestChef', name: 'Google Chef', level: 'Guest', joined: 'Today', isMock: true };
  localStorage.setItem('cooks_user', JSON.stringify(user));
  bootApp(user);
}

// ────────────────────────────────────────────────
// HOME
// ────────────────────────────────────────────────
function renderHome() {
  document.getElementById('homeFridgeCount').textContent = Object.keys(fridge).length;
  document.getElementById('homesSavedCount').textContent = savedRecipes.length;

  // Emoji mini preview
  const emEl = document.getElementById('homeEmojis');
  const allIngs = Object.values(INGS_DB).flat();
  const previews = Object.keys(fridge).slice(0,6).map(id => allIngs.find(i => i.id === id)?.emoji || '').filter(Boolean);
  emEl.textContent = previews.length ? previews.join(' ') : 'Add items →';

  // Today's plan
  const today = new Date().toISOString().split('T')[0];
  const plannedId = mealPlan[today];
  const planEl = document.getElementById('homeTodayPlan');
  if (plannedId) {
    const r = getAllRecipes().find(x => x.id === plannedId);
    if (r) planEl.innerHTML = `<span class="pw-recipe-tag">${r.name}</span>`;
  } else {
    planEl.innerHTML = `<span style="color:var(--muted)">Nothing planned — <a href="#" style="color:var(--gold); font-weight:800;" onclick="navigateTo('recipes')">pick a recipe?</a></span>`;
  }

  // Trending recipes
  const grid = document.getElementById('homeRecipeGrid');
  grid.innerHTML = '';
  const trending = RECIPES_DB.slice(0, 3);
  trending.forEach(r => grid.appendChild(createRecipeCard(r)));

  // Heritage Highlights (specifically from the 'arabic' category)
  const heritageGrid = document.getElementById('heritageRecipeGrid');
  if (heritageGrid) {
    heritageGrid.innerHTML = '';
    const heritage = RECIPES_DB.filter(r => r.cat === 'arabic').slice(0, 4);
    if (heritage.length === 0 && RECIPES_DB.length > 3) {
      // Fallback if no category 'arabic' found
      RECIPES_DB.slice(3, 7).forEach(r => heritageGrid.appendChild(createRecipeCard(r)));
    } else {
      heritage.forEach(r => heritageGrid.appendChild(createRecipeCard(r)));
    }
  }
}

function renderFridgeDoorScreen() {
  const missingArr = [];
  const today = new Date();
  const fridgeKeys = Object.keys(fridge);

  // Check next 7 days of plan
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const recipeId = mealPlan[dStr];
    if (recipeId) {
      const r = getAllRecipes().find(x => x.id === recipeId);
      if (r && r.ingredients) {
        r.ingredients.forEach(ing => {
          const name = (ing.id || ing.name).toLowerCase();
          if (!fridgeKeys.includes(name) && !missingArr.includes(ing.name)) {
            missingArr.push(ing.name);
          }
        });
      }
    }
  }

  const display = document.getElementById('doorMissingList');
  if (missingArr.length > 0) {
    // Show top 3 missing
    display.innerHTML = missingArr.slice(0, 3).map(m => `<span>• ${m}</span>`).join('');
  } else {
    display.textContent = 'Inventory Optimized';
  }
}

// ────────────────────────────────────────────────
// FRIDGE
// ────────────────────────────────────────────────
function toggleFridgeDoor() {
  document.getElementById('smartFridge').classList.toggle('open');
}

function renderFridgeShelves() {
  const allIngs = Object.values(INGS_DB).flat();
  const shelves = { protein: 'shelf-protein', veg: 'shelf-veg', dairy: 'shelf-dairy', fruit: 'shelf-fruit', spice: 'shelf-spice', pantry: 'shelf-pantry' };
  for (const [cat, shelfId] of Object.entries(shelves)) {
    const shelfEl = document.getElementById(shelfId);
    if (!shelfEl) continue;
    const itemsEl = shelfEl.querySelector('.shelf-items');
    if (!itemsEl) continue;
    itemsEl.innerHTML = '';
    const ingsInCat = INGS_DB[cat] || [];
    ingsInCat.forEach(ing => {
      if (!fridge[ing.id]) return;
      const chip = document.createElement('div');
      chip.className = 'ing-chip';
      chip.title = ing.name;
      chip.textContent = ing.emoji;
      chip.onclick = e => { e.stopPropagation(); removeIng(ing.id); };
      itemsEl.appendChild(chip);
    });
  }

  // Update analysis
  const count = Object.keys(fridge).length;
  document.getElementById('fIndexCount').textContent = count;
  const bestMatch = getBestMatchRecipe();
  document.getElementById('fBestMatch').textContent = bestMatch ? `${bestMatch.name} (${bestMatch.pct}%)` : '—';
}

function renderFridgeSuggestions(filter = '') {
  const box = document.getElementById('fridgeSuggestions');
  box.innerHTML = '';
  for (const [cat, ings] of Object.entries(INGS_DB)) {
    const available = ings.filter(i => !fridge[i.id] && (!filter || i.name.toLowerCase().includes(filter.toLowerCase())));
    if (!available.length) continue;
    const section = document.createElement('div');
    section.className = 'sug-cat-row';
    section.innerHTML = `<h4>${catLabels[cat]}</h4><div class="sug-pills">${available.map(i => `
      <button class="sug-pill with-img" onclick="addIng('${i.id}')">
        <img src="${i.img}" alt="${i.name}" />
        <span>${i.name}</span>
      </button>`).join('')}</div>`;
    box.appendChild(section);
  }
}

function filterFridgeSuggestions(val) { renderFridgeSuggestions(val); }

async function addIng(id) {
  const ingInfo = Object.values(INGS_DB).flat().find(i => i.id === id);
  if (fridge[id]) return;
  // Update UI instantly for snappiness
  fridge[id] = { ingredient_name: id, category: ingInfo?.cat || 'General' };
  renderFridgeShelves();
  renderFridgeSuggestions();
  renderAll(); // Updates recipe match score
  
  try {
    const res = await apiRequest('fridge.php?action=add', {
      method: 'POST',
      body: JSON.stringify({ name: id, category: ingInfo?.cat || 'General' })
    });
    fridge[id].id = res.id;
  } catch (err) {
    localStorage.setItem('cooks_fridge', JSON.stringify(fridge));
  }
}

async function removeIng(id) {
  const item = fridge[id];
  if (!item) return;
  
  delete fridge[id];
  renderFridgeShelves();
  renderFridgeSuggestions();
  renderAll();
  
  try {
    if (item.id) {
      await apiRequest('fridge.php?action=remove', {
        method: 'POST',
        body: JSON.stringify({ id: item.id })
      });
    }
  } catch (err) {
    localStorage.setItem('cooks_fridge', JSON.stringify(fridge));
  }
}

async function updateFridgeState() {
  await fetchFridge();
  renderFridgeShelves();
  renderFridgeSuggestions();
  renderAll();
  renderHome();
  renderRecipes();
}

function getBestMatchRecipe() {
  let best = null, bestPct = 0;
  RECIPES_DB.forEach(r => {
    const pct = getMatchPct(r);
    if (pct > bestPct) { bestPct = pct; best = { ...r, pct }; }
  });
  return best;
}

function getMatchPct(r) {
  if (!fridge || Array.isArray(fridge)) return 0; // Guard against empty/unloaded fridge
  const have = r.ingredients.filter(i => fridge[i.id]).length;
  return Math.round((have / r.ingredients.length) * 100);
}

// ────────────────────────────────────────────────
// RECIPES
// ────────────────────────────────────────────────
function getAllRecipes() { return [...RECIPES_DB, ...customRecipes]; }

function renderRecipes() {
  const grid = document.getElementById('recipeGrid');
  grid.innerHTML = '';
  const all = getAllRecipes();
  const filtered = all.filter(r => {
    const catMatch = currentCat === 'all' || r.cat === currentCat || (currentCat === 'quick' && r.quick);
    const searchMatch = !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase()) || r.ingredients.some(i => i.name.toLowerCase().includes(recipeSearch.toLowerCase()));
    return catMatch && searchMatch;
  });
  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bowl-rice"></i><p>No recipes found. Try a different search or category.</p></div>';
    return;
  }
  filtered.forEach(r => grid.appendChild(createRecipeCard(r)));
}

function createRecipeCard(r) {
  const pct   = getMatchPct(r);
  const isSaved = savedRecipes.includes(r.id);
  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.innerHTML = `
    <div class="rc-img-box" onclick="openRecipeModal('${r.id}')">
      <img src="${r.img}" alt="${r.name}" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?w=800';"/>
      <div class="rc-match-badge">${pct}% Match</div>
    </div>
    <div class="rc-body" onclick="openRecipeModal('${r.id}')">
      <h3>${r.name}</h3>
      <p class="rc-meta">${r.flag || '🫒'} ${r.level} • ${r.time}</p>
    </div>
    <div class="rc-actions">
      <small style="color:var(--muted); font-weight:700;">${pct === 100 ? '✅ Can Make Now!' : pct > 60 ? '🟡 Almost there' : '🔴 Missing ingredients'}</small>
      <button class="rc-save-btn ${isSaved ? 'saved' : ''}" onclick="toggleQuickSave('${r.id}', this)" title="${isSaved?'Unsave':'Save'}"><i class="fa-${isSaved?'solid':'regular'} fa-bookmark"></i></button>
    </div>
  `;
  return card;
}

function toggleQuickSave(id, btn) {
  if (savedRecipes.includes(id)) {
    savedRecipes = savedRecipes.filter(x => x !== id);
    btn.classList.remove('saved');
    btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
  } else {
    savedRecipes.push(id);
    btn.classList.add('saved');
    btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
  }
  localStorage.setItem('cooks_saved', JSON.stringify(savedRecipes));
  renderSaved();
  renderHome();
}

// ────────────────────────────────────────────────
// RECIPE MODAL
// ────────────────────────────────────────────────
function openRecipeModal(id) {
  activeRecipe = getAllRecipes().find(x => x.id === id);
  if (!activeRecipe) return;
  portions = activeRecipe.basePortions;

  document.getElementById('mTitle').textContent       = activeRecipe.name;
  document.getElementById('mFlag').textContent        = activeRecipe.flag || '🫒';
  document.getElementById('mCountry').textContent     = activeRecipe.country || 'Global';
  document.getElementById('mLevelBadge').textContent  = activeRecipe.level;
  document.getElementById('mTimeBadge').textContent   = activeRecipe.time;
  document.getElementById('mStory').textContent       = activeRecipe.story;
  document.getElementById('mHeroBanner').style.backgroundImage = `url('${activeRecipe.img}')`;

  const isSaved = savedRecipes.includes(activeRecipe.id);
  const sb = document.getElementById('mSaveBtn');
  sb.innerHTML = `<i class="fa-${isSaved?'solid':'regular'} fa-bookmark"></i> ${isSaved ? 'Saved!' : 'Save to Collection'}`;
  sb.className = `save-toggle-btn ${isSaved ? 'saved' : ''}`;

  renderModalIngredients();
  document.getElementById('recipeModal').classList.add('open');
}

function renderModalIngredients() {
  const factor = portions / activeRecipe.basePortions;
  let missing = 0;
  document.getElementById('mIngList').innerHTML = activeRecipe.ingredients.map(i => {
    const have = !!fridge[i.id];
    if (!have) missing++;
    const qty = (i.qty * factor).toFixed(i.qty * factor < 10 ? 1 : 0);
    return `<li class="m-ing-item ${have ? 'have' : 'missing'}">
      <span>${have ? '✅' : '❌'} ${i.name}</span>
      <span>${qty} ${i.unit}</span>
    </li>`;
  }).join('');
  document.getElementById('mPortCount').textContent = portions;
  const mb = document.getElementById('mMissingBadge');
  mb.textContent = `${missing} missing`;
  mb.style.display = missing > 0 ? 'inline-flex' : 'none';
}

function modPort(d) { portions = Math.max(1, portions + d); renderModalIngredients(); }

function toggleSaveRecipe() {
  if (!activeRecipe) return;
  const id = activeRecipe.id;
  const isSaved = savedRecipes.includes(id);
  if (isSaved) savedRecipes = savedRecipes.filter(x => x !== id);
  else savedRecipes.push(id);
  localStorage.setItem('cooks_saved', JSON.stringify(savedRecipes));
  renderModalIngredients(); // refresh
  const sb = document.getElementById('mSaveBtn');
  const nowSaved = savedRecipes.includes(id);
  sb.innerHTML = `<i class="fa-${nowSaved?'solid':'regular'} fa-bookmark"></i> ${nowSaved ? 'Saved!' : 'Save to Collection'}`;
  sb.className = `save-toggle-btn ${nowSaved ? 'saved' : ''}`;
  renderSaved(); renderHome();
  showToast(nowSaved ? 'Saved to Collection 📚' : 'Removed from Collection');
}

async function scheduleRecipe() {
  const date = document.getElementById('mPlanDate').value;
  if (!date || !activeRecipe) return showToast('Please pick a date first!');
  
  try {
    await apiRequest('planner.php?action=save', {
      method: 'POST',
      body: JSON.stringify({ date, recipe_id: activeRecipe.id })
    });
    mealPlan[date] = activeRecipe.id;
    renderPlanner(); 
    renderHome();
    renderFridgeDoorScreen();
    showToast('Recipe scheduled! 📅');
  } catch (err) {}
}

// ────────────────────────────────────────────────
// GUIDED COOKING
// ────────────────────────────────────────────────
function launchGuidedCooking() {
  if (!activeRecipe) return;
  guidedSteps = activeRecipe.steps || ['Cook and enjoy!'];
  guidedStep  = 0;
  document.getElementById('guidedTitle').textContent = activeRecipe.name;
  renderGuidedStep();
  closeModal('recipeModal');
  document.getElementById('guidedModal').classList.add('open');
}

function renderGuidedStep() {
  const total = guidedSteps.length;
  const pct   = ((guidedStep + 1) / total) * 100;
  document.getElementById('guidedFill').style.width     = pct + '%';
  document.getElementById('guidedStepNum').textContent  = guidedStep + 1;
  document.getElementById('guidedStepTotal').textContent= total;
  document.getElementById('guidedStepText').textContent = guidedSteps[guidedStep];
  // Preset timer for this step
  const secs = activeRecipe.stepTimes?.[guidedStep] ?? 0;
  timerSeconds = secs;
  clearInterval(timerInterval);
  renderTimer();
}

function guidedNext() { if (guidedStep < guidedSteps.length - 1) { clearInterval(timerInterval); guidedStep++; renderGuidedStep(); } else { closeModal('guidedModal'); showToast('Cooking complete! Bon appétit! 🎉'); } }
function guidedPrev() { if (guidedStep > 0) { clearInterval(timerInterval); guidedStep--; renderGuidedStep(); } }

function startTimer() { if (timerInterval || timerSeconds <= 0) return; timerInterval = setInterval(() => { timerSeconds--; renderTimer(); if (timerSeconds <= 0) { clearInterval(timerInterval); timerInterval = null; showToast("⏱️ Timer done!"); } }, 1000); }
function pauseTimer() { clearInterval(timerInterval); timerInterval = null; }
function resetTimer() { pauseTimer(); timerSeconds = activeRecipe.stepTimes?.[guidedStep] ?? 0; renderTimer(); }
function renderTimer() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('guidedTimer').textContent = `${m}:${s}`;
}

// ────────────────────────────────────────────────
// PLANNER
// ────────────────────────────────────────────────
function renderPlanner() {
  const cal = document.getElementById('plannerWeek');
  cal.innerHTML = '';
  const today = new Date();
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(today.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const div = document.createElement('div');
    div.className = `pw-day${isToday ? ' today' : ''}`;
    const r = mealPlan[dStr] ? getAllRecipes().find(x => x.id === mealPlan[dStr]) : null;
    div.innerHTML = `
      <div class="pw-day-label">${dayNames[d.getDay()]} <small>${d.getDate()}/${d.getMonth()+1}</small></div>
      ${r ? `<div class="pw-recipe-tag" onclick="openRecipeModal('${r.id}')">${r.name}</div><button style="font-size:0.7rem; background:none; border:none; color:var(--muted); cursor:pointer; margin-top:auto;" onclick="unplanDay('${dStr}')">Remove</button>` : `<p class="pw-empty">No recipe planned</p>`}
    `;
    cal.appendChild(div);
  }
}

async function unplanDay(date) {
  try {
    await apiRequest('planner.php?action=remove', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
    delete mealPlan[date];
    renderPlanner(); 
    renderHome();
    renderFridgeDoorScreen();
    showToast('Plan removed.');
  } catch (err) {}
}

// ────────────────────────────────────────────────
// SAVED
// ────────────────────────────────────────────────
function renderSaved() {
  const grid = document.getElementById('savedGrid');
  const all  = getAllRecipes().filter(r => savedRecipes.includes(r.id));
  if (!all.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fa-regular fa-bookmark"></i><p>No saved recipes yet. Tap the bookmark icon on any recipe!</p></div>';
    return;
  }
  grid.innerHTML = '';
  all.forEach(r => grid.appendChild(createRecipeCard(r)));
}

// ────────────────────────────────────────────────
// COMMUNITY
// ────────────────────────────────────────────────
async function createPost() {
  const text = document.getElementById('postText').value.trim();
  if (!text) return showToast('Write something first!');
  
  try {
    await apiRequest('community.php?action=post', {
      method: 'POST',
      body: JSON.stringify({ content: text })
    });
    document.getElementById('postText').value = '';
    showToast('Posted! 🎉');
    await fetchCommunity();
    renderCommunity();
  } catch (err) {}
}

// Community data now handled by backend

function renderCommunity() {
  const feed = document.getElementById('commFeed');
  if (!communityPosts.length) {
    feed.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px;">No posts yet. Be the first!</p>';
    return;
  }
  feed.innerHTML = communityPosts.map((p, i) => `
    <div class="comm-post-card">
      <div style="display:flex; gap:14px; align-items:center; margin-bottom:14px;">
        <div class="up-avatar sm">${p.user_avatar || '👨‍🍳'}</div>
        <div>
          <strong style="font-size:0.9rem;">${p.username}</strong>
          <div style="font-size:0.75rem; color:var(--muted);">${p.created_at}</div>
        </div>
        <div style="margin-left:auto; font-size:0.8rem; color:var(--muted);">❤️ ${p.likes_count}</div>
      </div>
      <p style="line-height:1.7;">${p.content}</p>
      <div style="display:flex; gap:10px; margin-top:14px;">
        <button style="background:none; border:none; color:var(--muted); font-size:0.85rem; font-weight:800; cursor:pointer;">👍 Like</button>
      </div>
    </div>
  `).join('');
}

function likePost(i) { communityPosts[i].likes++; savePosts(); renderCommunity(); }

// ────────────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────────────
function renderProfile() {
  const el = document.getElementById('profileDetail');
  const u  = currentUser || { name: 'Chef', level: 'Beginner', joined: 'Today' };
  el.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">👨‍🍳</div>
      <div>
        <h2>${u.name}</h2>
        <p>Level: ${u.level}</p>
        <p>Member since: ${u.joined}</p>
      </div>
    </div>
    <div class="profile-stats">
      <div class="p-stat"><strong>${savedRecipes.length}</strong><span>Saved Recipes</span></div>
      <div class="p-stat"><strong>${Object.keys(fridge).length}</strong><span>Fridge Items</span></div>
      <div class="p-stat"><strong>${communityPosts.filter(p => p.author === u.name).length}</strong><span>Posts</span></div>
    </div>
    <div class="section-header">
      <h2>My Saved Recipes</h2>
    </div>
    <div class="recipe-grid">${getAllRecipes().filter(r => savedRecipes.includes(r.id)).map(r => `<div class="recipe-card" onclick="openRecipeModal('${r.id}');navigateTo('home');"><div class="rc-img-box"><img src="${r.img}" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?w=800';"/></div><div class="rc-body"><h3>${r.name}</h3><p class="rc-meta">${r.level} • ${r.time}</p></div></div>`).join('') || '<div class="empty-state"><i class="fa-regular fa-bookmark"></i><p>No saved recipes yet.</p></div>'}</div>
    <button class="btn-outline" style="margin-top:30px;" onclick="logout()"><i class="fa-solid fa-door-open"></i> Sign Out</button>
  `;
}

async function logout() {
  await apiRequest('auth.php?action=logout');
  location.reload();
}

// ────────────────────────────────────────────────
// ADD CUSTOM RECIPE
// ────────────────────────────────────────────────
function openAddRecipeModal()  { document.getElementById('addRecipeModal').classList.add('open'); }
function closeAddRecipeModal() { closeModal('addRecipeModal'); }

document.getElementById('addRecipeForm')?.addEventListener('submit', saveCustomRecipe);
function saveCustomRecipe(e) {
  e.preventDefault();
  const name    = document.getElementById('arName').value.trim();
  const country = document.getElementById('arCountry').value.trim();
  const cat     = document.getElementById('arCat').value;
  const ingsRaw = document.getElementById('arIngs').value;
  const time    = document.getElementById('arTime').value || '?';
  const level   = document.getElementById('arLevel').value;

  const ingredients = ingsRaw.split(',').map(s => ({
    id: s.trim().toLowerCase().replace(/\s+/g,'_'), name: s.trim(), qty: 100, unit: 'g'
  }));
  const nr = {
    id: 'custom_' + Date.now(), cat, name, country,
    flag: '🫒', level, time, quick: time.includes('m') && parseInt(time) <= 30,
    basePortions: 4, img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
    story: `A personal creation by ${currentUser?.name}.\nFrom ${country || 'your kitchen'}.`,
    steps: ['Prepare all ingredients.', 'Cook according to your knowledge.', 'Plate and enjoy!'],
    stepTimes: [300, 600, 0],
    ingredients
  };
  customRecipes.push(nr);
  localStorage.setItem('cooks_custom', JSON.stringify(customRecipes));
  renderRecipes(); renderSaved(); renderProfile();
  closeModal('addRecipeModal');
  document.getElementById('addRecipeForm').reset();
  showToast('Recipe saved! 📖');
}

// ────────────────────────────────────────────────
// MODAL HELPERS
// ────────────────────────────────────────────────
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function closeRecipeModal() { closeModal('recipeModal'); }

// Close overlay on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    clearInterval(timerInterval); timerInterval = null;
  }
});

// ────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
