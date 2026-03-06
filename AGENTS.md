# Agents

## Cursor Cloud specific instructions

This is a single Next.js 16 fullstack app (frontend + REST API). No database, Docker, or external service setup is required.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` (port 3000) |
| Lint | `pnpm lint` |
| Tests | `pnpm test` (Vitest) |
| Build | `pnpm build` |

### Notes

- All environment variables have sensible defaults; no `.env` file is needed for local development.
- The app fetches live data from public external APIs (`bav-abfallapp.regioit.de`, `api.abfall.io`). Network access to these endpoints is required for the app to return real data.
- Pre-existing lint errors exist in `.agents/skills/` and `.cursor/skills/` reference files (not project code). The project code itself has one pre-existing lint warning in `components/AddressSearchForm.tsx`.
- Tests run via Vitest in Node environment (no browser needed). All 4 test files (45 tests) should pass.
- The `pnpm.neverBuiltDependencies` field in `package.json` skips native builds for `sharp` and `unrs-resolver` to avoid interactive approval prompts.
