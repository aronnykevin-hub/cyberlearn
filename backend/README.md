# Cyberlearn Backend

This directory contains the backend database setup for the Cyberlearn application.

## Structure

- `initialize_db.js` - Main database initialization script
- `database/schema/` - SQL schema files
  - `00_clean.sql` - Cleans all tables (development only)
  - `01_users.sql` - User authentication table
  - `02_user_profiles.sql` - User profile information
  - `03_training_modules.sql` - Training content
  - `04_training_progress.sql` - Training progress tracking
  - `05_threat_reports.sql` - Threat reporting
  - `06_alerts.sql` - System alerts
  - `07_notifications.sql` - User notifications

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Initialize the database:
   ```bash
   npm run init
   ```

## Commands

- `npm run init` - Initialize database with all schema files
- `npm run init:clean` - Clean database first, then initialize
- `npm run init:verbose` - Initialize with verbose output

## Database Architecture

All tables include:
- Primary key (UUID)
- Timestamps (created_at, updated_at)
- Row-Level Security (RLS) policies
- Appropriate indexes for performance

### User Authentication
- Leverages Supabase Auth (built-in authentication system)
- Stores minimal user data in `users` table
- Links to `user_profiles` for application-specific data

### Training System
- `training_modules` - Reusable training content
- `training_progress` - Tracks individual user progress
- Supports multiple attempts and score tracking

### Security Reporting
- `threat_reports` - Employee threat submissions
- Tracks severity, type, status, and resolution
- Audit trail with timestamps and admin notes

### Communications
- `alerts` - System-wide broadcasts
- `notifications` - Individual user messages
- Real-time subscription support via Supabase

## Security

All tables are protected with Row-Level Security (RLS):
- Users can only access their own data
- Admins have broader access
- Service role has full access for backend operations
- All policies defined in schema files

## Modifying Schema

To add a new table or column:

1. Create a new SQL file in `database/schema/` with appropriate numbering
2. Include RLS policies in the same file
3. Update the `initialize_db.js` script if needed
4. Run `npm run init:clean` to reinitialize with new schema
5. Update the corresponding frontend service file

## Backend Services

Frontend service files that correspond to these tables:
- `frontend/src/services/authService.js`
- `frontend/src/services/userProfileService.js`
- `frontend/src/services/trainingModuleService.js`
- `frontend/src/services/trainingProgressService.js`
- `frontend/src/services/threatReportService.js`
- `frontend/src/services/alertService.js`
- `frontend/src/services/notificationService.js`

Keep these in sync when modifying the database schema.
