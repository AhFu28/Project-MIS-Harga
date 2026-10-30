# Project MIS Harga

Apply Ponytail principles from https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md.

Read touched callers, fixtures, configuration and exports before editing. Reuse platform features and existing code. Add the smallest complete change; do not remove validation, loss-preventing error handling, security or accessibility. Logic involving money, date intervals, parsers, security or new branches needs a meaningful focused test. Finish by reporting checks and remaining limits.

Never commit real prices, supplier documents, passwords, API keys, .dev.vars, runtime state or backups to this public repository. API keys belong encrypted in D1 with SETTINGS_ENCRYPTION_KEY in runtime Secrets. No automatic paid-provider fallback. AI produces suggestions/drafts and cannot publish. Keep source and reviewer trails. Never overwrite published prices; withdraw and replace. Enforce Admin/Editor/Viewer roles server-side. Only Admin manages AI settings, credentials, model catalog, users, aliases and canonical items. Preserve individual audit attribution.

Run npm test, npm run build, and npx wrangler deploy --dry-run before reporting a release as ready to try. Deployment on the user's Cloudflare account and live AI connection require separate verification. Use native APIs before adding framework dependencies.
