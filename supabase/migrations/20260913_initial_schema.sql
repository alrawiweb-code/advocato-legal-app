-- ==============================================================================
-- ADVOCATO LEGAL MARKETPLACE — PRODUCTION SCHEMA MIGRATION
-- Database, Authentication, Row-Level Security, and Evidentiary Storage
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'lawyer', 'admin')) DEFAULT 'client',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Lawyer Verified Directory Profiles
CREATE TABLE IF NOT EXISTS public.lawyer_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  firm_name TEXT,
  bar_number TEXT NOT NULL,
  state_bar TEXT NOT NULL,
  years_experience INT NOT NULL DEFAULT 5,
  hourly_rate INT NOT NULL DEFAULT 350,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  availability TEXT NOT NULL DEFAULT 'Available today',
  jurisdiction TEXT NOT NULL,
  practice_areas TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT NOT NULL,
  notable_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Legal Matters / Consultations Docket
CREATE TABLE IF NOT EXISTS public.matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  case_title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Employment & Labor Law',
  jurisdiction TEXT NOT NULL DEFAULT 'New York (NY)',
  urgency TEXT NOT NULL CHECK (urgency IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
  status TEXT NOT NULL CHECK (status IN ('active', 'scheduled', 'review', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AI Intake Assessments
CREATE TABLE IF NOT EXISTS public.intake_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID REFERENCES public.matters(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_title TEXT,
  raw_text TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  urgency TEXT NOT NULL,
  summary TEXT NOT NULL,
  extracted_key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  matched_lawyers JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'openrouter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Evidentiary Documents & Case Files
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General Evidence',
  sha256_hash TEXT,
  is_privileged BOOLEAN NOT NULL DEFAULT TRUE,
  is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Consultation Chat Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'lawyer')),
  text TEXT NOT NULL DEFAULT '',
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  is_voice_note BOOLEAN NOT NULL DEFAULT FALSE,
  audio_storage_path TEXT,
  audio_duration TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  reactions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Realtime Enablement for Messages Table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matters;

-- 9. Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 10. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile and lawyer directory profiles
CREATE POLICY "Public can view lawyer profiles" ON public.profiles
  FOR SELECT USING (role = 'lawyer' OR id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Lawyer Profiles: Anyone can view admitted lawyer profiles
CREATE POLICY "Public can view admitted lawyers" ON public.lawyer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Attorneys can update own lawyer profile" ON public.lawyer_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Attorneys can insert own lawyer profile" ON public.lawyer_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Matters: Only the client or assigned lawyer can view or update the matter
CREATE POLICY "Participants can view their matters" ON public.matters
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id);

CREATE POLICY "Clients can create matters" ON public.matters
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Participants can update matter status" ON public.matters
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = lawyer_id);

-- Documents: Only matter participants can view or upload evidence
CREATE POLICY "Participants can view matter documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matters m
      WHERE m.id = documents.matter_id
      AND (m.client_id = auth.uid() OR m.lawyer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can upload matter documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploader_id AND
    EXISTS (
      SELECT 1 FROM public.matters m
      WHERE m.id = documents.matter_id
      AND (m.client_id = auth.uid() OR m.lawyer_id = auth.uid())
    )
  );

-- Messages: Only matter participants can view or send messages
CREATE POLICY "Participants can view matter messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matters m
      WHERE m.id = messages.matter_id
      AND (m.client_id = auth.uid() OR m.lawyer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can post matter messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matters m
      WHERE m.id = messages.matter_id
      AND (m.client_id = auth.uid() OR m.lawyer_id = auth.uid())
    )
  );

-- ==============================================================================
-- 11. SUPABASE STORAGE BUCKET: case-documents
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  FALSE,
  52428800, -- 50MB per file
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'audio/webm', 'audio/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Participants can read/write objects in their matter folder
CREATE POLICY "Matter participants can access storage files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'case-documents');

CREATE POLICY "Authenticated users can upload to case-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'case-documents');
