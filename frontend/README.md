# Cyberlearn - Employee Cybersecurity Training Platform

A comprehensive cybersecurity training and threat management system built with React, Vite, Supabase, and Vercel.

## Overview

Cyberlearn is an employee-focused platform for:
- **Training Modules** - Interactive cybersecurity courses on phishing, malware, data protection, etc.
- **Threat Reporting** - Employees can report security threats and suspicious activities
- **Alerts** - System-wide security alerts and notifications
- **Progress Tracking** - Monitor employee training completion and scores
- **Admin Dashboard** - Manage users, content, and security reports

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Real-time**: Supabase subscriptions

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier available)
- Vercel account (free tier available)

### Local Development

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

3. **Initialize Database**
   ```bash
   npm run db:init
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

   App opens at http://localhost:5173

### Deployment

1. **Build**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   - Push to GitHub
   - Connect repository to Vercel
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

## Project Structure

```
cyberlearn/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # Supabase API services
│   │   └── App.tsx       # Main application component
│   └── vite.config.ts    # Vite configuration
├── backend/              # Backend setup and database
│   ├── database/
│   │   └── schema/       # SQL schema files
│   ├── initialize_db.js  # Database initialization script
│   └── README.md         # Backend documentation
├── vercel.json           # Vercel deployment config
├── MIGRATION_GUIDE.md    # Migration from Convex to Supabase
└── package.json          # Project dependencies
```

## Features

### For Employees
- ✅ Browse and complete training modules
- ✅ Track training progress and scores
- ✅ Report security threats
- ✅ Receive notifications and alerts
- ✅ View personal profile and history

### For Admins
- ✅ Manage training content and modules
- ✅ Track employee training completion
- ✅ Review and manage threat reports
- ✅ Create and broadcast alerts
- ✅ View analytics and statistics
- ✅ Manage user accounts and roles

## Database Schema

The application uses 7 main tables:

1. **users** - Supabase authentication users
2. **user_profiles** - Employee/admin profiles
3. **training_modules** - Cybersecurity training content
4. **training_progress** - Individual training tracking
5. **threat_reports** - Security threat submissions
6. **alerts** - System-wide security alerts
7. **notifications** - User-specific messages

All tables include Row-Level Security (RLS) for data protection.

## Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run TypeScript and ESLint checks
npm run preview          # Preview production build locally

# Database commands
npm run db:init          # Initialize database
npm run db:init:clean    # Clean and reinitialize database
npm run db:init:verbose  # Initialize with verbose logging
```

## Environment Variables

### Frontend
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon public key

### Backend/Scripts
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

See `.env.example` for template.

## API Services

Frontend services in `src/services/`:

- **authService** - User authentication
- **userProfileService** - User management
- **trainingModuleService** - Training content
- **trainingProgressService** - Progress tracking
- **threatReportService** - Threat reporting
- **alertService** - Alert management
- **notificationService** - Notifications with real-time support

## Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - From Convex to Supabase
- [Backend README](./backend/README.md) - Database setup details
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)
- [Vercel Docs](https://vercel.com/docs)

## Security

- ✅ Row-Level Security (RLS) on all tables
- ✅ JWT-based authentication
- ✅ Service role separation
- ✅ Environment variables for secrets
- ✅ HTTPS enforced in production

## Getting Help

1. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for setup issues
2. Review [backend/README.md](./backend/README.md) for database questions
3. Refer to [Supabase documentation](https://supabase.com/docs)
4. Check Vercel logs for deployment issues

## License

[Your License Here]

## Support

For issues, feature requests, or questions, please [create an issue](https://github.com/your-repo/issues).

---

**Built with ❤️ for cybersecurity training and threat management**

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
