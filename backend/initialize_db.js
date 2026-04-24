#!/usr/bin/env node

/**
 * Database initialization script for Cyberlearn platform.
 * This script reads and executes SQL files in the schema directory in the correct order.
 * 
 * Usage:
 *   node initialize_db.js              # Run all migrations
 *   node initialize_db.js --help       # Show help
 *   node initialize_db.js --clean      # Clean database first (dev only)
 *   node initialize_db.js --verbose    # Show detailed output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help');
const verbose = args.includes('--verbose');
const shouldClean = args.includes('--clean');

if (showHelp) {
  console.log(`
Database Initialization Script for Cyberlearn Platform

Usage:
  node initialize_db.js [options]

Options:
  --help              Show this help message
  --verbose           Show detailed output during execution
  --clean             Clean database before running migrations (development only)

Examples:
  node initialize_db.js                    # Initialize database
  node initialize_db.js --clean --verbose  # Clean and reinitialize with verbose output
  `);
  process.exit(0);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function readSQLFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message);
    throw error;
  }
}

async function executeSQLFile(fileName) {
  const filePath = path.join(__dirname, 'database', 'schema', fileName);
  const sql = await readSQLFile(filePath);
  
  if (verbose) {
    console.log(`📄 Executing: ${fileName}`);
  }

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error(`❌ Error executing ${fileName}:`, error.message);
    throw error;
  }

  if (verbose) {
    console.log(`✅ Successfully executed: ${fileName}`);
  }
}

async function executeSQL(sql) {
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}

async function initializeDatabase() {
  console.log('🚀 Initializing Cyberlearn Database...');
  console.log(`📍 Database: ${supabaseUrl}`);
  console.log('');

  try {
    // Optional: Clean database first
    if (shouldClean) {
      console.log('🧹 Cleaning database...');
      const cleanSQL = await readSQLFile(path.join(__dirname, 'database', 'schema', '00_clean.sql'));
      await executeSQL(cleanSQL);
      console.log('✅ Database cleaned');
      console.log('');
    }

    // Execute schema files in order
    const schemaFiles = [
      '01_users.sql',
      '02_user_profiles.sql',
      '03_training_modules.sql',
      '04_training_progress.sql',
      '05_threat_reports.sql',
      '06_alerts.sql',
      '07_notifications.sql',
      '08_onboarding.sql',
      '09_phishing_and_certificates.sql',
      '10_company_access_control.sql',
      '../11_fix_user_role_assignment.sql',
      '../12_comprehensive_dept_training.sql',
      '12_admin_training_learning_access.sql',
      '13_training_completion_certificates.sql',
      '14_company_profile_alignment.sql',
      '15_team_member_user_search_and_default_departments.sql',
      '16_threat_report_replies_and_auto_notifications.sql',
    ];

    console.log('📝 Creating tables and policies...');
    for (const file of schemaFiles) {
      await executeSQLFile(file);
    }

    console.log('');
    console.log('✅ Database initialization complete!');
    console.log('');
    console.log('📚 Tables created:');
    console.log('   - users');
    console.log('   - user_profiles');
    console.log('   - training_modules');
    console.log('   - training_progress');
    console.log('   - threat_reports');
    console.log('   - alerts');
    console.log('   - notifications');
    console.log('');
    console.log('🔒 Row-Level Security (RLS) policies enabled for all tables');
    console.log('');

  } catch (error) {
    console.error('❌ Database initialization failed');
    console.error(error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
