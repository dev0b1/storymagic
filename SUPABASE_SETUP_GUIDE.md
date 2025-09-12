# Supabase Setup Guide for StudyFlow

## 🚀 Project Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project named "studyflow"
3. Choose your region and database password
4. Wait for the project to be created

### 2. Database Tables Setup

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT DEFAULT 'pdf',
  extracted_text TEXT,
  summary TEXT,
  processing_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  difficulty TEXT DEFAULT 'medium',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  session_type TEXT DEFAULT 'flashcards',
  cards_studied INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  documents_processed INTEGER DEFAULT 0,
  subscription_status TEXT DEFAULT 'free',
  subscription_id TEXT,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_flashcards_document_id ON flashcards(document_id);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_created_at ON study_sessions(created_at DESC);
```

### 3. Row Level Security (RLS) Setup

```sql
-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid()::text = user_id);

-- Flashcards policies
CREATE POLICY "Users can view their own flashcards" ON flashcards
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own flashcards" ON flashcards
  FOR DELETE USING (auth.uid()::text = user_id);

-- Study sessions policies
CREATE POLICY "Users can view their own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id);
```

### 4. Storage Setup

```sql
-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage bucket for flashcard exports
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for exports bucket
CREATE POLICY "Users can upload their own exports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 5. Database Functions

```sql
-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update document count
CREATE OR REPLACE FUNCTION public.update_document_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET documents_processed = documents_processed + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update document count
CREATE TRIGGER on_document_created
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_document_count();
```

### 6. Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL (for Drizzle)
DATABASE_URL=your_supabase_database_url

# OpenAI API Key (for AI features)
OPENAI_API_KEY=your_openai_api_key
```

### 7. Update Drizzle Configuration

Update your `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 8. Authentication Setup

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable Google OAuth:
   - Add your Google OAuth credentials
   - Set redirect URL to: `https://yourdomain.com/auth/callback`
3. Configure email settings if needed

### 9. Storage Configuration

1. Go to Storage in your Supabase dashboard
2. Verify that the `documents` and `exports` buckets are created
3. Set appropriate file size limits (recommend 10MB for PDFs)

### 10. API Keys and URLs

1. Go to Settings > API in your Supabase dashboard
2. Copy the following:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)
3. Update your environment variables

## 🔧 Testing the Setup

1. Run your Next.js app: `npm run dev`
2. Try signing up with Google OAuth
3. Upload a test PDF
4. Check that the document appears in your Supabase dashboard
5. Verify that flashcards are generated

## 📊 Monitoring

- Check the Supabase dashboard for:
  - User registrations in Authentication
  - Document uploads in Storage
  - Database records in Table Editor
  - API usage in Logs

## 🚨 Important Notes

1. **Security**: Never commit your service role key to version control
2. **RLS**: All tables have Row Level Security enabled for data protection
3. **Storage**: Files are organized by user ID in folders
4. **Backups**: Enable automatic backups in Supabase settings
5. **Monitoring**: Set up alerts for unusual activity

## 🎯 Next Steps

1. Test the complete user flow
2. Set up payment integration (Stripe/LemonSqueezy)
3. Configure email notifications
4. Set up monitoring and analytics
5. Deploy to production

Your StudyFlow app is now ready with a complete Supabase backend! 🎉
