# Rabt Admin

Dense dark ops console for Rabt (Next.js 15 App Router).

## Setup

1. Copy `.env.local.example` → `.env.local` and fill same Supabase URL + anon key as `rabt-pwa`.
2. Ensure your auth user is in `public.admin_users` (see `013_admin_and_moderation.sql` in pwa).
3. `npm run dev`

## Auth

Email/password or magic link. Middleware + dashboard layout call `is_admin()`; non-admins are signed out.
