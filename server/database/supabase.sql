-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.group (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_pkey PRIMARY KEY (id)
);
CREATE TABLE public.group_members (
  user_id uuid NOT NULL,
  group_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (user_id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group(id) ON DELETE CASCADE,
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION change_student_group(student_id uuid, new_group_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete existing memberships for that user
  DELETE FROM public.group_members WHERE user_id = student_id;
  -- Insert the new one
  INSERT INTO public.group_members (user_id, group_id)
  VALUES (student_id, new_group_id);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.presentations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  name_file text,
  path_file text,
  group_id uuid,
  feedback text,
  uploaded_at timestamp with time zone DEFAULT now(),
  active boolean NOT NULL DEFAULT false,
  point real,
  CONSTRAINT presentations_pkey PRIMARY KEY (id),
  CONSTRAINT presentations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group(id)
);
CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 0::numeric AND rating <= 20::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_presentation_id_fkey FOREIGN KEY (presentation_id) REFERENCES public.presentations(id),
  CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  password text,
  reset_password text DEFAULT '123'::text,
  role text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);