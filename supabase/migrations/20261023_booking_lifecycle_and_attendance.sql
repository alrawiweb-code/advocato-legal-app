-- Migration: 20261023_booking_lifecycle_and_attendance.sql
-- Description: Expand matters status check constraint to support full booking lifecycle,
-- add consultation duration, attendance timestamps, and decoupled reschedule columns.

-- Step 1: Safely expand matters status constraint without modifying existing values
ALTER TABLE public.matters DROP CONSTRAINT IF EXISTS matters_status_check;
ALTER TABLE public.matters ADD CONSTRAINT matters_status_check CHECK (
  status IN (
    -- New lifecycle values ('rescheduled' is intentionally absent; represented via reschedule_status):
    'pending', 'confirmed', 'declined',
    'in_progress', 'completed', 'missed', 'cancelled',
    -- Preserved legacy values (backward compatibility):
    'active', 'scheduled', 'review', 'closed'
  )
);

-- Step 2: Add consultation duration, attendance timestamps, and decoupled reschedule columns
ALTER TABLE public.matters 
  ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS client_joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lawyer_joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decline_reason TEXT,
  ADD COLUMN IF NOT EXISTS proposed_reschedule_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reschedule_requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reschedule_status TEXT NOT NULL DEFAULT 'none' CHECK (
    reschedule_status IN ('none', 'pending_client', 'pending_lawyer', 'accepted', 'rejected', 'expired')
  ),
  ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
  ADD COLUMN IF NOT EXISTS original_appointment_date TIMESTAMPTZ;

-- Ensure any existing rows have the clear starting default 'none'
UPDATE public.matters SET reschedule_status = 'none' WHERE reschedule_status IS NULL;

-- Step 3: Composite indexing for performant status and appointment lookups
CREATE INDEX IF NOT EXISTS idx_matters_client_lawyer_status 
  ON public.matters (client_id, lawyer_id, status);
CREATE INDEX IF NOT EXISTS idx_matters_appointment_schedule 
  ON public.matters (appointment_date, status);
