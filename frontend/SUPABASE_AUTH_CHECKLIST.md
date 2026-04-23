#!/usr/bin/env node

/**
 * ========================================================================
 * SUPABASE AUTH CONFIGURATION CHECKER
 * ========================================================================
 * This script provides guidance on checking and configuring Supabase Auth
 * for your CyberLearn application.
 * 
 * Manual steps required - follow the checklist below
 * ========================================================================
 */

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║          SUPABASE AUTHENTICATION CONFIGURATION CHECKLIST            ║
╚════════════════════════════════════════════════════════════════════╝

🔗 GO TO: https://app.supabase.com → Select your project "cyberlearn"

STEP 1: ENABLE ANONYMOUS SIGN-IN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Left sidebar → Authentication → Providers
2. Scroll down to "Anonymous"
3. Toggle "Enabled" ON
4. Click "Save"

✓ You should see: "Anonymous provider is now enabled"

STEP 2: VERIFY EMAIL/PASSWORD AUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Left sidebar → Authentication → Providers
2. Make sure "Email" is enabled (toggle ON)
3. Make sure "Password" is enabled (toggle ON)
4. Click "Save"

STEP 3: CONFIGURE EMAIL CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For smooth UX during development, disable email confirmation:

1. Left sidebar → Authentication → Email Templates
2. Look for "Confirm signup" section
3. Find the setting: "Confirm email"
4. Toggle OFF (for development - enable in production!)
5. Click "Save"

⚠️  NOTE: In production, keep this ON for security!

STEP 4: VERIFY SETTINGS TAB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Left sidebar → Authentication → Settings
2. Confirm these settings:

   ✓ Site URL: http://localhost:5177 (development)
   
   ✓ Redirect URLs (add these):
     - http://localhost:5177
     - http://localhost:5177/auth/callback
     - http://localhost:5177/dashboard
   
   ✓ JWT Expiration Limit: 3600 (1 hour)
   
   ✓ Inactivity Timeout: 604800 (7 days)

3. Scroll down and check:
   ✓ "Enable signup" = ON
   ✓ "Enable email confirmations" = OFF (for dev)
   ✓ "Enable phone confirmations" = OFF

STEP 5: CHECK RATE LIMITING (OPTIONAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Left sidebar → Authentication → Settings → Rate Limit Configuration
2. Verify these are NOT too restrictive:
   - Signup: Should allow at least 10/minute during dev
   - Password reset: Should allow at least 5/minute during dev

STEP 6: VERIFY YOUR API KEYS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Make sure your .env.local has correct keys:

1. Left sidebar → Settings → API
2. Copy the values and verify they match your .env.local:
   - Project URL → VITE_SUPABASE_URL
   - Anon Key → VITE_SUPABASE_ANON_KEY
   
File: cyberlearn/.env.local

STEP 7: TEST ANONYMOUS AUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After verifying settings:

1. Start dev server: npm run dev
2. Navigate to login page
3. Click "Continue as guest"
4. Check browser console for: ✅ [Auth] Anonymous signin successful

If you see an error, anonymous auth is not enabled - go back to STEP 1

STEP 8: ROW LEVEL SECURITY (RLS) POLICIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verify RLS policies are in place:

1. Left sidebar → SQL Editor
2. Run this query to check policies:

   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   ORDER BY tablename;

   ✓ You should see policies for: users, user_profiles, companies, etc.

STEP 9: VERIFY DATABASE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initialize your database schema if not done yet:

From terminal in cyberlearn/backend:
$ node initialize_db.js

This will:
✓ Create all tables (users, user_profiles, companies, etc.)
✓ Set up RLS policies
✓ Create triggers for auto profile creation

═══════════════════════════════════════════════════════════════════════

TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════

Q: Anonymous auth button shows error?
A: Check if "Anonymous" provider is enabled in Step 1

Q: Getting "Email already in use" when linking email?
A: Make sure different emails are used, or clear Supabase auth records

Q: User profile not creating on signin?
A: Run: node backend/initialize_db.js
   Then check database schema with triggers

Q: Getting RLS policy errors?
A: Verify all database initialization completed successfully

═══════════════════════════════════════════════════════════════════════

NEXT STEPS
═══════════════════════════════════════════════════════════════════════

1. ✓ Complete all verification steps above
2. ✓ Run: npm run dev
3. ✓ Test: "Continue as guest" button
4. ✓ Test: Email signup/signin
5. ✓ Test: Link email from anonymous account

═══════════════════════════════════════════════════════════════════════
`);
