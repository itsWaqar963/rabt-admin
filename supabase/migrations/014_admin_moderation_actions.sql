-- Admin moderation: ban flag, admin meetup delete, promote/demote via admin_users.
-- Idempotent. Operator: paste in Supabase SQL Editor for the shared project.

-- 1. Ban column on profiles
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

-- Optional grant (profiles already has update for authenticated)
grant update on table public.profiles to authenticated;

-- 2. Admins can UPDATE any profile (ban/unban)
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Admins can DELETE any meetup
drop policy if exists "Admins can delete meetups" on public.meetups;
create policy "Admins can delete meetups"
  on public.meetups for delete to authenticated
  using (public.is_admin());

-- 4. Admins can INSERT/DELETE/UPDATE admin_users (promote/demote)
grant insert, update, delete on table public.admin_users to authenticated;

drop policy if exists "Admins can insert admin_users" on public.admin_users;
create policy "Admins can insert admin_users"
  on public.admin_users for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update admin_users" on public.admin_users;
create policy "Admins can update admin_users"
  on public.admin_users for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete admin_users" on public.admin_users;
create policy "Admins can delete admin_users"
  on public.admin_users for delete to authenticated
  using (public.is_admin());

-- Reports dismiss = DELETE row; 013 granted select/insert/update only
grant delete on table public.user_reports to authenticated;
grant delete on table public.meetup_reports to authenticated;
