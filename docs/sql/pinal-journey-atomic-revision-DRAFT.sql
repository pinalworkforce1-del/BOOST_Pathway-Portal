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


-- Stable, meaningful evidence comparisons; ignore timestamps/browser snapshots.
create or replace function public.boost_pinal_career_key(p_module jsonb)
returns jsonb language sql immutable set search_path='' as $f$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'title',case when jsonb_typeof(x.value)='string' then trim(both '"' from x.value::text)
                   else coalesce(x.value->>'title',x.value->>'careerTitle',x.value->>'occupation','') end,
      'soc',case when jsonb_typeof(x.value)='object' then coalesce(x.value->>'soc',x.value->>'socCode','')
                  else '' end
    ) order by (case when jsonb_typeof(x.value)='object' then coalesce(x.value->>'soc',x.value->>'socCode','') else '' end),
                x.value::text
  ),'[]'::jsonb)
  from jsonb_array_elements(
    case when jsonb_typeof(p_module->'selected')='array' and jsonb_array_length(p_module->'selected')>0
      then p_module->'selected'
      when jsonb_typeof(p_module->'careers')='array' then p_module->'careers'
      else '[]'::jsonb end
  ) x(value)
$f$;
create or replace function public.boost_pinal_evidence_key(p_module text,p_evidence jsonb)
returns jsonb language sql immutable set search_path='' as $f$
  select case p_module
    when 'module1' then jsonb_build_object(
      'careers',public.boost_pinal_career_key(p_evidence),
      'scores',coalesce(p_evidence->'interestScores',p_evidence->'scores','{}'::jsonb),
      'drivers',coalesce(p_evidence#>'{alignmentProfile,validatedWorkDrivers}','[]'::jsonb))
    when 'module2' then jsonb_build_object(
      'careers',public.boost_pinal_career_key(p_evidence),
      'fields',coalesce(p_evidence->'fields','{}'::jsonb),
      'validation',coalesce(p_evidence->'validationBySoc','{}'::jsonb))
    when 'module3' then jsonb_build_object(
      'careers',public.boost_pinal_career_key(p_evidence),
      'fields',coalesce(p_evidence->'fields','{}'::jsonb),
      'startingPoint',coalesce(p_evidence->'startingPoint','{}'::jsonb),
      'mobilityPath',coalesce(p_evidence->'mobilityPath','""'::jsonb),
      'reportCreated',coalesce(p_evidence->'reportCreated','false'::jsonb))
    when 'module4' then jsonb_build_object(
      'career',coalesce(p_evidence->'career',p_evidence->'selectedCareer','null'::jsonb),
      'careerTitle',coalesce(p_evidence->'careerTitle','""'::jsonb),
      'selectedSoc',coalesce(p_evidence->'selectedSoc','""'::jsonb),
      'route',coalesce(p_evidence->'route',p_evidence->'participantDirection',p_evidence#>'{decision,code}','""'::jsonb),
      'answers',coalesce(p_evidence->'answers','{}'::jsonb),
      'decision',coalesce(p_evidence->'decision','{}'::jsonb))
    else '{}'::jsonb end
$f$;

-- Trust only the persisted record's stale markers, not a stale browser's attempt
-- to clear them. A fresh, *new* downstream completion may resolve a review in order.
create or replace function public.boost_pinal_reconcile_reviews(
  p_old jsonb, p_new jsonb, p_now timestamptz)
returns jsonb language plpgsql set search_path='' as $f$
declare
 v_oldmods jsonb := case when jsonb_typeof(p_old->'modules')='object' then p_old->'modules' else '{}'::jsonb end;
 v_newmods jsonb := case when jsonb_typeof(p_new->'modules')='object' then p_new->'modules' else '{}'::jsonb end;
 v_stale jsonb := case when jsonb_typeof(p_old->'staleModules')='object' then p_old->'staleModules' else '{}'::jsonb end;
 v_oldprogress jsonb := case when jsonb_typeof(p_old->'progress')='object' then p_old->'progress' else '{}'::jsonb end;
 v_progress jsonb := case when jsonb_typeof(p_new->'progress')='object' then p_new->'progress' else '{}'::jsonb end;
 v_newmarks jsonb := '{}'::jsonb;
 v_up text;
 v_down text;
 v_idx int;
 v_end int;
 v_upstream_order text[] := array['module1','module2','module3','module4'];
 v_downstream_order text[] := array['module2','module3','module4','module5'];
 v_o jsonb;v_n jsonb;
 v_old_complete text;v_new_complete text;
 v_can_clear boolean;
 v_result jsonb;
begin
 -- Bring forward old legacy progress statuses even where the old marker is absent.
 foreach v_down in array v_downstream_order loop
   if (v_oldprogress->>v_down)='stale' and not v_stale ? v_down then
     v_stale:=jsonb_set(v_stale,array[v_down],
       jsonb_build_object('reason','Previously flagged in saved BOOST progress; verify before continuing',
                          'markedAt',null,'source','legacy-progress'),true);
   end if;
 end loop;
 for v_idx in 1..4 loop
   v_up:=v_upstream_order[v_idx];
   v_o:=v_oldmods->v_up;
   v_n:=v_newmods->v_up;
   if jsonb_typeof(v_o)='object' and v_o<>'{}'::jsonb
       and jsonb_typeof(v_n)='object' and v_n<>'{}'::jsonb
       and public.boost_pinal_evidence_key(v_up,v_o)
           is distinct from public.boost_pinal_evidence_key(v_up,v_n) then
     v_end:=array_length(v_downstream_order,1);
     for i in v_idx..v_end loop
       v_down:=v_downstream_order[i];
       -- Only mark an experience that has prior submitted evidence.
       if (jsonb_typeof(v_oldmods->v_down)='object' and v_oldmods->v_down<>'{}'::jsonb)
           or v_oldprogress ? v_down then
         v_stale:=jsonb_set(v_stale,array[v_down],
           jsonb_build_object('reason',v_up||' changed after downstream work',
                              'markedAt',p_now,'sourceModule',v_up,
                              'source','verified-upstream-save'),true);
         v_newmarks:=jsonb_set(v_newmarks,array[v_down],'true'::jsonb,true);
       end if;
     end loop;
   end if;
 end loop;
 -- Only a subsequent completion (not an old stale-browser replay)
 -- resolves the pending marker. Earlier reviews must be resolved first.
 foreach v_down in array v_downstream_order loop
   if v_stale ? v_down then
     v_o:=v_oldmods->v_down;
     v_n:=v_newmods->v_down;
     v_old_complete:=v_o->>'completedAt';
     v_new_complete:=v_n->>'completedAt';
     v_can_clear:=not (v_newmarks ? v_down)
       and (v_progress->>v_down)='complete'
       and nullif(v_new_complete,'') is not null
       and v_new_complete is distinct from v_old_complete
       and jsonb_typeof(v_n)='object'
       and (v_down<>'module3' or not v_stale ? 'module2')
       and (v_down<>'module4' or (not v_stale ? 'module2' and not v_stale ? 'module3'))
       and (v_down<>'module5' or (not v_stale ? 'module2' and not v_stale ? 'module3' and not v_stale ? 'module4'));
     if v_can_clear then
       v_stale:=v_stale - v_down;
       v_progress:=jsonb_set(v_progress,array[v_down],'"complete"'::jsonb,true);
     else
       v_progress:=jsonb_set(v_progress,array[v_down],'"stale"'::jsonb,true);
     end if;
   end if;
 end loop;
 v_result:=jsonb_set(coalesce(p_new,'{}'::jsonb),'{progress}',v_progress,true);
 v_result:=jsonb_set(v_result,'{staleModules}',v_stale,true);
 return v_result;
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
  v_effective jsonb;
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
    v_effective:=public.boost_pinal_reconcile_reviews(v_row.journey_data,p_journey,clock_timestamp());
    update public.pinal_boost_journeys set
       journey_data=v_effective,
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
    v_effective:=public.boost_pinal_reconcile_reviews('{}'::jsonb,p_journey,clock_timestamp());
    v_new_id:=gen_random_uuid();
    insert into public.pinal_boost_journeys
      (id,access_token_hash,user_id,participant_name,participant_email,
       region,primary_career_title,selected_pathway,journey_data,updated_at)
    values
      (v_new_id,encode(extensions.digest(v_new_id::text||':'||v_email,'sha256'),'hex'),
       v_uid,v_name,v_email,'Pinal County',v_career,v_path,v_effective,clock_timestamp())
    returning public.boost_pinal_journey_revision(updated_at) into v_saved_revision;
  end if;
  return jsonb_build_object('saved',true,'conflict',false,'revision',v_saved_revision,'journey',v_effective);
end
$f$;

revoke all on function public.boost_pinal_journey_revision(timestamptz) from public,anon,authenticated;
revoke all on function public.boost_pinal_career_key(jsonb) from public,anon,authenticated;
revoke all on function public.boost_pinal_evidence_key(text,jsonb) from public,anon,authenticated;
revoke all on function public.boost_pinal_reconcile_reviews(jsonb,jsonb,timestamptz) from public,anon,authenticated;
revoke all on function public.boost_pinal_load_versioned() from public,anon;
revoke all on function public.boost_pinal_save_if_revision(jsonb,text) from public,anon;
grant execute on function public.boost_pinal_load_versioned() to authenticated;
grant execute on function public.boost_pinal_save_if_revision(jsonb,text) to authenticated;
commit;
