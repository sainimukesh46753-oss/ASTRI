#!/usr/bin/env node
/**
 * Safe, opt-in Open Food Facts importer for ASTRI.
 *
 * - Does not run during build or at runtime.
 * - Never edits data/catalog.json.
 * - Writes a separate ODbL-attributed dataset to data/open-food-facts-products.json.
 * - Respects OFF's published search limit (10 requests/minute).
 *
 * Run: node scripts/import-open-food-facts.mjs
 * Optional: OFF_MAX_PAGES=2 node scripts/import-open-food-facts.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { dirname, resolve } from "node:path";

const ROOT = process.cwd();
const OUTPUT = resolve(ROOT, "data/open-food-facts-products.json");
const USER_AGENT = process.env.OFF_USER_AGENT || "ASTRI/1.0 (catalogue-import; contact project maintainer)";
const MAX_PAGES = Math.max(1, Number(process.env.OFF_MAX_PAGES || 1));
const PAGE_SIZE = 100;
const DELAY_MS = 6500;

// Broad food-only taxonomy queries. Non-food categories must use their own sources.
const TAXONOMY = [
  ["Atta, Rice & Dal", "en:cereals-and-their-products"],
  ["Dairy, Bread & Eggs", "en:dairies"],
  ["Bakery & Biscuits", "en:biscuits-and-cakes"],
  ["Dry Fruits & Cereals", "en:nuts"],
  ["Drinks & Juices", "en:beverages"],
  ["Tea, Coffee & Milk Drinks", "en:coffees"],
  ["Instant Food", "en:prepared-meals"],
  ["Chips & Namkeen", "en:salty-snacks"],
  ["Sweets & Chocolates", "en:sweets"],
  ["Sauces & Spreads", "en:sauces"],
  ["Oil, Ghee & Masala", "en:edible-oils"],
  ["Frozen Foods", "en:frozen-foods"],
  ["Organic & Healthy Foods", "en:plant-based-foods"],
];

const clean = (v) => typeof v === "string" ? v.trim() : "";
const seen = new Set();
const products = [];

async function request(url) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept": "application/json" } });
  if (response.status === 429 || response.status === 503) {
    throw new Error(`Open Food Facts throttled the import (HTTP ${response.status}). Wait and rerun; no existing catalogue data was changed.`);
  }
  if (!response.ok) throw new Error(`Open Food Facts request failed: HTTP ${response.status}`);
  return response.json();
}

for (const [category, tag] of TAXONOMY) {
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      categories_tags_en: tag,
      page: String(page),
      page_size: String(PAGE_SIZE),
      sort_by: "popularity_key",
      fields: "code,product_name,brands,image_front_url,categories_tags_en,quantity",
    });
    const payload = await request(`https://world.openfoodfacts.org/api/v2/search?${params}`);
    for (const item of payload.products || []) {
      const name = clean(item.product_name);
      const barcode = clean(item.code);
      if (!name || !barcode || seen.has(barcode)) continue;
      seen.add(barcode);
      products.push({
        id: `off-${barcode}`,
        name,
        brand: clean(item.brands) || null,
        category,
        quantity: clean(item.quantity) || null,
        barcode,
        imageUrl: clean(item.image_front_url) || null,
        source: "Open Food Facts",
        sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
        dataLicense: "ODbL-1.0",
        imageLicense: "Verify image-specific licence before public display",
        priceINR: null,
      });
    }
    if (page < MAX_PAGES) await sleep(DELAY_MS);
  }
  await sleep(DELAY_MS);
}

const output = {
  dataset: "ASTRI Open Food Facts import",
  generatedAt: new Date().toISOString(),
  source: "https://world.openfoodfacts.org",
  sourceLicense: "Open Database License (ODbL-1.0); attribution and share-alike obligations apply",
  imagePolicy: "Image URLs are source references only. Verify each image's licence before public display.",
  note: "Open Food Facts provides food data, not verified retail prices. priceINR is null and must be populated from an authorized price source.",
  count: products.length,
  products,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Saved ${products.length} unique food records to ${OUTPUT}`);
console.log("The live catalogue was not modified. Review records, image rights, categories and prices before integration.");
