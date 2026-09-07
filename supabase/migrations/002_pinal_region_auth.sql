-- Shared BOOST project: region-safe authenticated journey lookup.
-- Adds a new function only; Northern BOOST tables and functions remain unchanged.

create or replace function public.boost_load_my_journey_for_region(
  p_region text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_journey jsonb;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' or nullif(trim(p_region), '') is null then
    return null;
  end if;

  select b.journey_data
    into v_journey
    from public.boost_journeys b
   where lower(b.participant_email) = v_email
     and lower(b.region) = lower(trim(p_region))
   order by b.updated_at desc
   limit 1;

  return v_journey;
end;
$$;

revoke all on function public.boost_load_my_journey_for_region(text) from public, anon;
grant execute on function public.boost_load_my_journey_for_region(text) to authenticated;

comment on function public.boost_load_my_journey_for_region(text)
is 'Returns the signed-in participant most recent BOOST journey for one requested region.';
