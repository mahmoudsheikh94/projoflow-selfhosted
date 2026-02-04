-- ============================================================
-- TaskFlow Pro — Complete Database Schema
-- Run this in a fresh Supabase project's SQL Editor
-- ============================================================

-- ============================================================
-- 1. CUSTOM TYPES (Enums)
-- ============================================================

CREATE TYPE project_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE project_type AS ENUM ('automation', 'internal_system', 'mvp', 'ai_agent', 'consulting', 'other');
CREATE TYPE budget_type AS ENUM ('fixed', 'hourly', 'retainer');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE note_type AS ENUM ('general', 'meeting', 'technical', 'decision');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE budget_range AS ENUM ('under_5k', '5k_10k', '10k_25k', '25k_50k', '50k_plus', 'not_sure');
CREATE TYPE project_timeline AS ENUM ('asap', '1_month', '2_3_months', '3_6_months', 'flexible');
CREATE TYPE comment_author_type AS ENUM ('admin', 'client');
CREATE TYPE client_user_role AS ENUM ('viewer', 'admin');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Admin users (email-based access control)
CREATE TABLE admin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Users (synced from auth.users for FK references)
CREATE TABLE users (
  id uuid PRIMARY KEY, -- matches auth.users.id
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  company text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  status project_status DEFAULT 'draft',
  project_type project_type DEFAULT 'other',
  budget_type budget_type DEFAULT 'hourly',
  budget_amount numeric,
  hourly_rate numeric,
  estimated_hours numeric,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  estimated_hours numeric,
  due_date date,
  position integer DEFAULT 0,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task Comments
CREATE TABLE task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  author_type comment_author_type DEFAULT 'admin',
  author_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task Comment Mentions
CREATE TABLE task_comment_mentions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  mentioned_user_id uuid,
  mentioned_email text NOT NULL,
  notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Time Entries
CREATE TABLE time_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  description text,
  duration_minutes integer NOT NULL,
  date date DEFAULT CURRENT_DATE,
  billable boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notes
CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  note_type note_type DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  project_description text,
  project_type project_type DEFAULT 'other',
  budget_range budget_range,
  timeline project_timeline,
  source text,
  referral text,
  status lead_status DEFAULT 'new',
  notes text,
  converted_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  converted_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  intake_token text,
  token_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Intake Links
CREATE TABLE intake_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text UNIQUE NOT NULL,
  label text,
  expires_at timestamptz,
  max_uses integer,
  use_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Client Users (portal access)
CREATE TABLE client_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role client_user_role DEFAULT 'viewer',
  invited_by uuid,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Client Invitations
CREATE TABLE client_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  role client_user_role DEFAULT 'viewer',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Workspace Settings (singleton)
CREATE TABLE workspace_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT '',
  logo_url text,
  setup_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only allow one row (singleton pattern)
CREATE UNIQUE INDEX workspace_settings_singleton ON workspace_settings ((true));

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comment_mentions_comment_id ON task_comment_mentions(comment_id);
CREATE INDEX idx_task_comment_mentions_task_id ON task_comment_mentions(task_id);
CREATE INDEX idx_task_comment_mentions_mentioned_user_id ON task_comment_mentions(mentioned_user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_intake_token ON leads(intake_token);
CREATE INDEX idx_intake_links_token ON intake_links(token);
CREATE INDEX idx_client_users_user_id ON client_users(user_id);
CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_client_invitations_client_id ON client_invitations(client_id);
CREATE INDEX idx_client_invitations_token ON client_invitations(token);

-- ============================================================
-- 4. VIEW: project_stats
-- ============================================================

CREATE OR REPLACE VIEW project_stats AS
SELECT
  p.id,
  p.name,
  p.status,
  p.budget_amount,
  p.hourly_rate,
  p.estimated_hours,
  COALESCE(SUM(te.duration_minutes), 0) AS total_minutes,
  ROUND(COALESCE(SUM(te.duration_minutes), 0) / 60.0, 2) AS total_hours,
  ROUND(
    COALESCE(SUM(CASE WHEN te.billable THEN te.duration_minutes ELSE 0 END), 0) / 60.0
    * COALESCE(p.hourly_rate, 0),
    2
  ) AS billable_amount,
  COALESCE(COUNT(t.id) FILTER (WHERE t.status IN ('todo', 'in_progress', 'review')), 0) AS open_tasks,
  COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'done'), 0) AS completed_tasks
FROM projects p
LEFT JOIN time_entries te ON te.project_id = p.id
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p.name, p.status, p.budget_amount, p.hourly_rate, p.estimated_hours;

-- ============================================================
-- 5. AUTO-SYNC: auth.users → public.users
-- ============================================================

-- Trigger function to sync new auth users to public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

-- ---- Admin users ----
CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access to admin_users" ON admin_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- Users ----
CREATE POLICY "Authenticated can read users" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- ---- Clients ----
CREATE POLICY "Admins can manage clients" ON clients
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ---- Projects ----
CREATE POLICY "Admins can manage projects" ON projects
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Client users can read their projects
CREATE POLICY "Client users can read their projects" ON projects
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

-- ---- Tasks ----
CREATE POLICY "Admins can manage tasks" ON tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Client users can read tasks in their projects
CREATE POLICY "Client users can read tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id IN (
        SELECT client_id FROM client_users WHERE user_id = auth.uid()
      )
    )
  );

-- ---- Task Comments ----
CREATE POLICY "Authenticated can read comments" ON task_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create comments" ON task_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON task_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON task_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---- Task Comment Mentions ----
CREATE POLICY "Authenticated users can read mentions" ON task_comment_mentions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert mentions" ON task_comment_mentions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role full access to mentions" ON task_comment_mentions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---- Time Entries ----
CREATE POLICY "Admins can manage time entries" ON time_entries
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ---- Notes ----
CREATE POLICY "Admins can manage notes" ON notes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ---- Leads ----
CREATE POLICY "Admins can manage leads" ON leads
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Allow anon to insert leads (from intake form)
CREATE POLICY "Anyone can submit leads" ON leads
  FOR INSERT TO anon WITH CHECK (true);

-- ---- Intake Links ----
CREATE POLICY "Admins can manage intake links" ON intake_links
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Anon can read active links (for validation)
CREATE POLICY "Anyone can validate intake links" ON intake_links
  FOR SELECT TO anon USING (is_active = true);

-- Anon can update use_count
CREATE POLICY "Anyone can increment link use" ON intake_links
  FOR UPDATE TO anon USING (is_active = true);

-- ---- Client Users ----
CREATE POLICY "Users can read own client access" ON client_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage client users" ON client_users
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create their own access during invitation" ON client_users
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ---- Client Invitations ----
CREATE POLICY "Admins can manage invitations" ON client_invitations
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Anon can read invitations by token (for signup flow)
CREATE POLICY "Anyone can read invitations by token" ON client_invitations
  FOR SELECT TO anon USING (expires_at > now());

-- Authenticated can read invitations by token (for post-signup acceptance)
CREATE POLICY "Authenticated can read invitations by token" ON client_invitations
  FOR SELECT TO authenticated USING (expires_at > now());

-- Authenticated can update invitation (mark as accepted)
CREATE POLICY "Users can accept invitations" ON client_invitations
  FOR UPDATE TO authenticated USING (expires_at > now());

-- ---- Workspace Settings ----
CREATE POLICY "Anyone can read workspace_settings" ON workspace_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update workspace_settings" ON workspace_settings
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================
-- 7. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;

-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Done! Your TaskFlow Pro database is ready.
-- ============================================================
