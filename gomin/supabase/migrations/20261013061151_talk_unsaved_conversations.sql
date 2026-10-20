-- Only the authenticated server may pass a member ID to this listing.
create function public.gomin_talk_list_unsaved(p_member_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
    select coalesce(jsonb_agg(to_jsonb(item) order by item.updated_at desc, item.id desc), '[]'::jsonb)
    from (
        select c.id, first_message.content as title, c.updated_at
        from public.conversations c
        join lateral (
            select m.content from public.conversation_messages m
            where m.conversation_id = c.id and m.role = 'user'
            order by m.seq_no limit 1
        ) first_message on true
        where c.member_id = p_member_id
          and not exists (
              select 1 from public.conversation_summaries s
              join public.diary_results r on r.summary_id = s.id and r.member_id = s.member_id
              join public.collection_entries e on e.source_result_id = r.id and e.member_id = r.member_id
              where s.conversation_id = c.id and s.member_id = c.member_id
          )
    ) item;
$$;
revoke all on function public.gomin_talk_list_unsaved(uuid) from public, anon, authenticated;
grant execute on function public.gomin_talk_list_unsaved(uuid) to service_role;
