# Certificate typefaces

Open-source woff2 subsets (SIL Open Font License), fetched by
`scripts/fetch-cert-fonts.sh` and committed on purpose.

**Why they live in the repo.** The renderer is a headless Chrome on a Linux
server; the editor is a browser on somebody's laptop. Naming a font only one of
them has installed does not fail — it silently substitutes, and the certificate
that prints looks nothing like the one that was laid out. Shipping the bytes
removes the question.

- `manifest.tsv` — `<file>	<weight>	<subset>	<unicode-range>`, written by the
  fetch script. **Never hand-edit it**; re-run the script instead.
- `certFonts.js` reads the manifest, builds the CSS stacks, inlines faces into a
  render (base64, because `page.setContent()` has no base URL) and links them for
  the editor (`/api/cert-mgmt/public/fonts.css`, so the browser fetches lazily).

Adding a family: add a `fetch` line to `scripts/fetch-cert-fonts.sh`, re-run it,
then add the entry to `FAMILIES` in `certFonts.js`. The tests in
`tests/certificate-layout-fonts.test.js` check that every catalogue entry has
real files behind it.
