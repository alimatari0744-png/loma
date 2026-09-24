create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  city text not null default '',
  district text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, email, city, district, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'district', ''),
    coalesce(new.raw_user_meta_data->>'address', '')
  )
  on conflict (id) do update
    set
      name = excluded.name,
      phone = excluded.phone,
      email = excluded.email,
      city = excluded.city,
      district = excluded.district,
      address = excluded.address,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- CMS bucket writes: only the approved admin email.
drop policy if exists "cms_public_read" on storage.objects;
create policy "cms_public_read"
  on storage.objects for select
  using (bucket_id = 'loma-cms');

drop policy if exists "cms_admin_insert" on storage.objects;
create policy "cms_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'loma-cms'
    and auth.jwt() ->> 'email' = '74abonaif@gmail.com'
  );

drop policy if exists "cms_admin_update" on storage.objects;
create policy "cms_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'loma-cms'
    and auth.jwt() ->> 'email' = '74abonaif@gmail.com'
  )
  with check (
    bucket_id = 'loma-cms'
    and auth.jwt() ->> 'email' = '74abonaif@gmail.com'
  );

drop policy if exists "cms_admin_delete" on storage.objects;
create policy "cms_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'loma-cms'
    and auth.jwt() ->> 'email' = '74abonaif@gmail.com'
  );
