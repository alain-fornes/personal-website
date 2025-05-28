-- Knowledge Visualization Database Schema
-- This schema supports a neural network-style knowledge system with nodes, connections, and content

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. KNOWLEDGE NODES TABLE
-- Represents each technology/concept as a node in the network
CREATE TABLE knowledge_nodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly version
    description TEXT,
    icon VARCHAR(100), -- Icon identifier (e.g., 'javascript', 'react', 'python')
    category VARCHAR(100) NOT NULL, -- 'programming', 'frameworks', 'tools', etc.
    
    -- Experience metrics (used for node sizing and visualization)
    experience_level INTEGER DEFAULT 1 CHECK (experience_level >= 1 AND experience_level <= 10),
    years_experience DECIMAL(3,1) DEFAULT 0,
    project_count INTEGER DEFAULT 0,
    blog_post_count INTEGER DEFAULT 0,
    
    -- Visual properties
    color VARCHAR(7), -- Hex color code
    position_x DECIMAL(10,2), -- For saving node positions
    position_y DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- 2. NODE CONNECTIONS TABLE
-- Represents relationships between knowledge nodes
CREATE TABLE node_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    
    -- Connection properties
    connection_type VARCHAR(50) DEFAULT 'related', -- 'related', 'prerequisite', 'builds_on', 'alternative'
    strength INTEGER DEFAULT 5 CHECK (strength >= 1 AND strength <= 10), -- Visual thickness
    description TEXT, -- Why these are connected
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Prevent duplicate connections
    UNIQUE(from_node_id, to_node_id)
);

-- 3. BLOG CONTENT TABLE
-- Stores the actual content/blog posts for each node
CREATE TABLE blog_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    
    -- Content details
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL, -- URL-friendly
    content TEXT NOT NULL, -- Markdown content
    excerpt TEXT, -- Short summary
    
    -- Content metadata
    content_type VARCHAR(50) DEFAULT 'blog_post', -- 'blog_post', 'note', 'project', 'resource'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    tags TEXT[], -- Array of tags
    
    -- SEO and organization
    meta_description TEXT,
    reading_time_minutes INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique slugs per node
    UNIQUE(node_id, slug)
);

-- 4. PROJECTS TABLE
-- Links projects to knowledge nodes
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Project details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    github_url VARCHAR(500),
    live_url VARCHAR(500),
    image_url VARCHAR(500),
    
    -- Project metadata
    status VARCHAR(20) DEFAULT 'completed', -- 'planning', 'in_progress', 'completed', 'archived'
    start_date DATE,
    end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. PROJECT NODE CONNECTIONS
-- Many-to-many relationship between projects and knowledge nodes
CREATE TABLE project_nodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    
    -- How this technology was used in the project
    usage_description TEXT,
    importance_level INTEGER DEFAULT 5 CHECK (importance_level >= 1 AND importance_level <= 10),
    
    UNIQUE(project_id, node_id)
);

-- 6. LEARNING PROGRESS TABLE
-- Track learning journey and goals
CREATE TABLE learning_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    
    -- Progress tracking
    current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 10),
    target_level INTEGER DEFAULT 5 CHECK (target_level >= 1 AND target_level <= 10),
    
    -- Learning details
    learning_status VARCHAR(20) DEFAULT 'learning', -- 'planning', 'learning', 'practicing', 'mastered'
    notes TEXT,
    resources TEXT[], -- Array of learning resources
    
    -- Time tracking
    hours_spent DECIMAL(6,2) DEFAULT 0,
    last_practiced DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(node_id, created_by)
);

-- INDEXES for performance
CREATE INDEX idx_knowledge_nodes_category ON knowledge_nodes(category);
CREATE INDEX idx_knowledge_nodes_slug ON knowledge_nodes(slug);
CREATE INDEX idx_knowledge_nodes_created_by ON knowledge_nodes(created_by);
CREATE INDEX idx_blog_content_node_id ON blog_content(node_id);
CREATE INDEX idx_blog_content_status ON blog_content(status);
CREATE INDEX idx_blog_content_created_by ON blog_content(created_by);
CREATE INDEX idx_node_connections_from_node ON node_connections(from_node_id);
CREATE INDEX idx_node_connections_to_node ON node_connections(to_node_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- Public read access for knowledge nodes (your portfolio is public)
CREATE POLICY "Anyone can view published knowledge nodes" ON knowledge_nodes
    FOR SELECT USING (is_active = true);

-- Only authenticated user (you) can modify
CREATE POLICY "Owner can manage knowledge nodes" ON knowledge_nodes
    FOR ALL USING (auth.uid() = created_by);

-- Public read for published blog content
CREATE POLICY "Anyone can view published blog content" ON blog_content
    FOR SELECT USING (status = 'published');

-- Only you can manage blog content
CREATE POLICY "Owner can manage blog content" ON blog_content
    FOR ALL USING (auth.uid() = created_by);

-- Public read for connections (to show the network)
CREATE POLICY "Anyone can view node connections" ON node_connections
    FOR SELECT USING (true);

-- Only you can manage connections
CREATE POLICY "Owner can manage connections" ON node_connections
    FOR ALL USING (auth.uid() = created_by);

-- Public read for projects
CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT USING (true);

-- Only you can manage projects
CREATE POLICY "Owner can manage projects" ON projects
    FOR ALL USING (auth.uid() = created_by);

-- Public read for project-node connections
CREATE POLICY "Anyone can view project nodes" ON project_nodes
    FOR SELECT USING (true);

-- Learning progress is private to you
CREATE POLICY "Owner can manage learning progress" ON learning_progress
    FOR ALL USING (auth.uid() = created_by);

-- FUNCTIONS for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_knowledge_nodes_updated_at BEFORE UPDATE ON knowledge_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_content_updated_at BEFORE UPDATE ON blog_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update node metrics when content is added
CREATE OR REPLACE FUNCTION update_node_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update blog post count and other metrics
    UPDATE knowledge_nodes 
    SET 
        blog_post_count = (
            SELECT COUNT(*) 
            FROM blog_content 
            WHERE node_id = NEW.node_id AND status = 'published'
        ),
        updated_at = NOW()
    WHERE id = NEW.node_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update metrics when blog content changes
CREATE TRIGGER update_node_metrics_on_blog_change 
    AFTER INSERT OR UPDATE OR DELETE ON blog_content
    FOR EACH ROW EXECUTE FUNCTION update_node_metrics(); 