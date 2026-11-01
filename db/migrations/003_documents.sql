create type document_kind as enum ('prospectus', 'attestation');

create table documents (
    id uuid primary key default gen_random_uuid(),
    kind document_kind not null,
    territory text not null check (territory in ('city', 'province')),
    accord_id text not null,
    -- Progressive numbers: one sequence for each kind and territory (see src/lib/documents/numbering.ts).
    sequence_key text not null,
    document_number integer not null,
    -- The date the accord and the ISTAT index are chosen by: the contract date of an attestation,
    -- the date of a prospectus.
    contract_date date not null,
    title text not null,
    -- What the list shows and searches: who asked for the document, where, and the search text
    -- (lower case, no accents: see src/lib/documents/search.ts).
    applicant_name text not null default '',
    address text not null default '',
    search_text text not null default '',
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

-- The number is unique inside its sequence, also for deleted documents: numbers are never reused.
create unique index documents_sequence_number_idx on documents (sequence_key, document_number);
create index documents_created_at_idx on documents (created_at desc) where deleted_at is null;

-- Last number handed out for each sequence.
create table document_counters (
    sequence_key text primary key,
    last_number integer not null
);

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
