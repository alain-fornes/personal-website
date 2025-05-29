-- Temporary fix for Row Level Security issues
-- This disables RLS so you can test the functionality with your custom auth system

-- Disable RLS on all tables temporarily
ALTER TABLE knowledge_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE node_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress DISABLE ROW LEVEL SECURITY;

-- Drop the existing policies that depend on Supabase Auth
DROP POLICY IF EXISTS "Anyone can view published knowledge nodes" ON knowledge_nodes;
DROP POLICY IF EXISTS "Owner can manage knowledge nodes" ON knowledge_nodes;
DROP POLICY IF EXISTS "Anyone can view published blog content" ON blog_content;
DROP POLICY IF EXISTS "Owner can manage blog content" ON blog_content;
DROP POLICY IF EXISTS "Anyone can view node connections" ON node_connections;
DROP POLICY IF EXISTS "Owner can manage connections" ON node_connections;
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Owner can manage projects" ON projects;
DROP POLICY IF EXISTS "Anyone can view project nodes" ON project_nodes;
DROP POLICY IF EXISTS "Owner can manage learning progress" ON learning_progress;

-- Make created_by nullable temporarily since we're not using Supabase Auth
ALTER TABLE knowledge_nodes ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE node_connections ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE blog_content ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE learning_progress ALTER COLUMN created_by DROP NOT NULL; 