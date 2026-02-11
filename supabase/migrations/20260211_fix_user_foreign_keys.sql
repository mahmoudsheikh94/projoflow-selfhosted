-- ============================================================
-- Fix missing foreign key relationships to users table
-- Required for PostgREST joins in assignment queries
-- ============================================================

-- Add foreign key from workspace_members to public.users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workspace_members_user_id_users_fkey'
    AND table_name = 'workspace_members'
  ) THEN
    ALTER TABLE workspace_members 
    ADD CONSTRAINT workspace_members_user_id_users_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from client_users to public.users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'client_users_user_id_users_fkey'
    AND table_name = 'client_users'
  ) THEN
    ALTER TABLE client_users 
    ADD CONSTRAINT client_users_user_id_users_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Reload PostgREST schema cache to pick up new relationships
NOTIFY pgrst, 'reload schema';
