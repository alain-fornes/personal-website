# Supabase Setup Guide

## 🚀 **Quick Setup Steps**

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to initialize

### 2. Set Environment Variables
Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get these values from:**
- Supabase Dashboard → Project Settings → API
- Copy "Project URL" and "anon public" key

### 3. Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `database-schema.sql`
3. Paste and run the SQL

### 4. Configure Authentication
1. Go to Authentication → Providers
2. Enable Email provider
3. (Optional) Disable email confirmation for development

## 🗄️ **Database Schema Overview**

### Core Tables:
- **`knowledge_nodes`** - Technologies/concepts (JavaScript, React, etc.)
- **`node_connections`** - Relationships between technologies
- **`blog_content`** - Your blog posts/notes for each technology
- **`projects`** - Your projects
- **`project_nodes`** - Which technologies were used in each project
- **`learning_progress`** - Track your learning journey

### Key Features:
- **Experience-based sizing** - Node size reflects your experience level
- **Automatic metrics** - Blog post counts update automatically
- **Public/Private content** - Published content is public, drafts are private
- **Row Level Security** - Only you can edit, everyone can view published content

## 🎨 **How the Visualization Works**

### Node Sizing Formula:
```javascript
nodeSize = baseSize + (experience_level * 10) + (blog_post_count * 5) + (project_count * 3)
```

### Connection Strength:
- Visual thickness based on `strength` field (1-10)
- Connection types: 'related', 'prerequisite', 'builds_on', 'alternative'

### Categories for Organization:
- `programming` - Languages (JS, Python, etc.)
- `frameworks` - React, Next.js, etc.
- `tools` - Git, Docker, etc.
- `concepts` - Algorithms, Design Patterns, etc.

## 🔐 **Authentication Integration**

Your existing auth system will work seamlessly:
- When authenticated, you can create/edit content
- All content creation is linked to your user ID
- Public visitors can view your knowledge network
- Only you can see draft content and learning progress

## 📝 **Content Management**

### Blog Posts:
- Write in Markdown
- Auto-generate reading time
- SEO-friendly slugs
- Tag system for organization

### Projects:
- Link to GitHub/live demos
- Connect multiple technologies per project
- Track project status and timeline

### Learning Progress:
- Set current and target skill levels
- Track hours spent learning
- Save learning resources and notes
- Private to you only

## 🚀 **Next Steps**

1. Set up your Supabase project with this schema
2. Create your first knowledge nodes (JavaScript, React, etc.)
3. Add some blog content
4. Build the visualization component
5. Connect projects to show your experience

This schema is designed to grow with you - add new technologies, write more content, and watch your knowledge network expand! 