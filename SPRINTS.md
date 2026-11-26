# Sprints
## Sprint 0 — Foundation (active)
- [x] Independent public repo, MIT license and Agile/contribution docs
- [x] PDF/CSV selection, local extraction, mapping and editable review
- [x] Validation, verification gate, reviewed/exception export and reset
- [x] CI, Pages workflow, Vercel alternative and optional Docker serving
- [x] Browser PDF/CSV workflow tests passed on connected Mac (Chrome)
- [x] Hosted Pages subpath: PDF/CSV selection, verification, download, reset; no page errors or upload POSTs
- [x] Exception export includes reasons; rows can be removed; browser tests added to CI
## Sprint 1 — Reliable layouts (active) 
- [x] Reconstruct adjacent PDF text fragments within a measured cell, preserving column gaps; add unit regression coverage
- [x] Optional per-PDF-page first-line exclusion with re-verification and regression coverage 
- [ ] Explicit column-position template and continuation handling
- [x] Correction CSV round-trip with stable workspace/row ID, preview and verification reset 
- [x] Saved browser-local mapping profiles with explicit opt-in, format checks, deletion and browser regression tests
- [x] Guided sample and export handoff instructions with browser coverage 
- [x] PDF.js canvas source preview, page navigation and row-to-source-page links with synthetic browser tests
## Sprint 2 — Paid pilot validation
- [ ] Authorized sample from a qualified buyer
- [ ] Measure correction time and extraction accuracy
- [ ] Written acceptance of bounded $299 hypothesis
Definition of done: tests/build green, no unintended uploads, usable review workflow, truthful deployment evidence and current docs.
