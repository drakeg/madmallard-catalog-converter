# Validation evidence — 2026-11-20

Initial hosted prototype: https://drakeg.github.io/madmallard-catalog-converter/
Pages deployment 44762150545 succeeded with the PDF loading-task cleanup fix.
A real Chrome test against the hosted project subpath selected synthetic CSV and
PDF files, verified a row, downloaded reviewed CSV, cleared the workspace and
reloaded the sample. No page errors or file-upload POST requests occurred.

Local follow-up review branch: four model tests, two browser workflow tests and
production build passed. npm audit reported zero vulnerabilities at bootstrap.
PR #2 adds row removal, exception reasons, source/license documentation and browser
CI coverage; these additional review controls are not claimed deployed on Pages
until merged. Run npm test, npm run test:browser and npm run build. Browser tests
need Playwright Chromium (CI installs it), or CHROME_PATH pointing to installed
Chrome. Docker and Vercel configurations exist but were not deployed in this run.

No customer documents, paid services, outreach or automatic inventory writes.
Scans, multi-line tables, currency conversion and arbitrary supplier layouts remain
outside the initial prototype. Every exported SKU/price needs source verification.
