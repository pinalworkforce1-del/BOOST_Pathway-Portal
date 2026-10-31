-- DRAFT: deploy alongside new authenticated CAS RPC and updated Pinal frontend.
-- Cached older Pinal scripts fail safely rather than overwriting a newer journey.
-- The Northern AZ branch of boost_save_my_journey_for_region remains byte-for-byte unchanged.
-- Do not deploy these guards before versioned Pinal frontend is ready.
begin;

CREATE OR REPLACE FUNCTION public.boost_save_my_journey_for_region(p_region text, p_journey jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid;
  v_email text;
  v_name text;
  v_region text;
  v_primary text;
  v_h3 text;
  v_path text;
  v_industry text;
  v_id uuid;
begin
  v_user_id := auth.uid();
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_region := nullif(trim(p_region), '');

  if v_user_id is null or v_email = '' or v_region is null or p_journey is null then
    raise exception 'Authenticated BOOST user, region, and journey are required';
  end if;

  -- Fail closed for cached legacy Pinal clients. New Pinal clients use
  -- boost_pinal_save_if_revision; Northern Arizona remains unchanged.
  if lower(v_region) like 'pinal%' then
    raise exception 'Pinal BOOST has moved to revision-protected saving. Refresh the BOOST page and sign in again before saving.' using errcode='PT409';
  end if;

  v_name := nullif(trim(coalesce(p_journey #>> '{participant,name}', p_journey ->> 'participantName')), '');
  v_primary := nullif(trim(coalesce(p_journey ->> 'primaryCareerTitle', p_journey #>> '{modules,module1,primaryCareer}', p_journey #>> '{module4,career,title}')), '');
  v_h3 := nullif(trim(coalesce(p_journey ->> 'h3Status', p_journey #>> '{modules,module1,h3Status}', p_journey #>> '{module4,career,h3Status}')), '');
  v_path := nullif(trim(coalesce(p_journey ->> 'selectedPathway', p_journey #>> '{pathway,selected}')), '');
  v_industry := nullif(trim(p_journey ->> 'selectedIndustry'), '');

  if lower(v_region) like 'pinal%' then
    select b.id into v_id
      from public.pinal_boost_journeys b
     where b.user_id=v_user_id
     order by b.updated_at desc
     limit 1;

    if v_id is null then
      select b.id into v_id
        from public.pinal_boost_journeys b
       where lower(coalesce(b.participant_email,''))=v_email
       order by b.updated_at desc
       limit 1;
    end if;

    if v_id is null then
      v_id := gen_random_uuid();
      insert into public.pinal_boost_journeys(
        id,access_token_hash,user_id,participant_name,participant_email,region,
        primary_career_title,h3_status,selected_pathway,selected_industry,journey_data
      ) values (
        v_id,
        encode(extensions.digest(v_id::text || ':' || v_email, 'sha256'),'hex'),
        v_user_id,v_name,v_email,'Pinal County',v_primary,v_h3,v_path,v_industry,p_journey
      );
    else
      update public.pinal_boost_journeys
         set user_id=v_user_id,
             participant_name=coalesce(v_name,participant_name),
             participant_email=v_email,
             region='Pinal County',
             primary_career_title=coalesce(v_primary,primary_career_title),
             h3_status=coalesce(v_h3,h3_status),
             selected_pathway=coalesce(v_path,selected_pathway),
             selected_industry=coalesce(v_industry,selected_industry),
             journey_data=p_journey,
             updated_at=now()
       where id=v_id;
    end if;
    return v_id;
  end if;

  select b.id into v_id
    from public.boost_journeys b
   where b.user_id=v_user_id and lower(b.region)=lower(v_region)
   order by b.updated_at desc
   limit 1;

  if v_id is null then
    select b.id into v_id
      from public.boost_journeys b
     where lower(b.participant_email)=v_email and lower(b.region)=lower(v_region)
     order by b.updated_at desc
     limit 1;
  end if;

  if v_id is null then
    v_id := gen_random_uuid();
    insert into public.boost_journeys(
      id,access_token_hash,user_id,participant_name,participant_email,region,primary_career_title,journey_data
    ) values (
      v_id,
      encode(extensions.digest(v_id::text || ':' || v_email, 'sha256'),'hex'),
      v_user_id,v_name,v_email,v_region,v_primary,p_journey
    );
  else
    update public.boost_journeys
       set user_id=v_user_id,
           participant_name=coalesce(v_name,participant_name),
           participant_email=v_email,
           region=v_region,
           primary_career_title=v_primary,
           journey_data=p_journey,
           updated_at=now()
     where id=v_id;
  end if;
  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.pinal_boost_save_journey(p_journey_id uuid, p_access_token text, p_journey jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_existing_id uuid;
  v_name text;
  v_email text;
  v_primary text;
  v_h3 text;
  v_path text;
  v_industry text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  -- Legacy device-token API must never bypass the authenticated revision check.
  raise exception 'This Pinal BOOST save method is outdated. Refresh the BOOST page and sign in again before saving.' using errcode='PT409';

  if p_journey_id is null or p_access_token is null or length(p_access_token) < 32 or p_journey is null then
    raise exception 'Invalid Pinal BOOST journey payload';
  end if;

  v_hash := encode(extensions.digest(p_access_token, 'sha256'), 'hex');
  v_name := nullif(trim(coalesce(p_journey #>> '{participant,name}', p_journey ->> 'participantName')), '');
  v_email := nullif(lower(trim(coalesce(p_journey #>> '{participant,email}', p_journey ->> 'participantEmail'))), '');
  v_primary := nullif(trim(coalesce(p_journey ->> 'primaryCareerTitle', p_journey #>> '{modules,module1,primaryCareer}', p_journey #>> '{module4,career,title}')), '');
  v_h3 := nullif(trim(coalesce(p_journey ->> 'h3Status', p_journey #>> '{modules,module1,h3Status}', p_journey #>> '{module4,career,h3Status}')), '');
  v_path := nullif(trim(coalesce(p_journey ->> 'selectedPathway', p_journey #>> '{pathway,selected}')), '');
  v_industry := nullif(trim(p_journey ->> 'selectedIndustry'), '');

  select id into v_existing_id from public.pinal_boost_journeys where user_id=v_uid limit 1;

  if v_existing_id is null then
    insert into public.pinal_boost_journeys(
      id,access_token_hash,user_id,participant_name,participant_email,region,
      primary_career_title,h3_status,selected_pathway,selected_industry,journey_data
    ) values (
      p_journey_id,v_hash,v_uid,v_name,v_email,'Pinal County',
      v_primary,v_h3,v_path,v_industry,p_journey
    );
    return p_journey_id;
  end if;

  update public.pinal_boost_journeys
    set participant_name=coalesce(v_name,participant_name),
        participant_email=coalesce(v_email,participant_email),
        primary_career_title=coalesce(v_primary,primary_career_title),
        h3_status=coalesce(v_h3,h3_status),
        selected_pathway=coalesce(v_path,selected_pathway),
        selected_industry=coalesce(v_industry,selected_industry),
        journey_data=p_journey,
        updated_at=now()
  where id=v_existing_id;

  return v_existing_id;
end;
$function$
;

commit;
