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
