# ASTRI catalogue expansion — safe import workflow

## Current state
The storefront reads `data/catalog.json`. Keep this file unchanged until a replacement catalogue passes validation. The starter catalogue currently has 59 categories and 333 product entries; many categories are below the requested 200–250 target.

## Safe Open Food Facts import
Run the opt-in importer from the repository root:

```sh
node scripts/import-open-food-facts.mjs
```

It writes only `data/open-food-facts-products.json`. It never runs as part of the website build, and it never edits `data/catalog.json`. The default is one page per taxonomy query; use `OFF_MAX_PAGES` to increase page depth deliberately. The importer waits between requests and stops on throttling instead of hammering the API.

Set `OFF_USER_AGENT` to a real project contact string before production-scale use.

## Required review before storefront integration
- Deduplicate by barcode and normalized product name.
- Confirm the actual product belongs in its mapped ASTRI category.
- Treat missing/uncertain brand, size and image fields as missing; do not fabricate them.
- Open Food Facts does not supply reliable Indian retail prices; source prices separately and lawfully. Imported `priceINR` remains null.
- OFF database data is ODbL-licensed and requires attribution/share-alike compliance. Do not merge it into a proprietary database without reviewing the obligations.
- Image rights are separate from database rights. Verify image-specific licence and attribution before displaying each image.
- Never use a generic stock image as an exact product photograph.
- Do not add medicines, prescription products, or regulated goods to sale without appropriate legal and operational checks.

## Category target
Target 200–250 verified sellable products per active category. The target is not met by placeholders, variants counted as separate products without justification, or records without a trustworthy product identity. Report verified counts per category and the overall unique total.

## Release safety
- Keep imported data isolated until schema and rendering tests pass.
- Test a staging/preview build before production.
- Confirm product cards tolerate missing images/prices and paginate large categories.
- No deployment is part of this import workflow.
