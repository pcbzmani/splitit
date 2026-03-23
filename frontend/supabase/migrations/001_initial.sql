-- ============================================================
-- SplitIt — Initial Database Schema
-- Run in Supabase SQL Editor or via: supabase db push
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  phone text,
  email text,
  avatar_url text,
  currency_preference text not null default 'USD',
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'supporter')),
  created_at timestamptz not null default now()
);

-- Friendships
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id)
);

-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- Group Members
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  paid_by uuid references public.profiles(id) on delete set null not null,
  group_id uuid references public.groups(id) on delete set null,
  split_type text not null default 'equal' check (split_type in ('equal', 'percentage', 'exact', 'shares')),
  category text not null default 'other' check (category in ('food', 'transport', 'accommodation', 'entertainment', 'utilities', 'shopping', 'health', 'other')),
  receipt_url text,
  ai_captured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Expense Splits
create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount >= 0),
  is_settled boolean not null default false,
  settled_at timestamptz
);

-- Settlements
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references public.profiles(id) on delete set null not null,
  to_user uuid references public.profiles(id) on delete set null not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD',
  group_id uuid references public.groups(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text not null default 'pro',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Donations
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  amount integer not null,
  currency text not null default 'USD',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- Feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null default 'general' check (type in ('bug', 'feature', 'general')),
  message text not null,
  rating integer check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.donations enable row level security;
alter table public.feedback enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Friendships policies
create policy "Users can view their friendships" on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can create friend requests" on public.friendships for insert with check (auth.uid() = requester_id);
create policy "Users can update their friendship" on public.friendships for update using (auth.uid() = addressee_id);

-- Groups policies
create policy "Group members can view group" on public.groups for select using (
  exists (select 1 from public.group_members where group_id = id and user_id = auth.uid())
);
create policy "Authenticated users can create groups" on public.groups for insert with check (auth.uid() = created_by);

-- Group members policies
create policy "Group members can view members" on public.group_members for select using (
  exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
);
create policy "Authenticated users can join groups" on public.group_members for insert with check (auth.uid() = user_id);

-- Expenses policies
create policy "Users can view their expenses" on public.expenses for select using (
  paid_by = auth.uid() or
  exists (select 1 from public.expense_splits where expense_id = id and user_id = auth.uid())
);
create policy "Authenticated users can create expenses" on public.expenses for insert with check (auth.uid() = paid_by);
create policy "Payers can update their expense" on public.expenses for update using (auth.uid() = paid_by);
create policy "Payers can delete their expense" on public.expenses for delete using (auth.uid() = paid_by);

-- Expense splits policies
create policy "Users can view splits they're part of" on public.expense_splits for select using (
  user_id = auth.uid() or
  exists (select 1 from public.expenses e where e.id = expense_id and e.paid_by = auth.uid())
);
create policy "Payers can create splits" on public.expense_splits for insert with check (
  exists (select 1 from public.expenses where id = expense_id and paid_by = auth.uid())
);
create policy "Users can update own split (settle)" on public.expense_splits for update using (user_id = auth.uid());

-- Settlements policies
create policy "Users can view their settlements" on public.settlements for select using (auth.uid() = from_user or auth.uid() = to_user);
create policy "Users can create settlements" on public.settlements for insert with check (auth.uid() = from_user);

-- Subscriptions policies
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- Feedback - allow anonymous inserts
create policy "Anyone can submit feedback" on public.feedback for insert with check (true);
create policy "Users can view own feedback" on public.feedback for select using (user_id = auth.uid() or user_id is null);

-- ============================================================
-- Trigger: auto-create profile after signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, display_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), new.phone, 'User'),
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
