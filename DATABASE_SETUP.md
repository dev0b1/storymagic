# Database Setup Instructions

## Overview
This application can work with either Supabase (recommended for production) or fallback in-memory storage (for development/testing).

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be fully provisioned

### 2. Get Your Credentials
1. Go to Project Settings → API
2. Copy your Project URL and Service Role Key
3. Add them to your `.env` file:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Run Database Migration
Since the automatic migration system has been temporarily disabled to prevent startup race conditions, you need to manually run the database schema.

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `server/migrations/0001_initial_schema.sql`
4. Click "Run" to execute the SQL

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

### 4. Verify Setup
After running the migration, restart your server. You should see:
```
✅ Database validation successful:
- Users table exists (0 rows)
- Stories table exists (0 rows)
```

## Migration Contents
The migration creates the following tables:

### Users Table
- `id` (TEXT, PRIMARY KEY)
- `email` (TEXT, UNIQUE, NOT NULL)
- `name` (TEXT)
- `is_premium` (BOOLEAN, DEFAULT FALSE)
- `stories_generated` (INTEGER, DEFAULT 0)
- `subscription_status` (TEXT, DEFAULT 'free')
- `subscription_id` (TEXT)
- `subscription_end_date` (TIMESTAMPTZ)
- `stripe_customer_id` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### Stories Table
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (TEXT, FOREIGN KEY to users.id)
- `input_text` (TEXT, NOT NULL)
- `output_story` (TEXT, NOT NULL)
- `narration_mode` (TEXT, NOT NULL, DEFAULT 'balanced')
- `content_type` (TEXT, DEFAULT 'general')
- `source` (TEXT, DEFAULT 'text')
- `story_id` (TEXT)
- `used_fallback` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### Subscriptions Table
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (TEXT, FOREIGN KEY to users.id)
- `stripe_subscription_id` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL, DEFAULT 'inactive')
- `plan_type` (TEXT, NOT NULL)
- `current_period_start` (TIMESTAMPTZ, NOT NULL)
- `current_period_end` (TIMESTAMPTZ, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

## Fallback Storage
If Supabase is not configured, the application will automatically use in-memory storage:

```
⚠️ Using fallback storage - Supabase not configured
```

This is suitable for:
- Development and testing
- Temporary deployments
- When you don't want to set up a database

**Note:** Fallback storage is not persistent - all data is lost when the server restarts.

## Troubleshooting

### Race Condition Issues
The previous migration system caused race conditions during server startup. The current system:
- Initializes the database asynchronously after server startup
- Uses fallback storage if database setup fails
- Provides clear logging about database status

### Common Issues
1. **PGRST202 Error**: This was caused by the old migration system trying to use a non-existent `exec_sql` function. This has been fixed.

2. **Database Not Found**: Make sure you've run the migration SQL in your Supabase dashboard.

3. **Connection Issues**: Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct.

4. **Permission Issues**: Make sure you're using the Service Role Key, not the Anon Key.

## Future Improvements
- Automatic migration system using Supabase CLI
- Database connection pooling
- Better error handling and retry logic
