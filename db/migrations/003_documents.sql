create type document_kind as enum ('prospectus', 'attestation');

create table documents (
    id uuid primary key default gen_random_uuid(),
    kind document_kind not null,
    territory text not null check (territory in ('city', 'province')),
    accord_id text not null,
    number text,
    contract_date date not null,
    title text not null,
    -- Everything the user typed in the form (calculation input and details).
    input jsonb not null,
    -- Snapshot of the calculation at the time of the last save.
    result jsonb not null,
    created_by uuid not null references users (id),
    created_at timestamptz not null default now(),
    updated_by uuid not null references users (id),
    updated_at timestamptz not null default now(),
    deleted_by uuid references users (id),
    deleted_at timestamptz
);

create index documents_kind_created_at_idx on documents (kind, created_at desc) where deleted_at is null;

-- Who did what: one row per significant action.
create table audit_log (
    id bigserial primary key,
    user_id uuid references users (id) on delete set null,
    user_label text not null,
    action text not null,
    entity_type text not null,
    entity_id text,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on audit_log (created_at desc);
create index audit_log_entity_idx on audit_log (entity_type, entity_id);
