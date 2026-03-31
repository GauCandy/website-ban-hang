create or replace view v_user_profiles as
select
  u.id as user_id,
  u.full_name,
  u.email,
  u.phone_number,
  u.gender,
  u.birth_date,
  u.avatar_url,
  u.role,
  u.account_status,
  u.marketing_opt_in,
  u.last_login_at,
  u.created_at,
  u.updated_at,
  coalesce(
    (
      select json_agg(provider_row.provider order by provider_row.provider)
      from (
        select distinct ai.provider
        from auth_identities ai
        where ai.user_id = u.id
      ) as provider_row
    ),
    '[]'::json
  ) as auth_providers,
  exists(
    select 1
    from auth_identities ai
    where ai.user_id = u.id
  ) as has_identity
from users u;
