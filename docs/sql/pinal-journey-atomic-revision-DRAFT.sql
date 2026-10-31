-- DRAFT ONLY. Do not apply until reviewed/tested. Pinal BOOST only; Northern AZ unaffected.
-- Authenticated atomic revision read/write for the existing Pinal journey.
-- Other legacy writers still need migration; a draft frontend alone cannot guarantee concurrency safety.
begin;

create or replace function public.boost_pinal_journey_revision(p_time timestamptz)
returns text language sql immutable set search_path = '' as $f$
select case when p_time is null then null else
  to_char(p_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
end
$f$;

create or replace function public.boost_pinal_load_versioned()
returns jsonb language plpgsql security definer set search_path = '' as $f$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_row public.pinal_boost_journeys%rowtype;
begin
  if v_uid is null or v_email = '' then raise exception 'Authentication required'; end if;
  select * into v_row from public.pinal_boost_journeys
   where user_id=v_uid
   order by updated_at desc limit 1;
  if not found then
    -- Do not attach another linked user's journey merely because an email matches.
    return jsonb_build_object('journey',null,'revision',null);
  end if;
  if lower(coalesce(v_row.participant_email,''))<>v_email then
    raise exception 'Participant identity requires verification';
  end if;
  return jsonb_build_object('journey',v_row.journey_data,
    'revision',public.boost_pinal_journey_revision(v_row.updated_at));
end
$f$;

create or replace function public.boost_pinal_save_if_revision(
  p_journey jsonb, p_revision text
) returns jsonb language plpgsql security definer set search_path = '' as $f$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_row public.pinal_boost_journeys%rowtype;
  v_name text;
  v_career text;
  v_path text;
  v_new_id uuid;
  v_saved_revision text;
begin
  if v_uid is null or v_email='' or p_journey is null or
     jsonb_typeof(p_journey)<>'object' then
    raise exception 'Authenticated user and journey object are required';
  end if;
  if nullif(lower(trim(coalesce(p_journey #>> '{participant,email}',v_email))),'')<>v_email then
    raise exception 'Journey identity mismatch';
  end if;
  -- Serializes both the first insert and subsequent updates for this user.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text,1257));
  select * into v_row from public.pinal_boost_journeys
   where user_id=v_uid order by updated_at desc limit 1 for update;
  v_name := nullif(trim(coalesce(p_journey #>> '{participant,name}',
                                    p_journey->>'participantName','')),'');
  v_career := nullif(trim(coalesce(p_journey->>'primaryCareerTitle',
                                  p_journey #>> '{modules,module1,primaryCareer}','')),'');
  v_path := nullif(trim(coalesce(p_journey #>> '{portal,pathway}',
                                p_journey->>'selectedPathway','')),'');
  if found then
    if lower(coalesce(v_row.participant_email,''))<>v_email then
      return jsonb_build_object('saved',false,'conflict',true,'reason','identity_mismatch');
    end if;
    if p_revision is distinct from public.boost_pinal_journey_revision(v_row.updated_at) then
      return jsonb_build_object('saved',false,'conflict',true,'reason','revision_changed',
               'revision',public.boost_pinal_journey_revision(v_row.updated_at));
    end if;
    update public.pinal_boost_journeys set
       journey_data=p_journey,
       participant_name=coalesce(v_name,participant_name),
       primary_career_title=coalesce(v_career,primary_career_title),
       selected_pathway=coalesce(v_path,selected_pathway),
       updated_at=clock_timestamp()
     where id=v_row.id
     returning public.boost_pinal_journey_revision(updated_at) into v_saved_revision;
  else
    if p_revision is not null then
      return jsonb_build_object('saved',false,'conflict',true,'reason','journey_missing');
    end if;
    if exists(select 1 from public.pinal_boost_journeys where lower(participant_email)=v_email)
      then return jsonb_build_object('saved',false,'conflict',true,'reason','email_already_claimed');
    end if;
    v_new_id:=gen_random_uuid();
    insert into public.pinal_boost_journeys
      (id,access_token_hash,user_id,participant_name,participant_email,
       region,primary_career_title,selected_pathway,journey_data,updated_at)
    values
      (v_new_id,encode(extensions.digest(v_new_id::text||':'||v_email,'sha256'),'hex'),
       v_uid,v_name,v_email,'Pinal County',v_career,v_path,p_journey,clock_timestamp())
    returning public.boost_pinal_journey_revision(updated_at) into v_saved_revision;
  end if;
  return jsonb_build_object('saved',true,'conflict',false,'revision',v_saved_revision);
end
$f$;

revoke all on function public.boost_pinal_journey_revision(timestamptz) from public,anon,authenticated;
revoke all on function public.boost_pinal_load_versioned() from public,anon;
revoke all on function public.boost_pinal_save_if_revision(jsonb,text) from public,anon;
grant execute on function public.boost_pinal_load_versioned() to authenticated;
grant execute on function public.boost_pinal_save_if_revision(jsonb,text) to authenticated;
commit;
