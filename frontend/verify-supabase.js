#!/usr/bin/env node

/**
 * ========================================================================
 * VERIFY SUPABASE CONNECTION & AUTH SETTINGS
 * ========================================================================
 * Run this from the project root: node verify-supabase.js
 * 
 * This script will test:
 * - Environment variables are set
 * - Supabase connection works
 * - Anonymous auth is enabled
 * - Database is accessible
 * ========================================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║         SUPABASE CONNECTION & AUTH VERIFICATION                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

// Step 1: Check environment variables
console.log('\n📋 CHECKING ENVIRONMENT VARIABLES...\n');

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL not found in .env.local');
  process.exit(1);
} else {
  console.log('✅ VITE_SUPABASE_URL found');
  console.log(`   Project: ${supabaseUrl.split('.')[0].split('//')[1]}`);
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY found');
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);
}

// Step 2: Initialize Supabase client
console.log('\n🔌 INITIALIZING SUPABASE CLIENT...\n');

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  process.exit(1);
}

// Step 3: Test database connection
console.log('\n🗄️  TESTING DATABASE CONNECTION...\n');

try {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error && error.code === 'PGRST116') {
    // Table exists but is empty - this is fine
    console.log('✅ Database connection successful (users table exists)');
  } else if (error && error.code === 'PGRST205') {
    console.error('❌ Table not found. Run: node backend/initialize_db.js');
    process.exit(1);
  } else if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
  }
} catch (error) {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
}

// Step 4: Test anonymous auth
console.log('\n👤 TESTING ANONYMOUS AUTHENTICATION...\n');

try {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    if (error.message.includes('Anonymous sign-ins are disabled')) {
      console.error('❌ Anonymous auth is DISABLED in Supabase');
      console.log('\n   ⚠️  SOLUTION: Enable Anonymous auth in Supabase:');
      console.log('      1. Go to: https://app.supabase.com');
      console.log('      2. Select your project');
      console.log('      3. Go to: Authentication → Providers');
      console.log('      4. Find "Anonymous" and toggle it ON');
      console.log('      5. Click Save');
    } else {
      console.error('❌ Anonymous auth error:', error.message);
    }
    process.exit(1);
  } else if (data.user && data.user.is_anonymous) {
    console.log('✅ Anonymous auth is ENABLED and working');
    console.log(`   Session: ${data.session.access_token.substring(0, 20)}...`);
  } else {
    console.error('❌ Unexpected response from anonymous auth');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to test anonymous auth:', error.message);
  process.exit(1);
}

// Step 5: Check user profile table
console.log('\n👥 CHECKING USER_PROFILES TABLE...\n');

try {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error && error.code === 'PGRST205') {
    console.error('❌ user_profiles table not found');
    console.log('   Run: node backend/initialize_db.js');
    process.exit(1);
  } else if (error) {
    console.error('❌ Error accessing user_profiles:', error.message);
    process.exit(1);
  } else {
    console.log('✅ user_profiles table exists and is accessible');
  }
} catch (error) {
  console.error('❌ Failed to check user_profiles:', error.message);
  process.exit(1);
}

// Step 6: Summary
console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                     ✅ ALL CHECKS PASSED!                         ║
╚════════════════════════════════════════════════════════════════════╝

Your Supabase setup is configured correctly:

✓ Environment variables loaded
✓ Supabase client connected
✓ Database accessible
✓ Anonymous authentication enabled
✓ User profiles table exists

YOU'RE READY TO:

1. Start dev server:
   npm run dev

2. Test anonymous sign-in:
   - Click "Continue as guest"
   - Check browser console for success

3. Test email signup:
   - Click "Sign up"
   - Enter username and password
   - Should create account successfully

4. Test email linking:
   - Sign in as guest
   - Click "Link Email"
   - Should upgrade account to permanent

═══════════════════════════════════════════════════════════════════════
`);

// Clean up: sign out the test user
try {
  await supabase.auth.signOut();
} catch (err) {
  // Ignore cleanup errors
}
