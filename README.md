# Mad Mallard Catalog Converter

[![JavaScript](https://img.shields.io/badge/JavaScript-browser-F7DF1E?logo=javascript)](src/app.js) [![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite)](package.json) [![PDF.js](https://img.shields.io/badge/PDF.js-local_extraction-red)](THIRD_PARTY.md) [![Docker](https://img.shields.io/badge/Docker-configured-2496ED?logo=docker)](Dockerfile) [![Vercel](https://img.shields.io/badge/Vercel-configured-black?logo=vercel)](vercel.json)

[![CI](https://github.com/drakeg/madmallard-catalog-converter/actions/workflows/ci.yml/badge.svg)](https://github.com/drakeg/madmallard-catalog-converter/actions/workflows/ci.yml) [![Pages](https://github.com/drakeg/madmallard-catalog-converter/actions/workflows/pages.yml/badge.svg)](https://github.com/drakeg/madmallard-catalog-converter/actions/workflows/pages.yml) [![License](https://img.shields.io/github/license/drakeg/madmallard-catalog-converter)](LICENSE)

[![Issues](https://img.shields.io/github/issues/drakeg/madmallard-catalog-converter)](https://github.com/drakeg/madmallard-catalog-converter/issues) [![PRs](https://img.shields.io/github/issues-pr/drakeg/madmallard-catalog-converter)](https://github.com/drakeg/madmallard-catalog-converter/pulls) [![Contributions](https://img.shields.io/badge/Contributions-welcome-green)](CONTRIBUTING.md)

Test site: https://drakeg.github.io/madmallard-catalog-converter/

Independent browser-local supplier PDF/CSV review prototype. Select a text PDF or CSV, map extracted columns, edit and verify rows, then download reviewed or exception CSV files. No file content is uploaded or persisted. Reload clears the workspace. No Python backend is included: PDF.js enables static GitHub Pages hosting.

## Guided demo and CSV handoff

1. Open the [test site](https://drakeg.github.io/madmallard-catalog-converter/) and select **Try sample data (opens here)**. Two fictional products appear directly in the review table; no sample file download or second upload is required.
2. For your own PDF or CSV, select the file, map columns to SKU, description, price and unit, and apply the mapping. Remove headers and non-product rows.
3. Compare every SKU and supplier price against the original document, correct errors, and check **Verified?** for confirmed products. Edits reset verification.
4. **Download reviewed CSV** creates `reviewed-catalog.csv` with only verified, valid products. Open it with Excel, LibreOffice Calc or Google Sheets. Match the columns to your target inventory import template, then import manually.
5. **Download exceptions CSV** creates `needs-review.csv` with unverified or invalid rows, including review status, warnings, source, `workspace_id` and `row_id`. Edit SKU, description, price or unit in a spreadsheet, save as CSV, and **Upload corrected needs-review.csv** to the same open browser workspace. Preview the differences, then click **Apply corrections**. Corrected rows remain unverified until reviewed against the source. Do not change identity columns or close/reload the workspace before importing. Mismatched/duplicate IDs reject the entire file; no partial update occurs. This exceptions CSV is not an inventory import file.

**Important:** The reviewed CSV is final output; the exceptions CSV can be re-uploaded for corrections. This app does not integrate with inventory systems, and synthetic sample data must not be imported into actual inventory.

## Run

```sh
npm ci
npm test
npm run dev -- --port 18880
npm run build
npm run preview -- --host 0.0.0.0 --port 18880
# Optional Docker serving after build:
docker compose up --build -d
```

Central standards adoption is recorded in STANDARDS.md.

GitHub Pages publishes dist/ from main using Actions; relative asset URLs support project subpaths. vercel.json provides an alternative deployment. Pages is only for a noncommercial testing prototype, not paid SaaS or checkout. Files remain local, but hosting providers receive normal page requests. No analytics or external CDNs are used.

## Boundaries

10 MB, 20 PDF pages and 500 rows (plus a header). PDFs are grouped by text baseline; complex tables, merged/multiline cells and scanned images need manual handling or a later backend. Headers are extracted too: keep them unchecked or remove them. Exception CSVs include validation reasons and review status. Remapping resets verification. Each edit invalidates verification. Export of reviewed rows excludes unchecked, duplicate or invalid rows. Price validation accepts nonnegative decimals without symbols; source currency must be verified manually. CSV formula-looking cells are prefixed with an apostrophe. No import into customer inventory is performed.

See SPRINTS.md, BACKLOG.md, PILOT.md, SECURITY.md and THIRD_PARTY.md. Never infer customer demand from the demo.
