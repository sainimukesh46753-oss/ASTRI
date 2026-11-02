#!/usr/bin/env node
/**
 * Read-only catalogue audit for ASTRI.
 * Never changes catalogue data or website files.
 * Run: node scripts/audit-catalog.mjs
 */
import { readFile } from "node:fs/promises";

const path = new URL("../data/catalog.json", import.meta.url);
const raw = await readFile(path, "utf8");
const data = JSON.parse(raw);
if (!Array.isArray(data.categories)) throw new Error("Invalid catalogue: categories must be an array.");

const seen = new Map();
let total = 0, missingImages = 0, missingPrices = 0, invalidPrices = 0;
const report = [];
for (const category of data.categories) {
  const products = Array.isArray(category.products) ? category.products : [];
  let categoryMissingImages = 0, categoryMissingPrices = 0;
  for (const item of products) {
    const p = typeof item === "string" ? { name: item } : item;
    const name = String(p?.name || "").trim();
    if (!name) continue;
    total++;
    const key = name.toLocaleLowerCase("en");
    seen.set(key, (seen.get(key) || 0) + 1);
    if (!/^https?:\/\//i.test(String(p.imageUrl || ""))) {
      missingImages++;
      categoryMissingImages++;
    }
    if (p.priceINR === undefined || p.priceINR === null || p.priceINR === "") {
      missingPrices++;
      categoryMissingPrices++;
    } else if (!Number.isFinite(Number(p.priceINR)) || Number(p.priceINR) <= 0) {
      invalidPrices++;
    }
  }
  report.push({
    category: category.name || "(unnamed)",
    products: products.length,
    missingImages: categoryMissingImages,
    missingPrices: categoryMissingPrices,
  });
}
const duplicates = [...seen].filter(([, count]) => count > 1);
console.log("ASTRI CATALOGUE AUDIT (read-only)");
console.log(JSON.stringify({
  categories: data.categories.length,
  products: total,
  duplicateNames: duplicates.length,
  missingImages,
  missingPrices,
  invalidPrices,
  categoryTarget: 200,
  categoriesBelowTarget: report.filter(x => x.products < 200).length,
  byCategory: report,
  duplicateExamples: duplicates.slice(0, 30).map(([name, count]) => ({ name, count })),
}, null, 2));
