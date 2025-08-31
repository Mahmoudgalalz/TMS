-- Migration to update ticket status enum to new values: DRAFT, REVIEW, PENDING, OPEN, CLOSED
-- This migration handles the transition from old statuses to new ones

-- Step 1: Update existing tickets to map old statuses to new ones
UPDATE tickets 
SET status = CASE 
  WHEN status = 'IN_PROGRESS' THEN 'OPEN'
  WHEN status = 'RESOLVED' THEN 'CLOSED'
  WHEN status = 'REOPENED' THEN 'OPEN'
  ELSE status
END
WHERE status IN ('IN_PROGRESS', 'RESOLVED', 'REOPENED');

-- Step 2: Create a new enum type with the desired values
CREATE TYPE ticket_status_new AS ENUM ('DRAFT', 'REVIEW', 'PENDING', 'OPEN', 'CLOSED');

-- Step 3: Update the tickets table to use the new enum
ALTER TABLE tickets 
ALTER COLUMN status TYPE ticket_status_new 
USING status::text::ticket_status_new;

-- Step 4: Drop the old enum and rename the new one
DROP TYPE ticket_status;
ALTER TYPE ticket_status_new RENAME TO ticket_status;

-- Step 5: Update ticket_history table if it references the old enum values
UPDATE ticket_history 
SET old_value = CASE 
  WHEN old_value = 'IN_PROGRESS' THEN 'OPEN'
  WHEN old_value = 'RESOLVED' THEN 'CLOSED'
  WHEN old_value = 'REOPENED' THEN 'OPEN'
  ELSE old_value
END
WHERE old_value IN ('IN_PROGRESS', 'RESOLVED', 'REOPENED');

UPDATE ticket_history 
SET new_value = CASE 
  WHEN new_value = 'IN_PROGRESS' THEN 'OPEN'
  WHEN new_value = 'RESOLVED' THEN 'CLOSED'
  WHEN new_value = 'REOPENED' THEN 'OPEN'
  ELSE new_value
END
WHERE new_value IN ('IN_PROGRESS', 'RESOLVED', 'REOPENED');
