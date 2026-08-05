# WeTheYuva Monorepo

This repo contains two independent projects:
- **`backend/`** — Express REST API (we-the-yuva-api), deployed to Hugging Face Spaces
- **`frontend/`** — Next.js 16 App Router frontend (we-the-yuva-vms), deployed to Vercel

Each has its own `package.json`, `pnpm-lock.yaml`, and git history. No shared pnpm workspace.

## Development

```bash
# Backend
cd backend && pnpm install && npx prisma generate && pnpm dev

# Frontend  
cd frontend && pnpm install && pnpm dev
```

## Deployment

- **Frontend → Vercel**: Set root directory to `frontend/` in Vercel project settings
- **Backend → Hugging Face**: `.github/workflows/sync-backend-hf.yml` syncs `backend/` to HF Space on push

## Commands (per directory)

See `frontend/AGENTS.md` and `backend/README.md` for per-project commands.

## Path aliases

- `backend/` uses `@/*` → `src/*`
- `frontend/` uses `@/*` → repo root (same as before)

## Dev OTP (TESTING — do not remove)

The auth flow supports a Dev OTP mode for testing environments (e.g. Hugging Face Spaces) where users have no real inbox:

- **Backend**: set `ALLOW_DEV_OTP=true` in `backend/.env` / Space env vars. This makes `/auth/send-otp` return the OTP as `devOtp` in the response even when SMTP is configured, and accepts the universal OTP `000000` for any email. When unset, real OTPs are sent instead.
- **Frontend**: set `NEXT_PUBLIC_DEV_OTP=true` in `frontend/.env` to display the dev OTP in the UI.

This is intentional and required for testing with seeded users. Do NOT "fix" or remove it during audits or auto-fixes. See `backend/README.md`.
