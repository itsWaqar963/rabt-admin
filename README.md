# Rabt Admin

Dense dark ops console for Rabt (Next.js 15 App Router).

## Setup

1. Copy `.env.local.example` → `.env.local` and fill same Supabase URL + anon key as `rabt-pwa`.
2. Ensure your auth user is in `public.admin_users` (see `013_admin_and_moderation.sql` in pwa).
3. **Apply** `supabase/migrations/014_admin_moderation_actions.sql` in the shared Supabase SQL Editor (ban, promote/demote, admin meetup delete, report dismiss grants). Without 014, lists still load; ban / promote / admin-delete meetup fail with UI errors.
4. `npm run dev`

## Auth

Email/password or magic link. Middleware + dashboard layout call `is_admin()`; non-admins are signed out.

## Moderation routes

| Route | Actions |
| --- | --- |
| `/dashboard/users` | Ban/unban, promote/demote admin |
| `/dashboard/meetups` | Delete meetup |
| `/dashboard/reports` | Dismiss (= delete) user/meetup reports |
| `/dashboard/lessons` | Approve / reject submissions |
