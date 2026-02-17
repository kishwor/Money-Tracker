-- Money Tracker - Supabase auth profile setup
-- Run in Supabase SQL Editor for your own project.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on public.user_profiles
      for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.user_profiles
      for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.user_profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, username)
  values (new.id, new.email, split_part(coalesce(new.email, ''), '@', 1))
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  -- If finance tables are present, seed starter categories for new users.
  if to_regclass('public.categories') is not null then
    insert into public.categories (user_id, name, type, icon, color)
    values
      (new.id, 'Salary', 'income', 'account-balance-wallet', '#10B981'),
      (new.id, 'Business', 'income', 'business', '#3B82F6'),
      (new.id, 'Food & Dining', 'expense', 'restaurant', '#EF4444'),
      (new.id, 'Transportation', 'expense', 'directions-car', '#F59E0B'),
      (new.id, 'Shopping', 'expense', 'shopping-bag', '#EC4899'),
      (new.id, 'Bills & Utilities', 'expense', 'receipt', '#6366F1'),
      (new.id, 'Entertainment', 'expense', 'movie', '#8B5CF6'),
      (new.id, 'Health', 'expense', 'local-hospital', '#14B8A6')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill starter categories for existing users when categories table exists.
do $$
begin
  if to_regclass('public.categories') is not null then
    insert into public.categories (user_id, name, type, icon, color)
    select
      u.id,
      c.name,
      c.type,
      c.icon,
      c.color
    from auth.users u
    cross join (
      values
        ('Salary', 'income', 'account-balance-wallet', '#10B981'),
        ('Business', 'income', 'business', '#3B82F6'),
        ('Food & Dining', 'expense', 'restaurant', '#EF4444'),
        ('Transportation', 'expense', 'directions-car', '#F59E0B'),
        ('Shopping', 'expense', 'shopping-bag', '#EC4899'),
        ('Bills & Utilities', 'expense', 'receipt', '#6366F1'),
        ('Entertainment', 'expense', 'movie', '#8B5CF6'),
        ('Health', 'expense', 'local-hospital', '#14B8A6')
    ) as c(name, type, icon, color)
    on conflict do nothing;
  end if;
end $$;
