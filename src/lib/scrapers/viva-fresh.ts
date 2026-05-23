/**
 * Viva Fresh Kosovo scraper — online.vivafresh.shop
 *
 * HOW TO UPDATE SELECTORS:
 * 1. Open https://online.vivafresh.shop in Chrome
 * 2. Right-click a product card → Inspect
 * 3. Find the CSS class for: product name, price, category, image
 * 4. Update SELECTORS below accordingly
 *
 * The scraper tries the sitemap first, then falls back to category pages.
 */

import * as cheerio from "cheerio";

export interface ScrapedProduct {
  name: string;
  brand: string | null;
  price: number;
  originalPrice: number | null;
  isOnPromotion: boolean;
  category: string;
  sku: string | null;
  sourceUrl: string;
  imageUrl: string | null;
}

const BASE_URL = "https://online.vivafresh.shop";

// ── UPDATE THESE when you inspect the real site ──────────────────────────────
const SELECTORS = {
  // CSS selector for a product card container
  productCard: ".product, .product-item, [class*='product-card'], li.type-product",
  // Within card: product title
  title: ".woocommerce-loop-product__title, .product-title, h2, h3",
  // Within card: current price
  price: ".price .woocommerce-Price-amount bdi, .price ins .woocommerce-Price-amount bdi, .price .amount",
  // Within card: original price (if on sale)
  originalPrice: ".price del .woocommerce-Price-amount bdi, .price del .amount",
  // Within card: product link
  link: "a.woocommerce-loop-product__link, a",
  // Within card: image
  image: "img",
  // Pagination: next page link
  nextPage: ".next.page-numbers, a[aria-label='Next page']",
};

// Category pages to scrape — add more as you find them on the site
const CATEGORY_PAGES = [
  "/shop",
  "/product-category/pije",
  "/product-category/bulmet",
  "/product-category/mish",
  "/product-category/fruta-perime",
  "/product-category/bukëtari",
  "/product-category/të-ngrira",
  "/product-category/ushqime-themelore",
];

// Map Viva Fresh categories → our ProductCategory enum
const CATEGORY_MAP: Record<string, string> = {
  pije: "BEVERAGES",
  bulmet: "DAIRY",
  mish: "MEAT_POULTRY",
  "fruta-perime": "FRUITS_VEGETABLES",
  "bukëtari": "BAKERY",
  "të-ngrira": "FROZEN",
  "ushqime-themelore": "PASTA_GRAINS",
  default: "SNACKS_CONFECTIONERY",
};

function parsePrice(text: string): number | null {
  if (!text) return null;
  // Remove currency symbols, spaces, replace comma with dot
  const cleaned = text.replace(/[€$\s,]/g, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractCategory(url: string): string {
  for (const [slug, cat] of Object.entries(CATEGORY_MAP)) {
    if (url.includes(slug)) return cat;
  }
  return CATEGORY_MAP.default;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "sq,en-US;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseProductsFromHtml(html: string, pageUrl: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];
  const category = extractCategory(pageUrl);

  $(SELECTORS.productCard).each((_, el) => {
    const card = $(el);

    const titleEl = card.find(SELECTORS.title).first();
    const name = titleEl.text().trim();
    if (!name || name.length < 2) return;

    const priceText = card.find(SELECTORS.price).first().text().trim();
    const price = parsePrice(priceText);
    if (!price || price <= 0) return;

    const origText = card.find(SELECTORS.originalPrice).first().text().trim();
    const originalPrice = parsePrice(origText);

    const link = card.find(SELECTORS.link).first().attr("href") ?? pageUrl;
    const image = card.find(SELECTORS.image).first().attr("src") ?? null;

    products.push({
      name,
      brand: null,
      price,
      originalPrice,
      isOnPromotion: originalPrice !== null && originalPrice > price,
      category,
      sku: null,
      sourceUrl: link.startsWith("http") ? link : `${BASE_URL}${link}`,
      imageUrl: image,
    });
  });

  return products;
}

export async function scrapeVivaFresh(maxPages = 5): Promise<{
  products: ScrapedProduct[];
  log: string[];
  pagesScraped: number;
}> {
  const log: string[] = [];
  const seen = new Set<string>();
  const allProducts: ScrapedProduct[] = [];
  let pagesScraped = 0;

  for (const categoryPath of CATEGORY_PAGES) {
    let pageUrl = `${BASE_URL}${categoryPath}`;
    let pageNum = 1;

    while (pageUrl && pageNum <= maxPages) {
      log.push(`Fetching: ${pageUrl}`);
      const html = await fetchPage(pageUrl);

      if (!html) {
        log.push(`  → Failed to fetch`);
        break;
      }

      const products = parseProductsFromHtml(html, pageUrl);
      log.push(`  → Found ${products.length} products`);

      for (const p of products) {
        const key = `${p.name.toLowerCase()}::${p.price}`;
        if (!seen.has(key)) {
          seen.add(key);
          allProducts.push(p);
        }
      }

      pagesScraped++;

      // Find next page
      const $ = cheerio.load(html);
      const nextHref = $(SELECTORS.nextPage).first().attr("href");
      pageUrl = nextHref && nextHref.startsWith("http") ? nextHref : "";
      pageNum++;

      // Polite delay between pages
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  log.push(`Total unique products scraped: ${allProducts.length}`);
  return { products: allProducts, log, pagesScraped };
}
