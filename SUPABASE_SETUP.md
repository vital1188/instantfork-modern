# Supabase Setup Guide for Instant Fork

This guide will help you set up Supabase authentication for the Instant Fork app.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the project details:
   - Name: `instant-fork` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest to your users
4. Click "Create Project" and wait for setup to complete

## Step 2: Set Up Database Tables

Once your project is created, go to the SQL Editor and run the setup scripts:

### Initial Setup (Recommended)

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/fix_restaurant_tables.sql`
3. Paste it into the SQL Editor
4. Click "Run"

This script will:
- Check if tables exist before creating them
- Create all necessary tables with proper columns
- Set up Row Level Security policies
- Create indexes and triggers
- Verify the setup was successful

### Alternative: Complete Setup (If Starting Fresh)

If you want to drop all existing tables and start fresh:
1. Copy the contents of `supabase/test_setup.sql`
2. Paste it into the SQL Editor
3. Click "Run"

**Warning**: This will drop existing tables if they exist!

### Troubleshooting Table Issues

If you get errors like "Could not find the 'email' column":

1. Run this query to check your table structure:
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'restaurants'
ORDER BY ordinal_position;
```

2. If the table is missing or has incorrect columns, run `supabase/fix_restaurant_tables.sql`

3. Clear your browser cache and refresh the page

The complete setup includes:
- User profile tables (profiles, favorites, deal_history)
- Restaurant tables (restaurants, deals, deal_claims)
- Row Level Security policies
- Indexes for performance
- Triggers for automatic timestamps
- Views for optimized queries

## Step 3: Configure Authentication

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Email provider (should be enabled by default)
3. Configure email templates if desired (optional)

## Step 4: Get Your API Keys

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - Project URL (looks like `https://xxxxx.supabase.co`)
   - Anon/Public key (safe to use in frontend)

## Step 5: Configure the App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Step 6: Test Authentication

1. Open the app in your browser
2. Click "Sign In" in the header
3. Click "Sign Up" to create a new account
4. Enter your email, password, and full name
5. Check your email for confirmation (if email confirmation is enabled)
6. Sign in with your credentials

## Features Now Available

With Supabase authentication set up, users can:

- ✅ Create accounts and sign in
- ✅ View their profile with real data
- ✅ Add/remove favorites (heart icon on deals)
- ✅ View their deal history
- ✅ See total savings
- ✅ Sign out

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct keys
- Make sure you're using the anon/public key, not the service key
- Restart your development server after changing `.env`

### Can't create account
- Check that email provider is enabled in Supabase
- Check the Supabase dashboard logs for errors
- Ensure your database tables were created correctly

### Favorites not working
- Verify RLS policies are created
- Check browser console for errors
- Ensure user is signed in

## Next Steps

- Set up email templates for better branding
- Add social authentication providers (Google, Facebook, etc.)
- Implement password reset functionality
- Add user avatar uploads
- Set up real-time subscriptions for live updates
