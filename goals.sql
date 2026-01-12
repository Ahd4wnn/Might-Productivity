-- Create Goals Table
create table goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  target_type text check (target_type in ('time', 'count')) not null,
  target_value integer not null,
  current_value integer default 0,
  time_period text check (time_period in ('daily', 'weekly', 'monthly')) not null,
  status text check (status in ('active', 'completed', 'paused')) default 'active',
  keywords text[] default null,
  start_date timestamptz default now(),
  end_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Goal Progress Table (for history/contributions)
create table goal_progress (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references goals(id) on delete cascade not null,
  entry_id uuid references entries(id) on delete cascade not null,
  value_added integer not null,
  recorded_at timestamptz default now()
);

-- Enable RLS
alter table goals enable row level security;
alter table goal_progress enable row level security;

-- Policies for Goals
create policy "Users can view their own goals"
  on goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on goals for delete
  using (auth.uid() = user_id);

-- Policies for Goal Progress
create policy "Users can view their own goal progress"
  on goal_progress for select
  using (auth.uid() = (select user_id from goals where id = goal_id));

create policy "Users can insert their own goal progress"
  on goal_progress for insert
  with check (auth.uid() = (select user_id from goals where id = goal_id));
