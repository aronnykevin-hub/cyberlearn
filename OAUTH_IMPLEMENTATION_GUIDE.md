# Google OAuth Integration - Implementation & Testing Guide

## Project Status Summary

✅ **Frontend**: Google sign-in button already implemented  
✅ **Backend**: Supabase OAuth support enabled  
✅ **Database**: Automatic user profile creation configured  
⏳ **Google OAuth**: Requires configuration in Google Cloud Console & Supabase

## What's Already Set Up

### Frontend Components

1. **`src/services/authService.js`**
   - ✅ `signInWithGoogle()` function implemented
   - Handles OAuth flow with Supabase

2. **`src/SignInForm.tsx`**
   - ✅ "Sign in with Gmail" button displayed
   - Blue button with proper styling
   - Error handling with toast notifications

3. **`src/AuthCallback.tsx`** (NEW)
   - ✅ Created to handle OAuth redirects
   - Processes authentication callback
   - Redirects to dashboard on success

### Database Integration

1. **`backend/database/schema/01_users.sql`**
   - ✅ `public.users` table syncs with `auth.users`
   - ✅ `handle_new_auth_user()` trigger automatically creates user records
   - ✅ Row-level security policies configured
   - Works seamlessly with Google OAuth

2. **`backend/database/schema/02_companies.sql`**
   - ✅ Companies linked to users
   - ✅ Policies restrict access to company creators

3. **`backend/database/schema/02_user_profiles.sql`**
   - ✅ User profiles linked to authenticated users
   - Works with Google OAuth identities

## Required Configuration Steps

### Step 1️⃣: Create Google OAuth Credentials

```bash
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create/Select a project
3. Enable APIs: Google+ API
4. Go to Credentials > Create OAuth 2.0 Client ID
5. Select "Web application"
6. Add authorized redirect URIs:
   - http://localhost:5173/auth/callback (development)
   - https://<project-ref>.supabase.co/auth/v1/callback?provider=google
   - https://yourdomain.com/auth/callback (production)
7. Copy the Client ID and Client Secret
```

### Step 2️⃣: Configure Supabase

```bash
1. Go to Supabase Dashboard > Authentication > Providers
2. Find "Google" and click to enable
3. Paste Client ID and Client Secret
4. Copy the Redirect URI provided by Supabase
5. Go to Authentication > URL Configuration
6. Set Site URL: http://localhost:5173 (dev) or your domain (prod)
7. Add redirect URLs in "Redirect URLs" section
8. Save all changes
```

### Step 3️⃣: Update Application Routes

Add the auth callback route to your router. Update `src/App.tsx` or your routing configuration:

```typescript
import AuthCallback from './AuthCallback';

// In your route definitions:
<Route path="/auth/callback" element={<AuthCallback />} />
```

### Step 4️⃣: Verify Environment Configuration

Your `.env.local` already has Supabase configured:

```env
VITE_SUPABASE_URL=https://hswxazpxcgtqbxeqcxxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://hswxazpxcgtqbxeqcxxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **No changes needed** - OAuth is handled by Supabase OAuth providers

## Testing Checklist

### Local Development Testing

- [ ] **Step 1**: Start development server
  ```bash
  cd frontend
  npm run dev
  ```

- [ ] **Step 2**: Navigate to sign-in page
  - Visit `http://localhost:5173`
  - Look for the "Sign in with Gmail" button

- [ ] **Step 3**: Test Google sign-in flow
  - Click "Sign in with Gmail"
  - You should be redirected to Google login
  - Sign in with your Google account
  - Verify redirect back to `http://localhost:5173/auth/callback`

- [ ] **Step 4**: Verify authentication
  - Check browser console for success message
  - User should be redirected to dashboard
  - Check that user record was created in database:
    ```sql
    SELECT * FROM public.users WHERE email = 'your-google-email@gmail.com';
    ```

- [ ] **Step 5**: Verify user profile creation
  - Check user appears in Supabase Auth users list
  - Check user profile exists in `public.user_profiles`

- [ ] **Step 6**: Test sign-out and sign-in again
  - Click sign-out
  - Try signing in with the same Google account
  - Verify it loads existing profile (not creating duplicate)

### Database Verification

Run these queries in Supabase SQL Editor to verify integration:

```sql
-- Check users table
SELECT id, email, created_at FROM public.users 
ORDER BY created_at DESC LIMIT 5;

-- Check user profiles
SELECT id, user_id, role, created_at FROM public.user_profiles 
ORDER BY created_at DESC LIMIT 5;

-- Check auth.users (system table)
SELECT id, email, last_sign_in_at FROM auth.users 
ORDER BY last_sign_in_at DESC LIMIT 5;

-- Verify trigger is working
SELECT * FROM public.users WHERE email LIKE '%@gmail.com' LIMIT 5;
```

## Troubleshooting

### ❌ "Redirect URI mismatch" Error

**Cause**: Redirect URLs don't match across Google Cloud, Supabase, and your app

**Solution**:
1. In Google Cloud Console:
   - Go to Credentials > OAuth 2.0 Client ID
   - Add exactly these URIs:
     - `http://localhost:5173/auth/callback`
     - `https://<project-ref>.supabase.co/auth/v1/callback?provider=google`

2. In Supabase:
   - Authentication > URL Configuration
   - Site URL: `http://localhost:5173`
   - Redirect URLs: Add both URIs above

### ❌ "OAuth provider not configured" Error

**Cause**: Google provider not enabled or credentials not saved in Supabase

**Solution**:
1. Go to Supabase Dashboard > Authentication > Providers
2. Find Google and click to expand
3. Enable toggle switch
4. Paste valid Client ID and Client Secret
5. Click Save

### ❌ User not appearing in `public.users` table

**Cause**: `handle_new_auth_user()` trigger not executing

**Solution**:
1. Check trigger exists in database:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. If missing, run:
   ```sql
   -- Re-create the trigger
   CREATE TRIGGER on_auth_user_created 
   AFTER INSERT ON auth.users 
   FOR EACH ROW 
   EXECUTE FUNCTION public.handle_new_auth_user();
   ```

### ❌ CORS errors in browser console

**Cause**: Domain not authorized

**Solution**:
1. Supabase Dashboard > Authentication > Providers > Google
2. Verify Client ID and Client Secret are correct
3. Check that `localhost:5173` is in authorized redirect URIs

### ❌ Blank page after Google redirect

**Cause**: AuthCallback component not mounted or navigation failed

**Solution**:
1. Check browser console for errors
2. Verify `/auth/callback` route exists in your router
3. Verify `AuthCallback.tsx` is imported correctly
4. Check Redux/state management isn't blocking navigation

## Frontend Integration Details

### Sign-In Flow

```
User clicks "Sign in with Gmail"
        ↓
authService.signInWithGoogle()
        ↓
Supabase redirects to Google
        ↓
User signs in with Google account
        ↓
Google redirects to http://localhost:5173/auth/callback
        ↓
AuthCallback component processes redirect
        ↓
Supabase automatically creates auth.users entry
        ↓
Database trigger creates public.users entry
        ↓
User redirected to dashboard
```

### User Data Flow

```
Google Account
    ↓
Supabase auth.users (automatic)
    ↓
Database trigger (handle_new_auth_user)
    ↓
public.users + public.user_profiles created
    ↓
User data available to application
```

## Security Notes

1. ✅ **Client ID & Secret**: Stored in Supabase, never exposed to frontend
2. ✅ **Session Management**: Handled by Supabase Auth
3. ✅ **Row-Level Security**: Policies prevent users from accessing others' data
4. ✅ **Service Role Key**: Never included in frontend `.env`
5. ✅ **Redirect URL Validation**: Required at multiple levels for security

## Production Deployment

### Pre-Deployment Checklist

- [ ] Create separate Google OAuth credentials for production
- [ ] Add production domain to authorized redirect URIs:
  - `https://yourdomain.com/auth/callback`
  - `https://<project-ref>.supabase.co/auth/v1/callback?provider=google`
- [ ] Update Supabase Site URL to production domain
- [ ] Test OAuth flow on production domain before going live
- [ ] Monitor error logs after deployment
- [ ] Set up alerts for authentication failures

### Environment Variables for Production

```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

## Quick Reference

| Component | File | Status |
|-----------|------|--------|
| Google Sign-In Function | `src/services/authService.js` | ✅ Ready |
| Sign-In Form Button | `src/SignInForm.tsx` | ✅ Ready |
| Auth Callback Handler | `src/AuthCallback.tsx` | ✅ Created |
| Database Trigger | `backend/database/schema/01_users.sql` | ✅ Ready |
| Supabase OAuth Config | Dashboard | ⏳ Needs Setup |
| Google OAuth Credentials | Google Cloud Console | ⏳ Needs Setup |

## Next Steps

1. **Create Google OAuth credentials** (see Step 1 above)
2. **Configure Supabase** with Google credentials (see Step 2)
3. **Add auth callback route** to your app router
4. **Test locally** using the testing checklist
5. **Deploy to production** with production credentials

## Support Resources

- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console OAuth Setup](https://support.google.com/cloud/answer/6158849)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Your Supabase Project](https://app.supabase.com)
