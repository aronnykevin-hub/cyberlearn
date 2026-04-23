# Cyberlearn - Supabase & Vercel Migration Guide

## Overview
This project has been migrated from Convex to Supabase for the backend database and is configured for deployment on Vercel.

## Prerequisites

1. **Supabase Project** - Create a free account at [supabase.com](https://supabase.com)
2. **Vercel Account** - Create an account at [vercel.com](https://vercel.com)
3. **Node.js** - v18 or higher

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to initialize
3. In the project settings, get your:
   - **Project URL** (API URL)
   - **Anon Public Key** (used in frontend)
   - **Service Role Secret Key** (used in backend scripts)

### 2. Configure Local Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 3. Initialize the Database

Run the database initialization script to create all tables and RLS policies:

```bash
npm run db:init
```

For a fresh start (clean database first):
```bash
npm run db:init:clean
```

For verbose output:
```bash
npm run db:init:verbose
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Locally

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Database Schema

### Tables

- **users** - Authentication users (linked to Supabase Auth)
- **user_profiles** - User profile information (role, department, etc.)
- **training_modules** - Cybersecurity training content
- **training_progress** - User training progress tracking
- **threat_reports** - Security threat reports from employees
- **alerts** - System-wide security alerts
- **notifications** - User notifications

All tables have Row-Level Security (RLS) policies enabled for data protection.

## Deployment on Vercel

### 1. Prepare for Deployment

```bash
npm run build
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel
```

#### Option B: Using GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 3. Configure Environment Variables in Vercel

In your Vercel project settings, add the following environment variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key |

### 4. Verify Deployment

After deployment, your app will be available at `https://your-project.vercel.app`

## Service Files

Frontend services are located in `src/services/`:

- **authService.js** - Authentication functions
- **userProfileService.js** - User profile management
- **trainingModuleService.js** - Training module operations
- **trainingProgressService.js** - Track training progress
- **threatReportService.js** - Threat reporting
- **alertService.js** - Alert management
- **notificationService.js** - Notifications

## Development Guide

### Adding a New Feature

1. Create SQL schema file in `backend/database/schema/`
2. Create a service file in `frontend/src/services/`
3. Use the service in your React components
4. Add RLS policies for security
5. Update the component files to use new service

### Database Queries

```javascript
import { supabase } from '@/services/authService';

// Read data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');

// Create data
const { data, error } = await supabase
  .from('table_name')
  .insert({ column: 'value' })
  .select();

// Update data
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', id);

// Delete data
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id);
```

### Authentication

```javascript
import { getCurrentUser, signOut } from '@/services/authService';

// Get current user
const user = await getCurrentUser();

// Listen to auth changes
import { onAuthStateChange } from '@/services/authService';

const unsubscribe = onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});
```

## Troubleshooting

### Database Connection Issues

1. Verify your Supabase credentials in `.env.local`
2. Check that Supabase project is active
3. Run `npm run db:init:verbose` for detailed error messages

### Vercel Deployment Issues

1. Check that environment variables are set correctly
2. Verify build logs in Vercel dashboard
3. Ensure `vite.config.ts` is properly configured

### RLS Policy Errors

1. Check Supabase dashboard for policy details
2. Verify service role key has proper permissions
3. Clear browser cache and retry

## Support & Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)
- [Vercel Docs](https://vercel.com/docs)
- [React Docs](https://react.dev)

## Environment Variables Reference

### Frontend (.env.local, .env.production, etc.)

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key for public access

### Backend/Scripts (backend/.env)

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for backend operations

## Project Structure

```
cyberlearn/
├── backend/
│   ├── database/
│   │   └── schema/
│   │       ├── 00_clean.sql
│   │       ├── 01_users.sql
│   │       ├── 02_user_profiles.sql
│   │       ├── 03_training_modules.sql
│   │       ├── 04_training_progress.sql
│   │       ├── 05_threat_reports.sql
│   │       ├── 06_alerts.sql
│   │       └── 07_notifications.sql
│   └── initialize_db.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── userProfileService.js
│   │   │   ├── trainingModuleService.js
│   │   │   ├── trainingProgressService.js
│   │   │   ├── threatReportService.js
│   │   │   ├── alertService.js
│   │   │   └── notificationService.js
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── index.html
├── .env.example
├── .env.local
├── vercel.json
├── package.json
└── MIGRATION_GUIDE.md
```

## Migration Notes

This project was previously using Convex. Key changes:

1. **Backend**: Moved from Convex to Supabase PostgreSQL
2. **API Calls**: Now use Supabase JS SDK instead of Convex functions
3. **Authentication**: Using Supabase Auth (JWT-based)
4. **Database**: All data now in PostgreSQL with RLS policies
5. **Deployment**: Simplified to Vercel static hosting + Supabase backend
6. **Environment**: Supabase credentials instead of Convex URLs

All business logic remains the same, only the backend technology has changed.
