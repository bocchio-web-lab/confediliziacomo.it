-- People who can log in. There is no sign-up by design: accounts are made by the registration page
-- (when REGISTRATION_CODE is set) or by `npm run db:create-user`.
create table users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique check (email = lower(email)),
    name text not null,
    password_hash text not null,
    failed_login_attempts integer not null default 0,
    locked_until timestamptz,
    last_login_at timestamptz,
    created_at timestamptz not null default now()
);

-- The primary key is the SHA-256 of the session token stored in the cookie.
create table sessions (
    id text primary key,
    user_id uuid not null references users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index sessions_user_id_idx on sessions (user_id);
create index sessions_expires_at_idx on sessions (expires_at);

-- Password reset: the primary key is the SHA-256 of the token sent by email.
create table password_reset_tokens (
    id text primary key,
    user_id uuid not null references users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index password_reset_tokens_user_id_idx on password_reset_tokens (user_id);
