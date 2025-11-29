-- Ensure every Supabase Auth user automatically receives a profile row.
create or replace function public.create_profile_for_new_user()
returns trigger as
$$
begin
  insert into public.profiles (user_id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Friend'),
    coalesce(new.raw_user_meta_data->>'last_name', 'of TuneIt')
  )
  on conflict (user_id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name;

  return new;
end;
$$
language plpgsql
security definer;

drop trigger if exists create_profile_on_auth_user on auth.users;
create trigger create_profile_on_auth_user
  after insert on auth.users
  for each row
  execute procedure public.create_profile_for_new_user();
