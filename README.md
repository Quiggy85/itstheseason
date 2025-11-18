## It’s The Season – Technical Overview

This repository powers **It’s The Season**, a UK-focused seasonal dropshipping storefront. The app automatically rotates curated product collections around key retail events (January Sales, Valentine’s Day, Mother’s Day, Easter, Father’s Day, Halloween, Black Friday, Cyber Monday, Christmas, etc.).

### Core stack

- **Frontend:** Next.js (App Router) + React + Tailwind CSS
- **API layer:** Vercel serverless functions wrapping the CJ Dropshipping API with rate-limit aware queuing & caching
- **Database & auth:** Supabase (PostgreSQL + GoTrue) for user accounts, profiles, addresses, orders, and seasonal scheduling
- **Payments:** Stripe Checkout + Webhooks

### Environment variables

Create a `.env.local` (never committed) using the template below:

```bash
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# --- Stripe ---
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# --- CJ Dropshipping ---
CJ_API_BASE_URL="https://api.mycjdomain.com"
CJ_API_ACCESS_KEY="..."
CJ_API_SECRET_KEY="..."

# --- App configuration ---
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Local development

```bash
npm install
npm run dev
# App served at http://localhost:3000
```

### Project structure (initial)

```
src/
  app/              # Next.js app router entries
  config/           # Seasonal event definitions and constants
  lib/              # Supabase, Stripe, CJ API, and env helpers
supabase/
  schema.sql        # Database definitions (WIP)
```

### Initial roadmap

1. Implement environment helpers and Supabase/Stripe clients.
2. Scaffold seasonal catalogue flow backed by Supabase + CJ API caching.
3. Wire Stripe Checkout, orders, and user dashboards.
4. Polish UI (bright, distinctive, accessible) and prepare for Vercel deployment.

Deployment will target **Vercel** once the initial feature set is committed. Supabase and Stripe credentials should be stored as environment variables in Vercel after linking the project.
