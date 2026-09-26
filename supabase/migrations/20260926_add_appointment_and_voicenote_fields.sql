-- Migration: Add appointment fields to matters, voice note fields to messages
-- This enables real booking dates and persistent voice note metadata.

-- 1. Add appointment fields to matters table
ALTER TABLE matters
  ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'phone'));

-- 2. Add voice note fields to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_voice_note BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS audio_duration TEXT;

-- 3. Add comment for documentation
COMMENT ON COLUMN matters.appointment_date IS 'Proposed appointment datetime selected by client during booking';
COMMENT ON COLUMN matters.consultation_type IS 'Type of consultation: video or phone';
COMMENT ON COLUMN messages.is_voice_note IS 'True if this message is a voice note recording';
COMMENT ON COLUMN messages.audio_url IS 'Signed URL for voice note playback (Supabase Storage)';
COMMENT ON COLUMN messages.audio_storage_path IS 'Storage path for voice note in case-documents bucket';
COMMENT ON COLUMN messages.audio_duration IS 'Duration of voice note as display string (e.g. 0:38)';
