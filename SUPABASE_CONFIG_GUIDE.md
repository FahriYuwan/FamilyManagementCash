# 🔧 Supabase Authentication Configuration Guide

## Critical Supabase Settings for Production Login

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Family Management Cash project
3. Verify you're in the correct project

### Step 2: Authentication Configuration

**Go to Authentication → Settings → General**

#### Site URL Configuration
```bash
# Set Site URL to:
https://family-management-cash.vercel.app

# NOT these (common mistakes):
❌ http://localhost:3000
❌ https://family-management-cash.vercel.app/
❌ https://family-management-cash.vercel.app/auth/login
```

#### Additional Redirect URLs
```bash
# Add these redirect URLs:
https://family-management-cash.vercel.app/auth/callback
https://family-management-cash.vercel.app/auth/reset-password
https://family-management-cash.vercel.app/**

# Optional preview URLs (if you use preview deployments):
https://*.vercel.app/auth/callback
https://*.vercel.app/auth/reset-password
```

### Step 3: Email Authentication Settings

**Go to Authentication → Settings → Auth**

#### Email Settings
- ✅ **Enable email confirmations**: ON (recommended)
- ✅ **Enable email change confirmations**: ON
- ✅ **Secure email change**: ON

#### Session Settings
- ✅ **JWT expiry**: 3600 seconds (1 hour) - default is fine
- ✅ **Refresh token rotation**: ON (recommended for security)
- ✅ **Reuse interval**: 10 seconds (default)

### Step 4: SMTP Configuration (Optional but Recommended)

**Go to Authentication → Settings → SMTP**

If you want custom email sending (not required for basic login):
```bash
# SMTP settings for production emails
# You can use Gmail, SendGrid, or other providers
# This is optional - Supabase has default email service
```

### Step 5: User Management

**Go to Authentication → Users**

#### Verify Demo Users Exist
Check if these demo users are created:
```bash
# Expected demo users:
Email: ayah@demo.com
Email: ibu@demo.com

# If they don't exist, create them manually:
1. Click "Add user"
2. Enter email and password
3. Set email_confirmed_at to current timestamp
4. Save
```

#### Manual User Creation (if needed)
```sql
-- If demo users don't exist, you can create them via SQL Editor:
-- Go to SQL Editor and run:

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ayah@demo.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Ayah Demo", "role": "ayah"}'
);
```

### Step 6: Row Level Security (RLS) Check

**Go to Table Editor → Users table**

#### Verify RLS Policies
```sql
-- Check if these policies exist:
-- Go to SQL Editor and verify:

-- Policy for users to read their own data
SELECT * FROM pg_policies WHERE tablename = 'users';

-- If no policies exist, you might need to create them
-- Check your schema.sql file for the correct policies
```

### Step 7: API Settings Verification

**Go to Settings → API**

#### Double-check API credentials
```bash
# Project URL should be:
https://[your-project-id].supabase.co

# anon (public) key should start with:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Make sure these match what you set in Vercel
```

### Step 8: Database Connection Test

**Go to SQL Editor**

#### Test basic connectivity:
```sql
-- Run this query to test database connection:
SELECT version();

-- Test users table:
SELECT count(*) FROM auth.users;

-- Check if your app's users table exists:
SELECT * FROM users LIMIT 5;
```

### Step 9: Common Supabase Issues & Solutions

#### Issue 1: "Invalid login credentials"
```bash
Causes:
- User doesn't exist in auth.users
- Wrong password
- Email not confirmed

Solutions:
- Check Authentication → Users in dashboard
- Manually confirm email for demo users
- Reset password for test users
```

#### Issue 2: "Email not confirmed"
```bash
Solution:
1. Go to Authentication → Users
2. Find the user
3. Click on user
4. Set "email_confirmed_at" to current timestamp
5. Save
```

#### Issue 3: "Access token expired"
```bash
Solution:
- This is normal behavior
- App should handle token refresh automatically
- Check if refresh token rotation is enabled
```

#### Issue 4: CORS errors
```bash
Solution:
- Verify Site URL is exactly your Vercel domain
- No trailing slashes
- Use HTTPS not HTTP
```

### Step 10: Test Authentication Flow

#### Manual Test Steps:
1. **Sign up test**: Try creating new user in dashboard
2. **Password reset**: Test forgot password flow
3. **Session persistence**: Check if login persists after refresh
4. **Token refresh**: Test long-session behavior

## 🚨 Emergency Checklist

If authentication still fails:

- [ ] Site URL matches Vercel domain exactly
- [ ] Redirect URLs include /auth/callback
- [ ] Demo users exist and are email-confirmed
- [ ] API keys match between Supabase and Vercel
- [ ] RLS policies allow user access
- [ ] No CORS errors in browser console
- [ ] Database connection works in SQL Editor

## 🔍 Debug Commands

```sql
-- Run these in Supabase SQL Editor to debug:

-- Check if users exist:
SELECT email, email_confirmed_at, created_at FROM auth.users;

-- Check app users table:
SELECT * FROM users;

-- Check RLS policies:
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 📞 Next Steps

After verifying Supabase settings:
1. Test with `/auth/debug` page
2. Check browser console for specific errors
3. Try manual password reset
4. Test with different browsers/incognito mode