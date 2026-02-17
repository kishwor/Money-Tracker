-- Money Tracker - finance schema for per-user accounting data
-- Run after auth profile setup migration.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_user_created_at
  on public.categories (user_id, created_at);

create index if not exists idx_transactions_user_date_created
  on public.transactions (user_id, date desc, created_at desc);

create index if not exists idx_transactions_category_id
  on public.transactions (category_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categories_set_updated_at on public.categories;
create trigger trg_categories_set_updated_at
before update on public.categories
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_transactions_set_updated_at on public.transactions;
create trigger trg_transactions_set_updated_at
before update on public.transactions
for each row
execute procedure public.set_updated_at();

alter table public.categories enable row level security;
alter table public.transactions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Users can read own categories'
  ) then
    create policy "Users can read own categories"
      on public.categories
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Users can insert own categories'
  ) then
    create policy "Users can insert own categories"
      on public.categories
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Users can update own categories'
  ) then
    create policy "Users can update own categories"
      on public.categories
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Users can delete own categories'
  ) then
    create policy "Users can delete own categories"
      on public.categories
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Users can read own transactions'
  ) then
    create policy "Users can read own transactions"
      on public.transactions
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Users can insert own transactions'
  ) then
    create policy "Users can insert own transactions"
      on public.transactions
      for insert
      with check (
        auth.uid() = user_id
        and (
          category_id is null
          or exists (
            select 1
            from public.categories c
            where c.id = category_id
              and c.user_id = auth.uid()
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Users can update own transactions'
  ) then
    create policy "Users can update own transactions"
      on public.transactions
      for update
      using (auth.uid() = user_id)
      with check (
        auth.uid() = user_id
        and (
          category_id is null
          or exists (
            select 1
            from public.categories c
            where c.id = category_id
              and c.user_id = auth.uid()
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'transactions'
      and policyname = 'Users can delete own transactions'
  ) then
    create policy "Users can delete own transactions"
      on public.transactions
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

create or replace function public.seed_default_categories_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, icon, color)
  values
    (target_user_id, 'Salary', 'income', 'account-balance-wallet', '#10B981'),
    (target_user_id, 'Business', 'income', 'business', '#3B82F6'),
    (target_user_id, 'Food & Dining', 'expense', 'restaurant', '#EF4444'),
    (target_user_id, 'Transportation', 'expense', 'directions-car', '#F59E0B'),
    (target_user_id, 'Shopping', 'expense', 'shopping-bag', '#EC4899'),
    (target_user_id, 'Bills & Utilities', 'expense', 'receipt', '#6366F1'),
    (target_user_id, 'Entertainment', 'expense', 'movie', '#8B5CF6'),
    (target_user_id, 'Health', 'expense', 'local-hospital', '#14B8A6')
  on conflict (user_id, name, type) do nothing;
end;
$$;

create or replace function public.handle_new_finance_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_categories_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_finance on auth.users;
create trigger on_auth_user_created_seed_finance
after insert on auth.users
for each row execute procedure public.handle_new_finance_user();

-- Backfill defaults for users created before this migration.
insert into public.categories (user_id, name, type, icon, color)
select
  u.id as user_id,
  d.name,
  d.type,
  d.icon,
  d.color
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
) as d(name, type, icon, color)
on conflict (user_id, name, type) do nothing;

-- Ensure PostgREST sees new tables and relations immediately.
select pg_notify('pgrst', 'reload schema');
