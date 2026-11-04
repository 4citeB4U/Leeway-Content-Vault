<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTENT_VAULT.DOCUMENTATION
TAG: LEEWAY.CONTENT_VAULT.DOCUMENTATION.README
5WH:
WHAT = Describe the standalone canonical Content Vault UI extraction.
WHY = Maintain the original Foundry vault's functional UI and artifact handoff contracts independently of Foundry.
WHO = LeeWay Content Vault engineering under Creator authority.
WHERE = README.md
WHEN = 2026-11-04 migration.
HOW = Reuse the Foundry ContentWallet component, extract its contract, store artifacts locally, and publish a Vite-built UI.
LICENSE = Source provenance retained; review upstream mixed notices before redistributing outside the LeeWay owner account.
-->
# LeeWay Content Vault

Standalone Content Vault extracted from [LeeWay Agentic Content Foundry](https://github.com/4citeB4U/Leeway-agentic-content-foundry), originally implemented within `src/App.tsx` as `ContentWallet`.

## Scope and source provenance

The Vault UI preserves the original Foundry design's upload area, search, type filters, artifact cards, media previews, artifact identifiers, and Office Suites / IDE handoffs. It is presented as a full-page application in this repository rather than a floating Foundry panel.

The shared artifact and `leeway.handoff.v1` packet types originate from Foundry's `src/foundry/contracts.ts`. Import/export is portable; Continuum synchronization, authenticated cross-app transfer, and remote execution are **not claimed**.

## Data and limitations

- Working metadata uses browser localStorage; file bytes are held in browser IndexedDB.
- GitHub Pages serves only the frontend. It is **not** an always-on persistence or execution backend.
- Browser storage is origin-scoped: opening this URL does not automatically read Foundry's existing localStorage. Use the Foundry workspace JSON export and **Import Foundry Workspace** here. Never infer missing files from sample cards.
- Handoff actions download a staged `leeway.handoff.v1` packet with an artifact reference. They do not claim that the destination application received it.
- Do not clear original Foundry storage until migration contents and associated bytes are verified.
- Existing Foundry `walletContent[].fileData` data URLs can be imported where present; records without bytes remain metadata-only.

## Local build

```bash
npm install
npm run lint
npm run build
npm run dev
```

Node.js 22+ recommended.

## Deployment

`.github/workflows/deploy-pages.yml` builds `dist` and deploys a GitHub Pages project site at `https://4citeb4u.github.io/Leeway-Content-Vault/`. In repository Settings → Pages, set Source to **GitHub Actions**. The workflow requires Pages write and ID token permissions. A merged workflow file is not proof of successful deployment.

## Acceptance

1. Open the Vault and confirm an empty working set (no demo records).
2. Upload a real text/image/audio/video/PDF file, verify metadata and preview/download, reload and verify persistence.
3. Search/filter, remove an artifact and verify it no longer appears.
4. Export a portable manifest and a staged Office or IDE handoff packet, inspect schema/provenance.
5. Import an authorized Foundry workspace export, verify record IDs/names, compare counts and missing payloads.
6. Confirm built paths use `/Leeway-Content-Vault/assets/` on GitHub Pages, and independently verify a live browser render.

**Evidence state:** This README documents behavior and test requirements; CI and live results must be reported separately.
