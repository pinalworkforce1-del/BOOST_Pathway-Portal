-- Shared BOOST project: authenticated region-safe save.
-- Updates the signed-in participant's most recent row for a region, or creates it.

create or replace function public.boost_save_my_journey_for_region(
  p_region text,
  p_journey jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_name text;
  v_region text;
  v_primary text;
  v_id uuid;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_region := nullif(trim(p_region), '');

  if v_email = '' or v_region is null or p_journey is null then
    raise exception 'Authenticated BOOST user, region, and journey are required';
  end if;

  v_name := nullif(trim(p_journey #>> '{participant,name}'), '');
  v_primary := nullif(trim(p_journey #>> '{module4,career,title}'), '');

  select b.id
    into v_id
    from public.boost_journeys b
   where lower(b.participant_email) = v_email
     and lower(b.region) = lower(v_region)
   order by b.updated_at desc
   limit 1;

  if v_id is null then
    v_id := gen_random_uuid();
    insert into public.boost_journeys(
      id, access_token_hash, participant_name, participant_email,
      region, primary_career_title, journey_data
    ) values (
      v_id,
      encode(extensions.digest(v_id::text || ':' || v_email, 'sha256'), 'hex'),
      v_name, v_email, v_region, v_primary, p_journey
    );
  else
    update public.boost_journeys
       set participant_name = coalesce(v_name, participant_name),
           participant_email = v_email,
           region = v_region,
           primary_career_title = v_primary,
           journey_data = p_journey,
           updated_at = now()
     where id = v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.boost_save_my_journey_for_region(text,jsonb)
from public, anon;

grant execute on function public.boost_save_my_journey_for_region(text,jsonb)
to authenticated;
