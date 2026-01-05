-- Create a table for public profiles
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Create a table for companies (Tenants)
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  tax_id text not null, -- RIF
  address text,
  phone text,
  email text,
  currency_symbol text default 'Bs.',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.companies enable row level security;

-- Create table for company members
create table public.company_users (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'accountant', 'member', 'viewer')) default 'member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(company_id, user_id)
);

alter table public.company_users enable row level security;

-- Policies for company_users
create policy "Users can view comapnies they belong to"
  on public.company_users for select
  using ( auth.uid() = user_id );

-- Policies for companies
-- Users can view companies if they are in company_users
create policy "Users can view their companies"
  on public.companies for select
  using (
    exists (
      select 1 from public.company_users
      where company_id = public.companies.id
      and user_id = auth.uid()
    )
  );

-- Only admins can update company details
create policy "Admins can update company details"
  on public.companies for update
  using (
    exists (
      select 1 from public.company_users
      where company_id = public.companies.id
      and user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
