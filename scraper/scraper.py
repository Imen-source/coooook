"""
Cook's Platform — Arabic Recipe Web Scraper
============================================
Extracts Arabic recipes from trusted culinary websites and outputs
structured JSON that maps directly to the cooks_db schema:
  - recipes (title, country, level, prep_time, category, story, image_url)
  - recipe_ingredients (name, amount, unit)
  - recipe_steps (step_num, instruction, timer_seconds)

Supported sites:
  1. cookpad.com/ar        (Cookpad Arabic)
  2. makloba.com           (Makloba — Levantine recipes)
  3. fatafeat.com          (Fatafeat TV — Gulf & Levantine)
  4. chhiwat.com           (Chhiwat — Maghrebi / Moroccan)
  5. 3sesse.com            (3sesse — Egyptian)
  6. souhailrecettes.com   (Souhail Recettes — Algerian/French-Arabic)

Usage:
  pip install requests beautifulsoup4 lxml tqdm
  python scraper.py --sites all --output ../arabic_recipes.json --max 50
"""

import argparse
import hashlib
import json
import logging
import re
import sys
import time
from datetime import datetime
from typing import Any, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# ─────────────────────────────── Logging ────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("cooks_scraper")

# ─────────────────────────────── Config ─────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

REQUEST_DELAY = 1.5          # Seconds between requests (be polite)
REQUEST_TIMEOUT = 15         # Seconds before giving up on a request
MAX_RETRIES = 3              # Retry failed requests this many times

# Regex helpers
TIME_RE = re.compile(r"(\d+)\s*(دقيقة|ساعة|دق|ساعات|min|hr|hour|minute)", re.IGNORECASE)


# ════════════════════════════════════════════════════════════════════════════
#  Utility helpers
# ════════════════════════════════════════════════════════════════════════════

def fetch(url: str, session: requests.Session) -> Optional[BeautifulSoup]:
    """Fetch a URL and return a BeautifulSoup object, or None on failure."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            resp.encoding = resp.apparent_encoding or "utf-8"
            return BeautifulSoup(resp.text, "lxml")
        except requests.RequestException as exc:
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES} failed for {url}: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(REQUEST_DELAY * attempt)
    return None


def recipe_id(title: str) -> str:
    """Generate a short deduplication key from a recipe title."""
    return hashlib.md5(title.strip().encode("utf-8")).hexdigest()[:12]


def clean_text(text: Optional[str]) -> str:
    """Strip extra whitespace and common HTML artefacts."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def parse_time(raw: str) -> str:
    """Normalise a raw time string to Arabic 'X دقيقة / X ساعة' form."""
    raw = clean_text(raw)
    if not raw:
        return ""
    # Already looks sensible — return as-is
    if any(kw in raw for kw in ["دقيقة", "ساعة", "دق"]):
        return raw
    # Try to extract numeric + unit
    m = TIME_RE.search(raw)
    if m:
        num, unit = m.group(1), m.group(2)
        if unit in ("min", "minute", "دق", "دقيقة"):
            return f"{num} دقيقة"
        if unit in ("hr", "hour", "ساعة", "ساعات"):
            return f"{num} ساعة"
    return raw


def infer_tags(title: str, category: str, ingredients: list[str]) -> list[str]:
    """Infer relevant Arabic tags from recipe metadata."""
    tags: list[str] = []
    title_lower = title
    ingr_text = " ".join(ingredients)

    # Cuisine origin tags
    maghreb_kw  = ["مغربي", "جزائري", "تونسي", "ليبي", "كسكس", "طاجين", "شرشم", "مرق"]
    levant_kw   = ["شامي", "لبناني", "سوري", "فلسطيني", "فلافل", "حمص", "تبولة", "كيبة"]
    gulf_kw     = ["سعودي", "كبسة", "مجبوس", "إماراتي", "كويتي", "خليجي"]
    egyptian_kw = ["مصري", "كشري", "ملوخية", "فول", "فتة"]

    for kw in maghreb_kw:
        if kw in title_lower or kw in ingr_text:
            tags.append("مغاربي"); break
    for kw in levant_kw:
        if kw in title_lower or kw in ingr_text:
            tags.append("شامي"); break
    for kw in gulf_kw:
        if kw in title_lower or kw in ingr_text:
            tags.append("خليجي"); break
    for kw in egyptian_kw:
        if kw in title_lower or kw in ingr_text:
            tags.append("مصري"); break

    # Protein / dietary tags
    if any(k in ingr_text for k in ["دجاج", "فروج"]):
        tags.append("دجاج")
    if any(k in ingr_text for k in ["لحم", "غنم", "بقري", "خروف"]):
        tags.append("لحم")
    if any(k in ingr_text for k in ["سمك", "روبيان", "جمبري", "بحري"]):
        tags.append("بحري")
    if not any(k in ingr_text for k in ["لحم", "دجاج", "سمك", "غنم"]):
        tags.append("نباتي")

    # Category mapping
    category_map = {
        "maghreb": "مغاربي",
        "arabic": "عربي",
        "levant": "شامي",
        "gulf": "خليجي",
        "dessert": "حلوى",
        "breakfast": "فطور",
        "salad": "سلطة",
    }
    if category in category_map and category_map[category] not in tags:
        tags.append(category_map[category])

    # Speed tag
    if "سريع" not in tags and any(k in title_lower for k in ["سريع", "خفيف", "15 دقيقة", "20 دقيقة"]):
        tags.append("سريع")

    # Traditional tag
    if any(k in title_lower for k in ["تقليدي", "أصيل", "أصلي", "شعبي"]):
        tags.append("تقليدي")

    return list(dict.fromkeys(tags))  # remove duplicates while preserving order


def build_recipe(
    title: str,
    country: str,
    level: str,
    prep_time: str,
    cook_time: str,
    category: str,
    story: str,
    image_url: str,
    ingredients: list[dict],
    steps: list[str],
    tags: list[str],
    source_url: str,
) -> dict[str, Any]:
    """Assemble the final recipe dict matching the DB schema."""
    ingr_names = [i.get("name", "") for i in ingredients]
    if not tags:
        tags = infer_tags(title, category, ingr_names)

    numbered_steps = [
        {"step_num": idx + 1, "instruction": clean_text(s), "timer_seconds": 0}
        for idx, s in enumerate(steps)
        if clean_text(s)
    ]

    return {
        "_id": recipe_id(title),
        "_source_url": source_url,
        "_scraped_at": datetime.utcnow().isoformat() + "Z",
        "title": clean_text(title),
        "story": clean_text(story),
        "country": country,
        "level": level,
        "prep_time": parse_time(prep_time),
        "cook_time": parse_time(cook_time),
        "category": category,
        "image_url": image_url,
        "servings": 4,
        "is_heritage": "تقليدي" in tags,
        "tags": tags,
        "ingredients": ingredients,
        "steps": numbered_steps,
    }


# ════════════════════════════════════════════════════════════════════════════
#  Site-specific scrapers
# ════════════════════════════════════════════════════════════════════════════

class BaseScraper:
    SITE_NAME = "base"
    BASE_URL  = ""

    def __init__(self, session: requests.Session, max_recipes: int = 20):
        self.session = session
        self.max_recipes = max_recipes
        self._seen: set[str] = set()

    def _is_duplicate(self, title: str) -> bool:
        key = recipe_id(title)
        if key in self._seen:
            return True
        self._seen.add(key)
        return False

    def listing_urls(self) -> list[str]:
        """Return paginated listing URLs to scrape."""
        raise NotImplementedError

    def recipe_links_from_listing(self, soup: BeautifulSoup) -> list[str]:
        """Extract individual recipe URLs from a listing page."""
        raise NotImplementedError

    def scrape_recipe(self, url: str) -> Optional[dict]:
        """Scrape a single recipe page and return a structured dict."""
        raise NotImplementedError

    def run(self) -> list[dict]:
        results: list[dict] = []
        logger.info(f"[{self.SITE_NAME}] Starting — target: {self.max_recipes} recipes")

        for listing_url in self.listing_urls():
            if len(results) >= self.max_recipes:
                break
            soup = fetch(listing_url, self.session)
            if not soup:
                continue

            links = self.recipe_links_from_listing(soup)
            logger.info(f"[{self.SITE_NAME}] Found {len(links)} links on {listing_url}")

            for link in tqdm(links, desc=self.SITE_NAME, unit="recipe"):
                if len(results) >= self.max_recipes:
                    break
                time.sleep(REQUEST_DELAY)
                try:
                    recipe = self.scrape_recipe(link)
                    if recipe and not self._is_duplicate(recipe["title"]):
                        results.append(recipe)
                        logger.debug(f"  ✓ {recipe['title']}")
                except Exception as exc:
                    logger.warning(f"  ✗ Failed {link}: {exc}")

        logger.info(f"[{self.SITE_NAME}] Done — collected {len(results)} recipes")
        return results


# ─────────────────────────────── Cookpad Arabic ─────────────────────────────

class CookpadScraper(BaseScraper):
    SITE_NAME = "cookpad.com/ar"
    BASE_URL  = "https://cookpad.com/ar"

    CATEGORIES = [
        "أكلات-مغربية",
        "أكلات-جزائرية",
        "أكلات-تونسية",
        "أكلات-لبنانية",
        "أكلات-سعودية",
        "أكلات-مصرية",
        "أطباق-رئيسية",
        "حلويات-عربية",
    ]

    def listing_urls(self) -> list[str]:
        return [f"{self.BASE_URL}/search/{cat}" for cat in self.CATEGORIES]

    def recipe_links_from_listing(self, soup: BeautifulSoup) -> list[str]:
        links = []
        for a in soup.select("a[href*='/recipes/'], a[href*='/ar/recipes/']"):
            href = a.get("href", "")
            if not href: continue
            full = urljoin(self.BASE_URL, href)
            # Filter out search pages or user profiles
            if "/recipes/" in full and not "/search" in full and not "/users/" in full:
                if full not in links:
                    links.append(full)
        return links

    def scrape_recipe(self, url: str) -> Optional[dict]:
        soup = fetch(url, self.session)
        if not soup:
            return None

        title = clean_text(soup.select_one("h1") and soup.select_one("h1").get_text())
        if not title:
            return None

        # Ingredients
        ingredients = []
        for item in soup.select(".ingredient-list > div, .ingredients li"):
            text = clean_text(item.get_text())
            if text:
                ingredients.append({"name": text, "amount": "", "unit": ""})

        # Steps
        steps = []
        for step in soup.select(".recipe-step-list li, .recipe-step-list > div, .step-text, .steps-wrapper .step"):
            text = clean_text(step.get_text())
            if text:
                steps.append(text)

        # Meta
        prep_time = ""
        time_el = soup.select_one("time, .cook-time, .preparation-time")
        if not time_el:
            # Look for text containing 'دقيقة'
            for span in soup.select("span, div"):
                txt = span.get_text()
                if any(k in txt for k in ["دقيقة", "ساعة", "دق"]):
                    if len(txt) < 30: # Avoid long paragraphs
                        prep_time = txt
                        break
        else:
            prep_time = time_el.get_text()

        image_tag = soup.select_one("main img, img.recipe-image, .recipe-photo img, .recipe-main-image")
        image_url = image_tag.get("src", "") if image_tag else ""
        if not image_url and image_tag:
            image_url = image_tag.get("data-src", "")

        return build_recipe(
            title=title,
            country="",
            level="Beginner",
            prep_time=prep_time,
            cook_time="",
            category="arabic",
            story="",
            image_url=image_url,
            ingredients=ingredients,
            steps=steps,
            tags=[],
            source_url=url,
        )


# ─────────────────────────────── Fatafeat ───────────────────────────────────

class FataFeatScraper(BaseScraper):
    SITE_NAME = "fatafeat.com"
    BASE_URL  = "https://www.fatafeat.com"

    def listing_urls(self) -> list[str]:
        # Correct listing URL is /وصفات (encoded as %D9%88%D8%B5%D9%81%D8%A7%D8%AA)
        return [
            f"{self.BASE_URL}/%D9%88%D8%B5%D9%81%D8%A7%D8%AA?page={p}"
            for p in range(1, 6)
        ]

    def recipe_links_from_listing(self, soup: BeautifulSoup) -> list[str]:
        links = []
        # Current selector for recipe cards
        for a in soup.select("a.recipe-real-image, a[href*='/recipe/']"):
            href = a.get("href", "")
            if not href:
                continue
            full = urljoin(self.BASE_URL, href)
            if full not in links:
                links.append(full)
        return links

    def scrape_recipe(self, url: str) -> Optional[dict]:
        soup = fetch(url, self.session)
        if not soup:
            return None

        # Try JSON-LD first for clean data
        json_data = {}
        script = soup.find("script", type="application/ld+json")
        if script:
            try:
                json_data = json.loads(script.string)
            except:
                pass

        title = clean_text(json_data.get("name") or 
                          (soup.select_one("h1.recipe-page-title, h1") and 
                           soup.select_one("h1.recipe-page-title, h1").get_text()))
        
        if not title:
            return None

        # Ingredients
        ingredients = []
        if json_data.get("recipeIngredient"):
            for ing in json_data["recipeIngredient"]:
                ingredients.append({"name": clean_text(ing), "amount": "", "unit": ""})
        else:
            # Fallback to HTML
            for item in soup.select(".ingredients, .ingredient-item"):
                amount_el = item.select_one(".firsttext")
                name_el = item.select_one(".secondtext")
                if amount_el and name_el:
                    amount = clean_text(amount_el.get_text())
                    name = clean_text(name_el.get_text())
                    ingredients.append({"name": name, "amount": amount, "unit": ""})
                else:
                    text = clean_text(item.get_text())
                    if text:
                        ingredients.append({"name": text, "amount": "", "unit": ""})

        # Steps
        steps = []
        if json_data.get("recipeInstructions") and isinstance(json_data["recipeInstructions"], list):
            for step in json_data["recipeInstructions"]:
                if isinstance(step, dict) and step.get("text"):
                    text = clean_text(step["text"])
                    if text and text != "Array":
                        steps.append(text)
                elif isinstance(step, str):
                    steps.append(clean_text(step))
        
        # If JSON-LD steps failed or returned "Array", fallback to HTML
        if not steps or all(s == "Array" for s in steps):
            steps = []
            # Use a more specific selector to avoid desktop/mobile duplication
            # Desktop container is usually visible
            container = soup.select_one(".row.d-none.d-lg-flex") or soup
            for p in container.select(".preparingway p.counter-text, .recipe-steps-list li"):
                text = clean_text(p.get_text()).lstrip("•").strip()
                if text and text not in steps:
                    steps.append(text)

        # Meta
        level = "Intermediate"
        level_el = soup.select_one(".dynamic-time.bold-font")
        if level_el:
            level = clean_text(level_el.get_text())

        prep_time = json_data.get("prepTime", "")
        cook_time = json_data.get("cookTime", "")
        
        if not prep_time or "PT" in prep_time: # PT0M is useless
            # Fallback to HTML meta
            for meta in soup.select(".tabkha-details, .dynamic-time, .recipe-meta__item-value"):
                text = meta.get_text()
                if "دقيقة" in text or "ساعة" in text:
                    prep_time = text
                    break

        img_tag = soup.select_one("meta[property='og:image']")
        image_url = img_tag.get("content", "") if img_tag else json_data.get("image", "")

        return build_recipe(
            title=title,
            country="",
            level=level,
            prep_time=prep_time,
            cook_time=cook_time,
            category="arabic",
            story="",
            image_url=image_url,
            ingredients=ingredients,
            steps=steps,
            tags=[],
            source_url=url,
        )


# ════════════════════════════════════════════════════════════════════════════
#  Deduplication across multiple scrapers
# ════════════════════════════════════════════════════════════════════════════

def deduplicate(recipes: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for r in recipes:
        key = recipe_id(r["title"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
        else:
            logger.debug(f"Duplicate removed: {r['title']}")
    return unique


# ════════════════════════════════════════════════════════════════════════════
#  Main entry point
# ════════════════════════════════════════════════════════════════════════════

SITE_MAP = {
    "cookpad":  CookpadScraper,
    "fatafeat": FataFeatScraper,
}


def main():
    parser = argparse.ArgumentParser(description="Cook's Arabic Recipe Scraper")
    parser.add_argument(
        "--sites",
        nargs="+",
        default=["all"],
        choices=list(SITE_MAP.keys()) + ["all"],
        help="Which sites to scrape. Use 'all' for every site.",
    )
    parser.add_argument(
        "--output",
        default="../arabic_recipes.json",
        help="Output JSON file path (default: ../arabic_recipes.json)",
    )
    parser.add_argument(
        "--max",
        type=int,
        default=50,
        help="Maximum number of recipes per site (default: 50)",
    )
    parser.add_argument(
        "--merge",
        action="store_true",
        help="If output file exists, merge with existing recipes instead of overwriting.",
    )
    args = parser.parse_args()

    sites = list(SITE_MAP.keys()) if "all" in args.sites else args.sites

    # Existing recipes (for dedup / merge)
    existing: list[dict] = []
    if args.merge:
        try:
            with open(args.output, encoding="utf-8") as f:
                existing = json.load(f)
            logger.info(f"Loaded {len(existing)} existing recipes for merge mode.")
        except FileNotFoundError:
            pass

    session = requests.Session()
    all_recipes: list[dict] = []

    for site_key in sites:
        scraper_cls = SITE_MAP[site_key]
        scraper = scraper_cls(session, max_recipes=args.max)
        recipes = scraper.run()
        all_recipes.extend(recipes)
        time.sleep(REQUEST_DELAY * 2)  # Extra pause between sites

    combined = existing + all_recipes
    final = deduplicate(combined)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    logger.info(
        f"\n✅ Saved {len(final)} unique recipes → {args.output}"
        f"\n   (scraped: {len(all_recipes)}, after dedup: {len(final)})"
    )


if __name__ == "__main__":
    main()
