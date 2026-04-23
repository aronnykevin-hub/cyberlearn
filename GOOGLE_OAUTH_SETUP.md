# Google OAuth Sign-In Setup Guide

This guide walks you through enabling Google OAuth sign-in for your CyberLearn application.

## Prerequisites

- Supabase project already set up and running
- Google Cloud Console access
- Frontend and backend properly connected

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Credentials**

### 1.2 Create OAuth 2.0 Client ID
1. Click **+ Create Credentials** > **OAuth client ID**
2. If prompted, configure the OAuth consent screen first:
   - Choose **External** for user type
   - Fill in required app information (app name, user support email, developer contact)
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

### 1.3 Create Web Application Credentials
1. Application type: **Web application**
2. Add **Authorized redirect URIs** (for local + production):
   ```
   http://localhost:5173/auth/callback
   https://yourdomain.com/auth/callback
   https://<project-ref>.supabase.co/auth/v1/callback?provider=google
   ```
3. Download the credentials JSON (you'll need the Client ID and Client Secret)

## Step 2: Configure Supabase

### 2.1 In Supabase Dashboard
1. Go to **Authentication** > **Providers**
2. Find **Google** and click to configure
3. Enable the provider
4. Paste your **Client ID** and **Client Secret** from Google Cloud Console
5. Set the **Redirect URL** (Supabase provides this)
6. Save

### 2.2 Configure Authentication Settings
In Supabase Dashboard, go to **Authentication** > **URL Configuration**:
- **Site URL**: `http://localhost:5173` (dev) or your production domain
- **Redirect URLs** (add these):
  ```
  http://localhost:5173/auth/callback
  https://yourdomain.com/auth/callback
  ```

## Step 3: Environment Configuration

Your `.env.local` already has Supabase configured:
```env
VITE_SUPABASE_URL=https://hswxazpxcgtqbxeqcxxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SUPABASE_URL=https://hswxazpxcgtqbxeqcxxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **No changes needed** - Supabase OAuth is handled automatically

## Step 4: Frontend Integration (Already Implemented)

### 4.1 Auth Service
The `signInWithGoogle()` function is already implemented in `src/services/authService.js`:

```javascript
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Google sign in error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    message: 'Google sign in initiated',
  };
}
```

### 4.2 Sign-In Form Button
The "Sign in with Gmail" button is already in `src/SignInForm.tsx`:

```tsx
<button
  className="auth-button bg-blue-600 hover:bg-blue-700"
  type="button"
  disabled={submitting}
  onClick={() => {
    setSubmitting(true);
    authService
      .signInWithGoogle()
      .catch((error: Error) => {
        toast.error(error.message);
        setSubmitting(false);
      });
  }}
>
  {submitting ? "Redirecting to Google..." : "Sign in with Gmail"}
</button>
```

## Step 5: Create Auth Callback Handler

Create a new file `src/pages/AuthCallback.tsx` to handle OAuth redirects:

```typescript
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase automatically handles the callback
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          // User is authenticated
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        } else {
          setError("Authentication failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Processing authentication...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return null;
}
```

## Step 6: Update Your Routes

Add the callback route to your router configuration (e.g., in `src/App.tsx` or your routing setup):

```typescript
import AuthCallback from './pages/AuthCallback';

// In your route definitions:
{
  path: '/auth/callback',
  element: <AuthCallback />
}
```

## Step 7: Database Integration

Your database schema already supports OAuth users automatically:

### 7.1 Users Table
The `public.users` table mirrors `auth.users`:
- Google users are automatically created in `auth.users` by Supabase
- The `handle_new_auth_user()` trigger creates corresponding records in `public.users`
- Email is extracted from Google profile automatically

### 7.2 User Profile Table
Located in `02_user_profiles.sql`, automatically links to users

## Step 8: Testing

### Local Testing
1. Start your frontend: `npm run dev`
2. Navigate to the sign-in page
3. Click "Sign in with Gmail"
4. You should be redirected to Google's login
5. After authentication, you'll be redirected back to your app

### Troubleshooting

**Issue: "Redirect URI mismatch"**
- Solution: Ensure your redirect URLs exactly match in both Google Cloud Console and Supabase

**Issue: "OAuth provider not configured"**
- Solution: Verify Google provider is enabled in Supabase > Authentication > Providers

**Issue: User not created in public.users table**
- Solution: Check that the `handle_new_auth_user()` trigger is enabled in your database

**Issue: CORS errors**
- Solution: Add your domain to allowed origins in Supabase dashboard

## Step 9: Production Deployment

Before deploying to production:

1. **Update redirect URLs** in:
   - Google Cloud Console (OAuth credentials)
   - Supabase Dashboard (URL Configuration)

2. **Set Site URL** in Supabase to your production domain

3. **Environment Variables**: Update `VITE_SUPABASE_URL` if using a production Supabase instance

Example production config:
```env
VITE_SUPABASE_URL=https://your-prod-instance.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
```

## Useful Links

- [Supabase Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

## Checklist

- [ ] Google OAuth credentials created
- [ ] Google Client ID and Secret added to Supabase
- [ ] Redirect URLs configured in Google Cloud Console
- [ ] Redirect URLs configured in Supabase
- [ ] Site URL set in Supabase
- [ ] Auth callback route created
- [ ] Frontend routes updated
- [ ] Tested locally
- [ ] Production URLs configured
