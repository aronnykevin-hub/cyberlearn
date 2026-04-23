#!/bin/bash
# Quick Verification Script for Google OAuth Setup
# Run this to verify your configuration is correct

echo "=================================="
echo "CyberLearn Google OAuth Verification"
echo "=================================="
echo ""

# Check 1: Environment Variables
echo "✓ Checking environment variables..."
if [ -f ".env.local" ]; then
  if grep -q "VITE_SUPABASE_URL" .env.local; then
    echo "  ✅ VITE_SUPABASE_URL found"
  else
    echo "  ❌ VITE_SUPABASE_URL missing"
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    echo "  ✅ VITE_SUPABASE_ANON_KEY found"
  else
    echo "  ❌ VITE_SUPABASE_ANON_KEY missing"
  fi
else
  echo "  ❌ .env.local file not found"
fi
echo ""

# Check 2: Frontend Files
echo "✓ Checking frontend components..."
if [ -f "frontend/src/services/authService.js" ]; then
  if grep -q "signInWithGoogle" frontend/src/services/authService.js; then
    echo "  ✅ signInWithGoogle function exists"
  else
    echo "  ❌ signInWithGoogle function not found"
  fi
else
  echo "  ❌ authService.js not found"
fi

if [ -f "frontend/src/SignInForm.tsx" ]; then
  if grep -q "Sign in with Gmail" frontend/src/SignInForm.tsx; then
    echo "  ✅ Google Sign-In button exists"
  else
    echo "  ❌ Google Sign-In button not found"
  fi
else
  echo "  ❌ SignInForm.tsx not found"
fi

if [ -f "frontend/src/AuthCallback.tsx" ]; then
  echo "  ✅ AuthCallback.tsx exists"
else
  echo "  ❌ AuthCallback.tsx not found"
fi
echo ""

# Check 3: Database Schema
echo "✓ Checking database schema..."
if [ -f "backend/database/schema/01_users.sql" ]; then
  if grep -q "handle_new_auth_user" backend/database/schema/01_users.sql; then
    echo "  ✅ User trigger function exists"
  else
    echo "  ❌ User trigger function not found"
  fi
else
  echo "  ❌ users.sql schema file not found"
fi
echo ""

# Check 4: Documentation
echo "✓ Checking documentation..."
if [ -f "GOOGLE_OAUTH_SETUP.md" ]; then
  echo "  ✅ GOOGLE_OAUTH_SETUP.md exists"
else
  echo "  ❌ GOOGLE_OAUTH_SETUP.md not found"
fi

if [ -f "OAUTH_IMPLEMENTATION_GUIDE.md" ]; then
  echo "  ✅ OAUTH_IMPLEMENTATION_GUIDE.md exists"
else
  echo "  ❌ OAUTH_IMPLEMENTATION_GUIDE.md not found"
fi
echo ""

echo "=================================="
echo "Next Steps:"
echo "=================================="
echo "1. Create Google OAuth credentials in Google Cloud Console"
echo "2. Configure Google provider in Supabase Dashboard"
echo "3. Add /auth/callback route to your app"
echo "4. Test the OAuth flow locally"
echo ""
echo "See OAUTH_IMPLEMENTATION_GUIDE.md for detailed instructions"
echo "=================================="
