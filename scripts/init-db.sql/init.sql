-- Initialize database for Service Ticket Management System
-- This file is executed when the PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The database 'service_tickets' is already created by POSTGRES_DB env var
-- Additional initialization can be added here if needed

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
SELECT 'Database initialized successfully' as status;
