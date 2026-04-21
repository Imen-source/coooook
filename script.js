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
    comm_feed: 'Feed', comm_challenges: 'Challenges',
    comm_one_per_day: 'One challenge per day — complete it to grow your streak 🔥',
    comm_write_placeholder: 'Share a recipe, ask a question, or post your creation...',
    comm_photo: 'Photo', comm_post: 'Post',
    comm_write_first: 'Write something first!', comm_posted: 'Posted! 🎉',
    comm_tag_creation: 'My Creation', comm_tag_question: 'Question',
    comm_tag_recipe: 'Recipe Share', comm_tag_challenge: 'Challenge Result',
    comm_unlock_tooltip: 'Complete challenges to unlock',
    comm_guess_dish: 'Guess the Dish 🖼️', comm_missing_ing: 'Missing Ingredient ❓', comm_true_false: 'True or False 💡',
    comm_already_played: "⏳ Already played today — come back tomorrow!",
    comm_correct: '✅ Correct! +1 streak 🔥 Come back tomorrow',
    comm_wrong: '❌ Not quite! Try again tomorrow',
    comm_streak_days: 'day streak', comm_unlock_at: 'Unlock at streak',
    comm_unlocked: '✅ Unlocked!', comm_streak_motivation: 'Complete one challenge daily to keep your streak alive!',
    comm_streak_banner: "🔥 You're on a {n} day streak! Keep it up!",
    comm_cook_week: 'Cook of the Week', comm_difficulty_easy: 'Easy', comm_difficulty_medium: 'Medium',
    prof_bio: 'Arabic food lover 🍳 cooking my heritage one dish at a time',
    prof_followers: 'Followers', prof_following: 'Following', prof_recipes: 'Recipes',
    prof_activity: '🗓️ Your Cooking Activity — Last 28 Days',
    prof_no_activity: 'No activity', prof_challenge_done: 'Challenge completed',
    prof_level_beginner: 'Beginner Cook 🌱', prof_level_home: 'Home Chef 🍳',
    prof_level_skilled: 'Skilled Cook ⭐', prof_level_master: 'Master Chef 👑',
    prof_keep_cooking: 'Keep cooking to reach the next level!',
    prof_badges_title: '🏅 My Badges',
    prof_badge_first: 'First Steps 🥄', prof_badge_streak3: '3 Day Streak 🔥',
    prof_badge_week: 'Week Warrior ⚡', prof_badge_master: 'Master Streak 👑',
    prof_cook_more: 'Cook {x} more days to unlock',
    prof_personality_chef: 'The Dedicated Chef 🔥', prof_personality_sharer: 'The Sharer 📢',
    prof_personality_collector: 'The Collector 📚', prof_personality_rising: 'The Rising Star 🌱',
    prof_streak_warning: "⚠️ You haven't played today's challenge yet — protect your streak!",
    prof_play_now: 'Play Now →',
    prof_stat_challenges: 'Challenges Completed', prof_stat_streak: 'Current Streak',
    prof_stat_posts: 'Posts Made', prof_stat_saved: 'Saved Recipes',
    prof_saved_title: 'My Saved Recipes', prof_signout: 'Sign Out',
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
    comm_feed: 'Fil', comm_challenges: 'Défis',
    comm_one_per_day: 'Un défi par jour — complétez-le pour augmenter votre série 🔥',
    comm_write_placeholder: 'Partagez une recette, posez une question ou publiez votre création...',
    comm_photo: 'Photo', comm_post: 'Publier',
    comm_write_first: 'Écrivez quelque chose d\'abord!', comm_posted: 'Publié! 🎉',
    comm_tag_creation: 'Ma Création', comm_tag_question: 'Question',
    comm_tag_recipe: 'Partage de Recette', comm_tag_challenge: 'Résultat de Défi',
    comm_unlock_tooltip: 'Complétez des défis pour débloquer',
    comm_guess_dish: 'Devinez le Plat 🖼️', comm_missing_ing: 'Ingrédient Manquant ❓', comm_true_false: 'Vrai ou Faux 💡',
    comm_already_played: '⏳ Déjà joué aujourd\'hui — revenez demain!',
    comm_correct: '✅ Correct! +1 série 🔥 Revenez demain',
    comm_wrong: '❌ Pas tout à fait! Réessayez demain',
    comm_streak_days: 'jours de série', comm_unlock_at: 'Débloquer à la série',
    comm_unlocked: '✅ Débloqué!', comm_streak_motivation: 'Complétez un défi quotidien pour maintenir votre série!',
    comm_streak_banner: '🔥 Vous êtes sur une série de {n} jours! Continuez!',
    comm_cook_week: 'Chef de la Semaine', comm_difficulty_easy: 'Facile', comm_difficulty_medium: 'Moyen',
    prof_bio: 'Amateur de cuisine arabe 🍳 cuisinant mon héritage un plat à la fois',
    prof_followers: 'Abonnés', prof_following: 'Abonnements', prof_recipes: 'Recettes',
    prof_activity: '🗓️ Votre Activité de Cuisine — 28 Derniers Jours',
    prof_no_activity: 'Aucune activité', prof_challenge_done: 'Défi complété',
    prof_level_beginner: 'Cuisinier Débutant 🌱', prof_level_home: 'Chef à la Maison 🍳',
    prof_level_skilled: 'Cuisinier Qualifié ⭐', prof_level_master: 'Chef Maître 👑',
    prof_keep_cooking: 'Continuez à cuisiner pour atteindre le niveau suivant!',
    prof_badges_title: '🏅 Mes Badges',
    prof_badge_first: 'Premiers Pas 🥄', prof_badge_streak3: 'Série de 3 Jours 🔥',
    prof_badge_week: 'Guerrier de la Semaine ⚡', prof_badge_master: 'Série Maître 👑',
    prof_cook_more: 'Cuisinez encore {x} jours pour débloquer',
    prof_personality_chef: 'Le Chef Dévoué 🔥', prof_personality_sharer: 'Le Partageur 📢',
    prof_personality_collector: 'Le Collectionneur 📚', prof_personality_rising: "L'Étoile Montante 🌱",
    prof_streak_warning: "⚠️ Vous n'avez pas encore joué le défi d'aujourd'hui — protégez votre série!",
    prof_play_now: 'Jouer Maintenant →',
    prof_stat_challenges: 'Défis Complétés', prof_stat_streak: 'Série Actuelle',
    prof_stat_posts: 'Publications', prof_stat_saved: 'Recettes Sauvegardées',
    prof_saved_title: 'Mes Recettes Sauvegardées', prof_signout: 'Se Déconnecter',
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
    comm_feed: 'المنشورات', comm_challenges: 'التحديات',
    comm_one_per_day: 'تحدٍّ واحد يومياً — أكمله لزيادة سلسلتك 🔥',
    comm_write_placeholder: 'شارك وصفة، اطرح سؤالاً، أو انشر إبداعك...',
    comm_photo: 'صورة', comm_post: 'نشر',
    comm_write_first: 'اكتب شيئاً أولاً!', comm_posted: 'تم النشر! 🎉',
    comm_tag_creation: 'إبداعي', comm_tag_question: 'سؤال',
    comm_tag_recipe: 'مشاركة وصفة', comm_tag_challenge: 'نتيجة تحدٍّ',
    comm_unlock_tooltip: 'أكمل التحديات لفتح هذا',
    comm_guess_dish: 'خمّن الطبق 🖼️', comm_missing_ing: 'المكوّن المفقود ❓', comm_true_false: 'صح أم خطأ 💡',
    comm_already_played: '⏳ لعبت اليوم بالفعل — عد غداً!',
    comm_correct: '✅ صحيح! +1 سلسلة 🔥 عد غداً',
    comm_wrong: '❌ ليس تماماً! حاول غداً',
    comm_streak_days: 'أيام متتالية', comm_unlock_at: 'افتح عند السلسلة',
    comm_unlocked: '✅ مفتوح!', comm_streak_motivation: 'أكمل تحدياً يومياً للحفاظ على سلسلتك!',
    comm_streak_banner: '🔥 أنت في سلسلة {n} أيام! استمر!',
    comm_cook_week: 'طاهي الأسبوع', comm_difficulty_easy: 'سهل', comm_difficulty_medium: 'متوسط',
    prof_bio: 'عاشق للطبخ العربي 🍳 أطبخ تراثي طبقاً تلو الآخر',
    prof_followers: 'المتابعون', prof_following: 'المتابَعون', prof_recipes: 'الوصفات',
    prof_activity: '🗓️ نشاطك في الطبخ — آخر 28 يوماً',
    prof_no_activity: 'لا نشاط', prof_challenge_done: 'تحدٍّ مكتمل',
    prof_level_beginner: 'طاهي مبتدئ 🌱', prof_level_home: 'شيف المنزل 🍳',
    prof_level_skilled: 'طاهي ماهر ⭐', prof_level_master: 'الشيف الأستاذ 👑',
    prof_keep_cooking: 'واصل الطبخ للوصول إلى المستوى التالي!',
    prof_badges_title: '🏅 شاراتي',
    prof_badge_first: 'الخطوات الأولى 🥄', prof_badge_streak3: 'سلسلة 3 أيام 🔥',
    prof_badge_week: 'محارب الأسبوع ⚡', prof_badge_master: 'سلسلة الأستاذ 👑',
    prof_cook_more: 'اطبخ {x} أيام أخرى لفتح',
    prof_personality_chef: 'الشيف المتفاني 🔥', prof_personality_sharer: 'المشارك 📢',
    prof_personality_collector: 'المجمّع 📚', prof_personality_rising: 'النجم الصاعد 🌱',
    prof_streak_warning: '⚠️ لم تلعب تحدي اليوم بعد — احمِ سلسلتك!',
    prof_play_now: 'العب الآن →',
    prof_stat_challenges: 'التحديات المكتملة', prof_stat_streak: 'السلسلة الحالية',
    prof_stat_posts: 'المنشورات', prof_stat_saved: 'الوصفات المحفوظة',
    prof_saved_title: 'وصفاتي المحفوظة', prof_signout: 'تسجيل الخروج',
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
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();

  // localStorage-based auth: restore session on page load
  const loggedIn  = localStorage.getItem('cooks_logged_in') === 'true';
  const savedUser = localStorage.getItem('cooks_user');
  if (loggedIn && savedUser) {
    bootApp(JSON.parse(savedUser));
  } else {
    document.getElementById('authOverlay').classList.remove('hidden');
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
  history.replaceState({ page: 'home' }, '', '#home');
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
  history.pushState({ page: pId }, '', '#' + pId);
}

window.addEventListener('popstate', function(e) {
  if (e.state && e.state.page) { navigateTo(e.state.page); }
});

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

function handleSignin(e) {
  e.preventDefault();
  const form     = e.target;
  const email    = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  function showSigninError(msg) {
    let err = form.querySelector('.auth-inline-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'auth-inline-error';
      err.style.cssText = 'color:#e53e3e;font-size:0.8rem;margin-top:8px;';
      form.querySelector('button[type="submit"]').before(err);
    }
    err.textContent = msg;
  }

  form.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
    const err = form.querySelector('.auth-inline-error');
    if (err) err.remove();
  }, { once: true }));

  const stored = localStorage.getItem('cooks_user');
  if (!stored) { showSigninError('Invalid email or password'); return; }
  const user = JSON.parse(stored);
  if (user.email !== email || user.password !== password) {
    showSigninError('Invalid email or password');
    return;
  }

  localStorage.setItem('cooks_logged_in', 'true');
  bootApp(user);
  showToast(`Welcome back, ${user.name}! 👨‍🍳`);
}

function handleSignup(e) {
  e.preventDefault();
  const form     = e.target;
  const name     = document.getElementById('suName').value.trim();
  const email    = document.getElementById('suEmail').value.trim();
  const password = document.getElementById('suPass').value;
  const confirm  = document.getElementById('suConfirm').value;
  const agreed   = document.getElementById('agreePrivacy').checked;

  function showSignupError(msg) {
    let err = form.querySelector('.auth-inline-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'auth-inline-error';
      err.style.cssText = 'color:#e53e3e;font-size:0.8rem;margin-top:8px;';
      form.querySelector('button[type="submit"]').before(err);
    }
    err.textContent = msg;
  }

  form.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
    const err = form.querySelector('.auth-inline-error');
    if (err) err.remove();
  }, { once: true }));

  if (!name || !email || !password || !confirm) { showSignupError('Please fill all fields'); return; }
  if (password !== confirm)                      { showSignupError('Passwords do not match'); return; }
  if (!email.includes('@'))                      { showSignupError('Please enter a valid email'); return; }
  if (!agreed)                                   { showSignupError('Please agree to the privacy policy'); return; }

  const user = { name, email, password, joined: new Date().toLocaleDateString() };
  localStorage.setItem('cooks_user', JSON.stringify(user));
  localStorage.setItem('cooks_logged_in', 'true');
  bootApp(user);
  showToast(`Welcome to Cook's, ${name}! 🍳`);
}

function mockGoogleLogin() {
  showToast('Google login coming soon! 🚀 Please use email sign in for now.');
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
function createPost() {
  const T        = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const textarea = document.getElementById('postText');
  const statusEl = document.getElementById('postStatusMsg');
  const text     = textarea.value.trim();

  if (!text) {
    statusEl.textContent  = T.comm_write_first;
    statusEl.style.color  = '#e53935';
    statusEl.style.display = 'block';
    return;
  }

  const imgData = window._pendingPostImage || null;
  const newPost = {
    postId:   'user_' + Date.now(),
    username: (typeof currentUser !== 'undefined' && currentUser?.name) || 'You',
    caption:  text,
    time:     'Just now',
    likes:    0,
    isOwn:    true,
    postType: imgData ? 'photo' : 'text',
    ...(imgData ? { image: imgData } : {}),
  };

  const userPosts = JSON.parse(localStorage.getItem('community_user_posts') || '[]');
  userPosts.unshift(newPost);
  localStorage.setItem('community_user_posts', JSON.stringify(userPosts));

  textarea.value = '';
  window._pendingPostImage = null;
  const preview = document.getElementById('postImgPreview');
  if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }

  statusEl.textContent   = T.comm_posted;
  statusEl.style.color   = '#2e7d32';
  statusEl.style.display = 'block';
  setTimeout(() => { statusEl.style.display = 'none'; }, 2000);

  renderCommunity();
}

function triggerPhotoUpload() {
  document.getElementById('photoFileInput').click();
}

function handlePhotoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    window._pendingPostImage = e.target.result;
    const preview = document.getElementById('postImgPreview');
    preview.style.display = 'block';
    preview.innerHTML = `<div style="position:relative;display:inline-block;"><img src="${e.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;" /><button onclick="removePostPhoto()" style="position:absolute;top:-6px;right:-6px;background:#e53935;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;line-height:20px;text-align:center;">✕</button></div>`;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function removePostPhoto() {
  window._pendingPostImage = null;
  const preview = document.getElementById('postImgPreview');
  preview.innerHTML = '';
  preview.style.display = 'none';
}

// Community data now handled by backend

const REACTION_FREE   = ['❤️', '👏', '🔥'];
const REACTION_LOCKED = ['🫕', '🧆', '🥙'];

function getUnlockedReactions(streak) {
  const out = [];
  if (streak >= 3)  out.push('🫕');
  if (streak >= 7)  out.push('🧆');
  if (streak >= 14) out.push('🥙');
  return out;
}

function getPostReactions(postId) {
  const all = JSON.parse(localStorage.getItem('cooks_reactions') || '{}');
  return all[String(postId)] || {};
}

function handleReaction(postId, emoji) {
  const all = JSON.parse(localStorage.getItem('cooks_reactions') || '{}');
  const key = String(postId);
  if (!all[key]) all[key] = {};
  all[key][emoji] = (all[key][emoji] || 0) + 1;
  localStorage.setItem('cooks_reactions', JSON.stringify(all));
  renderCommunity();
}

function showLockedTooltip(btn) {
  document.querySelectorAll('.lock-tooltip').forEach(t => t.remove());
  const tip = document.createElement('span');
  tip.className = 'lock-tooltip';
  tip.textContent = 'Unlock this reaction by completing challenges';
  btn.appendChild(tip);
  setTimeout(() => tip.remove(), 2600);
}

function renderCommunity() {
  const T    = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const feed = document.getElementById('commFeed');
  const postTa = document.getElementById('postText');
  if (postTa) postTa.placeholder = T.comm_write_placeholder;

  const DEMO_POSTS = [
    { postId: 'demo_0', username: 'RaniaCooks',     dish: 'Couscous',       caption: 'Friday couscous tradition 🫶 who else does this every week?',              image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600', time: '2 days ago',  likes: 67 },
    { postId: 'demo_1', username: 'ChefAmine',      dish: 'Shakshuka',      caption: 'Made this for breakfast this morning, the egg yolks came out perfect 🍳', image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600', time: '2 hours ago', likes: 24 },
    { postId: 'demo_2', username: 'MalikaCooks',    dish: 'Chicken Tagine', caption: "My grandmother's recipe, finally nailed the preserved lemon balance 🫕",   image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600', time: '5 hours ago', likes: 41 },
    { postId: 'demo_3', username: 'YoussefKitchen', dish: 'Tabbouleh',      caption: 'Fresh from the garden, this is the real deal 🌿',                          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', time: 'yesterday',   likes: 18 },
  ];

  const userPosts = JSON.parse(localStorage.getItem('community_user_posts') || '[]');
  const allPosts  = [...userPosts, ...DEMO_POSTS];

  const streak   = Number.parseInt(localStorage.getItem('quiz_streak') || '0', 10);
  const unlocked = getUnlockedReactions(streak);

  feed.innerHTML = allPosts.map((p) => {
    const likesKey = `post_likes_${p.postId}`;
    let displayLikes = localStorage.getItem(likesKey);
    if (displayLikes === null) { displayLikes = p.likes; localStorage.setItem(likesKey, String(p.likes)); }
    else displayLikes = Number(displayLikes);

    const rxnData     = JSON.parse(localStorage.getItem(`post_reactions_${p.postId}`) || '{}');
    const userClicked = rxnData._user || [];

    const freeBar = REACTION_FREE.map(e => {
      const n      = rxnData[e] || 0;
      const active = userClicked.includes(e);
      return `<button class="rxn-btn${active ? ' rxn-active' : ''}" onclick="handleDemoReaction('${p.postId}','${e}')">${e}<span>${n || ''}</span></button>`;
    }).join('');

    const lockBar = REACTION_LOCKED.map(e => {
      if (unlocked.includes(e)) {
        const n      = rxnData[e] || 0;
        const active = userClicked.includes(e);
        return `<button class="rxn-btn rxn-unlocked${active ? ' rxn-active' : ''}" onclick="handleDemoReaction('${p.postId}','${e}')">${e}<span>${n || ''}</span></button>`;
      }
      return `<button class="rxn-btn rxn-locked" onclick="showDemoLockMsg('${p.postId}')">${e} 🔒</button>`;
    }).join('');

    const avatarStyle = p.isOwn ? 'background:#e8f5e9;' : '';
    const youBadge    = p.isOwn ? '<span style="font-size:0.7rem;background:#e8f5e9;color:#2e7d32;border-radius:4px;padding:1px 5px;margin-left:4px;font-weight:600;">You</span>' : '';
    const dishSpan    = p.dish  ? `<span class="post-dish">${p.dish}</span>` : '';
    const imgHtml     = p.image ? `<img src="${p.image}" alt="${p.dish || 'post'}" class="post-img" onerror="this.style.display='none'" />` : '';

    return `
    <div class="comm-post-card">
      ${imgHtml}
      <div class="post-body">
        <div class="post-header">
          <div class="up-avatar sm" style="${avatarStyle}">👨‍🍳</div>
          <div>
            <span class="post-username">${p.username}</span>${youBadge}
            ${dishSpan}
          </div>
          <span class="post-time">${p.time}</span>
        </div>
        <p class="post-likes" id="post-likes-${p.postId}">❤️ ${displayLikes} likes</p>
        <p class="post-caption">${p.caption}</p>
        <div class="rxn-bar">${freeBar}${lockBar}</div>
        <div class="lock-msg" id="lock-msg-${p.postId}"></div>
      </div>
    </div>`;
  }).join('');
}

function handleDemoReaction(postId, emoji) {
  const key     = `post_reactions_${postId}`;
  const rxnData = JSON.parse(localStorage.getItem(key) || '{}');
  if (!rxnData._user) rxnData._user = [];
  if (!rxnData._user.includes(emoji)) {
    rxnData._user.push(emoji);
    rxnData[emoji] = (rxnData[emoji] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(rxnData));
    if (emoji === '❤️') {
      const lk = `post_likes_${postId}`;
      const el = document.getElementById(`post-likes-${postId}`);
      const current = el ? Number(el.textContent.replaceAll(/\D/g, '')) : Number(localStorage.getItem(lk) || '0');
      const updated = current + 1;
      localStorage.setItem(lk, String(updated));
      if (el) el.textContent = `❤️ ${updated} likes`;
    }
  }
  renderCommunity();
}

function showDemoLockMsg(postId) {
  const T = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  document.querySelectorAll('.lock-msg').forEach(m => { m.textContent = ''; m.classList.remove('visible'); });
  const msg = document.getElementById(`lock-msg-${postId}`);
  if (!msg) return;
  msg.textContent = T.comm_unlock_tooltip;
  msg.classList.add('visible');
  setTimeout(() => { msg.textContent = ''; msg.classList.remove('visible'); }, 2400);
}

function likePost(i) { communityPosts[i].likes++; renderCommunity(); }

function switchCommTab(tab) {
  document.getElementById('commTabFeed').classList.toggle('active', tab === 'feed');
  document.getElementById('commTabChallenges').classList.toggle('active', tab === 'challenges');
  document.getElementById('commPanelFeed').style.display = tab === 'feed' ? '' : 'none';
  document.getElementById('commPanelChallenges').style.display = tab === 'challenges' ? '' : 'none';
  if (tab === 'challenges') renderQuiz();
}

// ── Challenge daily-limit helpers ──────────────────
function canPlayChallenge() {
  return localStorage.getItem('challenge_played_date') !== new Date().toDateString();
}

function markChallengePlayed() {
  const today = new Date().toDateString();
  localStorage.setItem('challenge_played_date', today);
  const days = JSON.parse(localStorage.getItem('heatmap_days') || '[]');
  if (!days.includes(today)) { days.push(today); localStorage.setItem('heatmap_days', JSON.stringify(days)); }
  if (document.getElementById('page-profile').classList.contains('active')) renderProfile();
}

function addStreak() {
  const today = new Date().toDateString();
  if (localStorage.getItem('streak_last_date') === today) return;
  const streak = Number.parseInt(localStorage.getItem('quiz_streak') || '0', 10) + 1;
  localStorage.setItem('quiz_streak', String(streak));
  localStorage.setItem('streak_last_date', today);
}

function renderQuiz() {
  const T         = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const container = document.getElementById('comm-challenges');
  if (!container) return;

  const locked     = !canPlayChallenge();
  const playedCard = localStorage.getItem('challenge_played_card');
  const lastResult = localStorage.getItem('challenge_last_result');

  function cardBanner(cardName) {
    if (cardName === playedCard) {
      return lastResult === 'correct'
        ? `<div class="result-banner rb-correct">${T.comm_correct}</div>`
        : `<div class="result-banner rb-wrong">${T.comm_wrong}</div>`;
    }
    return `<div class="result-banner rb-played">${T.comm_already_played}</div>`;
  }

  // ── Guess the Dish ──
  const answers = [
    { label: 'Kabsa',  correct: true  },
    { label: 'Tagine', correct: false },
    { label: 'Mansaf', correct: false },
  ];
  answers.sort(() => Math.random() - 0.5);
  const quizBlurred = !(locked && playedCard === 'quiz' && lastResult === 'correct');
  const quizBtns = answers.map(a =>
    `<button class="quiz-ans-btn" onclick="submitQuizAnswer(this,${a.correct})">${a.label}</button>`
  ).join('');

  // ── Missing Ingredient ──
  const ingredients   = ['Eggs', 'Tomatoes', '❓', 'Garlic', 'Cumin'];
  const missingOpts   = [
    { label: 'Bell Peppers', correct: true  },
    { label: 'Saffron',      correct: false },
    { label: 'Cinnamon',     correct: false },
  ];
  missingOpts.sort(() => Math.random() - 0.5);
  const ingPills    = ingredients.map(i =>
    `<span class="ing-pill${i === '❓' ? ' ing-missing' : ''}">${i}</span>`
  ).join('');
  const missingBtns = missingOpts.map(o =>
    `<button class="quiz-ans-btn" onclick="submitMissingAnswer(this,${o.correct})">${o.label}</button>`
  ).join('');

  // ── True or False ──
  const tfBtns = `<div class="quiz-answers tf-row">
    <button class="quiz-ans-btn tf-btn" onclick="submitTriviaAnswer(this,true)">✅ True</button>
    <button class="quiz-ans-btn tf-btn" onclick="submitTriviaAnswer(this,false)">❌ False</button>
  </div>`;

  renderChallengesSidebar();

  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-header">
        <h2>${T.comm_guess_dish}</h2>
        <p class="quiz-sub">A new dish every day — how well do you know Arabic cuisine?</p>
      </div>
      <div class="quiz-img-wrap">
        <img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80"
             alt="Mystery Dish" class="quiz-img${quizBlurred ? ' quiz-blurred' : ''}" />
        ${quizBlurred && !locked ? '<div class="quiz-img-overlay"><span>🔍 What dish is this?</span></div>' : ''}
      </div>
      ${locked ? cardBanner('quiz') : '<div class="quiz-answers">' + quizBtns + '</div>'}
      <p class="chall-info">${T.comm_one_per_day}</p>
    </div>
    <div class="quiz-card">
      <div class="quiz-header">
        <h2>${T.comm_missing_ing}</h2>
        <p class="quiz-sub">One ingredient from this recipe is hidden — can you name it?</p>
      </div>
      <div style="padding:16px 28px 0;">
        <p style="font-weight:700;font-size:1rem;margin:0 0 12px;">Shakshuka</p>
        <div class="ing-pill-row">${ingPills}</div>
      </div>
      ${locked ? cardBanner('missing') : '<div class="quiz-answers">' + missingBtns + '</div>'}
      <p class="chall-info">${T.comm_one_per_day}</p>
    </div>
    <div class="quiz-card" style="margin-bottom:32px;">
      <div class="quiz-header">
        <h2>${T.comm_true_false}</h2>
        <p class="quiz-sub">Test your cooking knowledge</p>
      </div>
      <div style="padding:20px 28px 0;">
        <p class="trivia-fact">"Couscous is made from semolina wheat."</p>
      </div>
      ${locked ? cardBanner('trivia') : tfBtns}
      <p class="chall-info">${T.comm_one_per_day}</p>
    </div>`;
}

function renderChallengesSidebar() {
  const T       = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const sidebar = document.getElementById('commChallengesSidebar');
  if (!sidebar) return;
  const streak = Number.parseInt(localStorage.getItem('quiz_streak') || '0', 10);
  const THRESHOLDS = [{ e: '🫕', threshold: 3 }, { e: '🧆', threshold: 7 }, { e: '🥙', threshold: 14 }];
  const unlockRows = THRESHOLDS.map(({ e, threshold }) => {
    const on = streak >= threshold;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:1.4rem;">${e}</span>
      <span style="flex:1;font-size:0.85rem;color:#555;">${T.comm_unlock_at} ${threshold}</span>
      <span style="font-size:0.8rem;font-weight:600;color:${on ? '#2e7d32' : '#aaa'};">${on ? T.comm_unlocked : '🔒'}</span>
    </div>`;
  }).join('');
  sidebar.innerHTML = `
    <div class="card-block" style="margin-bottom:16px;text-align:center;padding:20px 16px;">
      <div style="font-size:2.8rem;line-height:1;">🔥</div>
      <div style="font-size:2.2rem;font-weight:800;color:#e65c00;line-height:1.2;">${streak}</div>
      <div style="font-size:0.9rem;color:#666;margin-top:2px;">${T.comm_streak_days}</div>
    </div>
    <div class="card-block" style="margin-bottom:16px;padding:16px;">
      <p style="font-weight:700;font-size:0.9rem;margin:0 0 8px;">Unlock Progress</p>
      ${unlockRows}
    </div>
    <div class="card-block" style="padding:14px 16px;font-size:0.85rem;color:#555;text-align:center;">
      ${T.comm_streak_motivation}
    </div>`;
}

function submitQuizAnswer(btn, isCorrect) {
  markChallengePlayed();
  localStorage.setItem('challenge_played_card', 'quiz');
  localStorage.setItem('challenge_last_result', isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { addStreak(); if (document.getElementById('page-profile').classList.contains('active')) renderProfile(); }
  renderQuiz();
  renderCommunity();
}

function submitMissingAnswer(btn, isCorrect) {
  markChallengePlayed();
  localStorage.setItem('challenge_played_card', 'missing');
  localStorage.setItem('challenge_last_result', isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { addStreak(); if (document.getElementById('page-profile').classList.contains('active')) renderProfile(); }
  renderQuiz();
  renderCommunity();
}

function submitTriviaAnswer(btn, isCorrect) {
  markChallengePlayed();
  localStorage.setItem('challenge_played_card', 'trivia');
  localStorage.setItem('challenge_last_result', isCorrect ? 'correct' : 'wrong');
  if (isCorrect) { addStreak(); if (document.getElementById('page-profile').classList.contains('active')) renderProfile(); }
  renderQuiz();
  renderCommunity();
}

// ────────────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────────────
function renderProfile() {
  const T    = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const el   = document.getElementById('profileDetail');
  const u    = (typeof currentUser !== 'undefined' && currentUser) || {};
  const savedAvatar = localStorage.getItem('user_avatar');
  const username = u.name || 'Guest Chef';
  const handle   = u.email ? u.email : '@' + username.toLowerCase().replaceAll(/\s+/g, '_') + '_cooks';
  const memberSince = u.joined ? `Member since ${u.joined}` : '';

  // ── Core data ──
  const streak      = Number.parseInt(localStorage.getItem('quiz_streak') || '0', 10);
  const xp          = streak * 180;
  const userPosts   = JSON.parse(localStorage.getItem('community_user_posts') || '[]');
  const heatmapDays = JSON.parse(localStorage.getItem('heatmap_days') || '[]');
  const today       = new Date().toDateString();
  const lastPlayed = localStorage.getItem('challenge_played_date');
  const alreadyPlayedToday = lastPlayed === today;

  // ── Streak freeze warning ──
  const showStreakWarning = !alreadyPlayedToday && streak > 0 && lastPlayed !== null;

  // ── XP & Level ──
  const LEVEL_DEFS = [
    { name: T.prof_level_beginner, minXp: 0,    maxXp: 180  },
    { name: T.prof_level_home,     minXp: 181,  maxXp: 540  },
    { name: T.prof_level_skilled,  minXp: 541,  maxXp: 900  },
    { name: T.prof_level_master,   minXp: 901,  maxXp: 1800 },
    { name: 'Legend 🏆',           minXp: 1801, maxXp: 9999 },
  ];
  let levelIdx = LEVEL_DEFS.length - 1;
  for (let i = 0; i < LEVEL_DEFS.length; i++) { if (xp <= LEVEL_DEFS[i].maxXp) { levelIdx = i; break; } }
  const curLevel    = LEVEL_DEFS[levelIdx];
  const isMaxLevel  = levelIdx === LEVEL_DEFS.length - 1;
  const progressPct = isMaxLevel ? 100
    : Math.min(100, Math.round(((xp - curLevel.minXp) / (curLevel.maxXp - curLevel.minXp)) * 100));
  const xpToNext    = isMaxLevel ? 0 : LEVEL_DEFS[levelIdx + 1].minXp - xp;

  const levelDots = LEVEL_DEFS.map((l, i) => {
    const active = i === levelIdx;
    const done   = i < levelIdx;
    const bg     = active ? '#d4a017' : done ? '#4a7c3f' : '#e0e0e0';
    const tc     = active ? '#d4a017' : done ? '#4a7c3f' : '#bbb';
    const lineBg = i < levelIdx ? '#4a7c3f' : '#e0e0e0';
    const dot = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:0;">
      <div style="width:26px;height:26px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:${active||done?'#fff':'#bbb'};flex-shrink:0;">${i+1}</div>
      <div style="font-size:0.56rem;color:${tc};text-align:center;line-height:1.3;">${l.name}</div>
    </div>`;
    const line = i < LEVEL_DEFS.length - 1
      ? `<div style="width:20px;height:2px;background:${lineBg};flex-shrink:0;margin-top:12px;"></div>` : '';
    return dot + line;
  }).join('');

  // ── Personality ──
  let personality, personalityDesc;
  if      (streak >= 7)            { personality = T.prof_personality_chef;      personalityDesc = 'You never miss a day'; }
  else if (userPosts.length >= 2)  { personality = T.prof_personality_sharer;    personalityDesc = 'You love sharing with the community'; }
  else if (savedRecipes.length >= 3) { personality = T.prof_personality_collector; personalityDesc = 'Always saving new recipes'; }
  else                             { personality = T.prof_personality_rising;     personalityDesc = 'Your journey is just beginning'; }

  // ── Badges ──
  const BADGE_DEFS = [
    { emoji: '🥄', name: T.prof_badge_first,   req: 1    },
    { emoji: '🔥', name: T.prof_badge_streak3, req: 3    },
    { emoji: '⚡', name: T.prof_badge_week,    req: 7    },
    { emoji: '👑', name: T.prof_badge_master,  req: 14   },
    { emoji: '🌟', name: 'Coming Soon',        req: 9999 },
    { emoji: '🎯', name: 'Coming Soon',        req: 9999 },
    { emoji: '🍽️', name: 'Coming Soon',       req: 9999 },
    { emoji: '🏆', name: 'Coming Soon',        req: 9999 },
  ];
  const earned    = BADGE_DEFS.filter(b => streak >= b.req).length;
  const badgeGrid = BADGE_DEFS.map(b => {
    const on = streak >= b.req;
    return `<div style="background:${on?'#fffbea':'#f7f7f7'};border:2px solid ${on?'#d4a017':'#e8e8e8'};border-radius:12px;padding:14px 6px;text-align:center;">
      <div style="font-size:1.7rem;">${on ? b.emoji : '🔒'}</div>
      <div style="font-size:0.65rem;font-weight:600;color:${on?'#b8860b':'#ccc'};margin-top:4px;line-height:1.3;">${on ? b.name : 'Locked'}</div>
    </div>`;
  }).join('');
  const nextBadge = BADGE_DEFS.find(b => streak < b.req && b.req < 9999);
  const badgeHint = nextBadge
    ? `🔓 ${T.prof_cook_more.replace('{x}', String(nextBadge.req - streak))} "${nextBadge.name}"`
    : '🏆 All challenge badges unlocked!';

  // ── Heatmap ──
  const heatmapSquares = Array.from({ length: 28 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - idx));
    const active = heatmapDays.includes(d.toDateString());
    return `<div style="width:28px;height:28px;border-radius:4px;background:${active?'#d4a017':'#bbb'};opacity:${active?1:0.3};"></div>`;
  }).join('');

  // ── Stats ──
  const challengesDone = heatmapDays.length;
  const postsMade      = userPosts.length;

  // ── Saved Recipes ──
  const savedGrid = getAllRecipes().filter(r => savedRecipes.includes(r.id)).map(r =>
    `<div class="recipe-card" onclick="openRecipeModal('${r.id}');navigateTo('home');">
      <div class="rc-img-box"><img src="${r.img}" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?w=800';"/></div>
      <div class="rc-body"><h3>${r.name}</h3><p class="rc-meta">${r.level} • ${r.time}</p></div>
    </div>`
  ).join('') || '<div class="empty-state"><i class="fa-regular fa-bookmark"></i><p>No saved recipes yet.</p></div>';

  el.innerHTML = `
    <!-- Section 1: Hero -->
    <div style="background:linear-gradient(135deg,#1b2e18 0%,#243d1f 50%,#2d5022 100%);border-radius:20px;padding:40px 24px 32px;text-align:center;margin-bottom:24px;position:relative;overflow:hidden;">
      <div style="position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800')center/cover;opacity:0.08;border-radius:20px;pointer-events:none;"></div>
      <div style="position:relative;">
        <div style="position:relative;width:90px;height:90px;margin:0 auto 16px;">
          <div id="profile-avatar-circle" style="width:90px;height:90px;border-radius:50%;background:${savedAvatar ? 'none' : 'linear-gradient(135deg,#d4a017,#f5c842)'};display:flex;align-items:center;justify-content:center;font-size:2.4rem;border:4px solid ${savedAvatar ? '#d4a017' : 'rgba(255,255,255,0.2)'};box-shadow:0 8px 24px rgba(212,160,23,0.5);overflow:hidden;">
            ${savedAvatar ? `<img src="${savedAvatar}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;display:block;" />` : '👨‍🍳'}
          </div>
          <button onclick="document.getElementById('profile-avatar-input').click()" style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:#d4a017;border:2px solid #fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.85rem;padding:0;line-height:1;">📷</button>
          <input type="file" id="profile-avatar-input" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;" onchange="handleProfileAvatarUpload(this)" />
        </div>
        <h2 style="color:#fff;font-size:1.6rem;margin:0 0 4px;font-weight:800;">${username}</h2>
        <p style="color:#a8c8a0;font-size:0.88rem;margin:0 0 4px;">${handle}</p>
        ${memberSince ? `<p style="color:#7aab72;font-size:0.75rem;margin:0 0 6px;">${memberSince}</p>` : ''}
        <p style="color:#c8e0c0;font-size:0.85rem;margin:0 0 26px;">${T.prof_bio}</p>
        <div style="display:flex;justify-content:center;align-items:center;">
          <div style="text-align:center;padding:0 28px;">
            <div style="color:#fff;font-size:1.4rem;font-weight:800;">31</div>
            <div style="color:#a8c8a0;font-size:0.75rem;margin-top:2px;">${T.prof_followers}</div>
          </div>
          <div style="width:1px;height:36px;background:rgba(255,255,255,0.2);"></div>
          <div style="text-align:center;padding:0 28px;">
            <div style="color:#fff;font-size:1.4rem;font-weight:800;">84</div>
            <div style="color:#a8c8a0;font-size:0.75rem;margin-top:2px;">${T.prof_following}</div>
          </div>
          <div style="width:1px;height:36px;background:rgba(255,255,255,0.2);"></div>
          <div style="text-align:center;padding:0 28px;">
            <div style="color:#fff;font-size:1.4rem;font-weight:800;">${savedRecipes.length}</div>
            <div style="color:#a8c8a0;font-size:0.75rem;margin-top:2px;">${T.prof_recipes}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Streak Freeze Warning -->
    ${showStreakWarning ? `
    <div style="background:#fff3e0;border:1.5px solid #ffb74d;border-radius:14px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="font-size:0.9rem;color:#e65c00;font-weight:600;">${T.prof_streak_warning}</div>
      <button onclick="switchCommTab('challenges');navigateTo('community');" style="background:#e65c00;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:0.83rem;font-weight:700;cursor:pointer;white-space:nowrap;">${T.prof_play_now}</button>
    </div>` : ''}

    <!-- Section 3: XP & Level -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #f0f0f0;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-size:2rem;font-weight:800;color:#d4a017;line-height:1;">${xp} XP</div>
          <div style="font-size:0.95rem;font-weight:700;color:#333;margin-top:4px;">${curLevel.name}</div>
        </div>
        <div style="font-size:0.78rem;color:#aaa;text-align:right;line-height:1.5;">${T.prof_keep_cooking}</div>
      </div>
      <div style="background:#f3f3f3;border-radius:100px;height:10px;margin-bottom:8px;overflow:hidden;">
        <div id="xp-bar-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#d4a017,#f5c842);border-radius:100px;transition:width 1s ease-out;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.73rem;color:#aaa;margin-bottom:20px;">
        <span>${isMaxLevel ? 'Max level reached! 🏆' : xpToNext + ' more XP to next level'}</span>
        <span>${progressPct}%</span>
      </div>
      <div style="display:flex;align-items:flex-start;">${levelDots}</div>
    </div>

    <!-- Section 4: Cooking Personality -->
    <div style="border:2px solid #d4a017;border-radius:16px;padding:20px 24px;margin-bottom:24px;background:#fffbea;">
      <div style="font-size:0.72rem;font-weight:700;color:#b8860b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Your Cooking Personality</div>
      <div style="font-size:1.15rem;font-weight:800;color:#333;margin-bottom:4px;">${personality}</div>
      <div style="font-size:0.88rem;color:#777;">${personalityDesc}</div>
    </div>

    <!-- Section 5: Badges -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #f0f0f0;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700;">${T.prof_badges_title} (${earned}/8 earned)</h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">${badgeGrid}</div>
      <div style="font-size:0.8rem;color:#888;text-align:center;">${badgeHint}</div>
    </div>

    <!-- Section 6: Heatmap -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #f0f0f0;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700;">${T.prof_activity}</h3>
      <div style="display:grid;grid-template-columns:repeat(7,28px);gap:4px;margin-bottom:14px;">${heatmapSquares}</div>
      <div style="display:flex;align-items:center;gap:16px;font-size:0.75rem;color:#888;">
        <div style="display:flex;align-items:center;gap:5px;"><div style="width:14px;height:14px;border-radius:3px;background:#bbb;opacity:0.3;"></div>${T.prof_no_activity}</div>
        <div style="display:flex;align-items:center;gap:5px;"><div style="width:14px;height:14px;border-radius:3px;background:#d4a017;"></div>${T.prof_challenge_done}</div>
      </div>
    </div>

    <!-- Section 7: Stats -->
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #f0f0f0;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
      <h3 style="margin:0 0 16px;font-size:1rem;font-weight:700;">📊 My Stats</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:#fffbea;border-radius:12px;padding:16px;text-align:center;border:1px solid #f0e0a0;">
          <div style="font-size:1.7rem;font-weight:800;color:#d4a017;">${challengesDone}</div>
          <div style="font-size:0.75rem;color:#888;margin-top:3px;">${T.prof_stat_challenges}</div>
        </div>
        <div style="background:#fff8f0;border-radius:12px;padding:16px;text-align:center;border:1px solid #ffd5a0;">
          <div style="font-size:1.7rem;font-weight:800;color:#e65c00;">${streak}</div>
          <div style="font-size:0.75rem;color:#888;margin-top:3px;">${T.prof_stat_streak} 🔥</div>
        </div>
        <div style="background:#f0faf4;border-radius:12px;padding:16px;text-align:center;border:1px solid #b5e2c5;">
          <div style="font-size:1.7rem;font-weight:800;color:#2e7d32;">${postsMade}</div>
          <div style="font-size:0.75rem;color:#888;margin-top:3px;">${T.prof_stat_posts}</div>
        </div>
        <div style="background:#f0f4ff;border-radius:12px;padding:16px;text-align:center;border:1px solid #b0c4f5;">
          <div style="font-size:1.7rem;font-weight:800;color:#3a5cd8;">${savedRecipes.length}</div>
          <div style="font-size:0.75rem;color:#888;margin-top:3px;">${T.prof_stat_saved}</div>
        </div>
      </div>
    </div>

    <!-- Section 8: Saved Recipes -->
    <div style="margin-bottom:24px;">
      <h3 style="font-size:1rem;font-weight:700;margin:0 0 16px;">🔖 ${T.prof_saved_title}</h3>
      <div class="recipe-grid">${savedGrid}</div>
    </div>

    <!-- Section 9: Sign Out -->
    <button class="btn-outline" style="margin-top:8px;margin-bottom:32px;" onclick="logout()"><i class="fa-solid fa-door-open"></i> ${T.prof_signout}</button>
  `;

  // Animate XP bar after DOM insertion
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bar = document.getElementById('xp-bar-fill');
      if (bar) bar.style.width = `${progressPct}%`;
    });
  });

  // ── Update navbar avatar from localStorage ──
  const navAvatar = document.querySelector('.up-avatar');
  if (navAvatar) {
    if (savedAvatar) {
      navAvatar.style.background = 'none';
      navAvatar.style.padding = '0';
      navAvatar.style.overflow = 'hidden';
      navAvatar.innerHTML = `<img src="${savedAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;" />`;
    } else {
      navAvatar.innerHTML = '👨‍🍳';
    }
  }

  // ── Profile avatar upload handler ──
  window.handleProfileAvatarUpload = function(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const b64 = e.target.result;
      localStorage.setItem('user_avatar', b64);
      const circle = document.getElementById('profile-avatar-circle');
      if (circle) {
        circle.style.background = 'none';
        circle.style.borderColor = '#d4a017';
        circle.innerHTML = `<img src="${b64}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;display:block;" />`;
      }
      const nav = document.querySelector('.up-avatar');
      if (nav) {
        nav.style.background = 'none';
        nav.style.padding = '0';
        nav.style.overflow = 'hidden';
        nav.innerHTML = `<img src="${b64}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;" />`;
      }
      showToast('Profile photo updated! ✅');
    };
    reader.readAsDataURL(file);
  };
}

function logout() {
  localStorage.removeItem('cooks_logged_in');
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
