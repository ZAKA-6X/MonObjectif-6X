-- Users: Table:
create table public.users (
  id uuid not null default gen_random_uuid() primary key,
  nom text not null,
  prenom text not null,
  password text default null,
  reset_password text not null default '123',
  role text not null,
  created_at timestamp with time zone not null default now()
);

-- ppt file Table 
create table public.presentations (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  name_file text null,
  path_file text null,
  group_id uuid null,
  feedback text null,
  uploaded_at timestamp with time zone null default now(),
  active boolean not null default false,
  point real null,
  constraint presentations_pkey primary key (id),
  constraint presentations_group_id_fkey foreign KEY (group_id) references "group" (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_presentations_group_id on public.presentations using btree (group_id) TABLESPACE pg_default;

-- Group Table:

create table public.group (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone null default now(),
  constraint group_pkey primary key (id)
) TABLESPACE pg_default;

-- group members
create table public.group_members (
  user_id uuid not null,
  group_id uuid not null,
  joined_at timestamp with time zone null default now(),
  constraint group_members_pkey primary key (user_id, group_id),
  constraint group_members_group_id_fkey foreign KEY (group_id) references "group" (id) on delete CASCADE,
  constraint group_members_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Rating table:
create table public.ratings (
  id uuid not null default gen_random_uuid (),
  presentation_id uuid not null,
  user_id uuid not null,
  rating numeric(4, 2) not null,
  created_at timestamp with time zone not null default now(),
  constraint ratings_pkey primary key (id),
  constraint ratings_user_presentation_unique unique (presentation_id, user_id),
  constraint ratings_presentation_id_fkey foreign KEY (presentation_id) references presentations (id) on delete CASCADE,
  constraint ratings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint ratings_rating_check check (
    (
      (rating >= (0)::numeric)
      and (rating <= (20)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ratings_presentation_id on public.ratings using btree (presentation_id) TABLESPACE pg_default;

create index IF not exists idx_ratings_user_id on public.ratings using btree (user_id) TABLESPACE pg_default;