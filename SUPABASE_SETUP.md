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

Once your project is created, go to the SQL Editor and run these queries:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  total_saved DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create favorites table
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, deal_id)
);

-- Create deal_history table
CREATE TABLE deal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own deal history" ON deal_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deal history" ON deal_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

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
