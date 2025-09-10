# 🔧 Vercel Environment Variables Verification Guide

## Critical Environment Variables Check

### Step 1: Access Vercel Dashboard
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your `family-management-cash` project
3. Click on the project name
4. Go to **Settings** → **Environment Variables**

### Step 2: Required Variables

**Verify these variables are set EXACTLY as shown:**

```bash
# Variable Name: NEXT_PUBLIC_SUPABASE_URL
# Value should look like: https://abcdefghijk.supabase.co
# Environment: Production, Preview, Development

# Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
# Value should look like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
# Environment: Production, Preview, Development

# Variable Name: NEXT_PUBLIC_SITE_URL
# Value: https://family-management-cash.vercel.app
# Environment: Production, Preview, Development
```

### Step 3: Common Issues & Solutions

**Issue 1: Variables Not Set for All Environments**
- ✅ **Solution**: Ensure each variable is checked for Production, Preview, AND Development

**Issue 2: Wrong Variable Names**
- ❌ Wrong: `SUPABASE_URL` (missing NEXT_PUBLIC_)
- ✅ Correct: `NEXT_PUBLIC_SUPABASE_URL`
- ❌ Wrong: `SUPABASE_ANON_KEY` (missing NEXT_PUBLIC_)
- ✅ Correct: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Issue 3: Incorrect SITE_URL**
- ❌ Wrong: `http://localhost:3000` (for production)
- ❌ Wrong: `https://family-management-cash.vercel.app/` (trailing slash)
- ✅ Correct: `https://family-management-cash.vercel.app`

**Issue 4: Copy-Paste Errors**
- Check for extra spaces before/after values
- Verify the Supabase URL ends with `.supabase.co`
- Verify the anon key starts with `eyJ`

### Step 4: Get Correct Values from Supabase

1. **Go to Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select Your Project**
3. **Go to Settings → API**
4. **Copy the following**:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Force Redeploy After Changes

**After updating environment variables:**
1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the **"..."** menu
4. Select **"Redeploy"**
5. **IMPORTANT**: Uncheck **"Use existing Build Cache"**
6. Click **"Redeploy"**

### Step 6: Verification Commands

**Test if variables are working:**
```bash
# Visit this URL after deployment:
https://family-management-cash.vercel.app/auth/debug

# This page will show you:
# - If environment variables are set
# - If Supabase connection works  
# - If authentication is configured correctly
```

## 🚨 Emergency Checklist

If login still fails after setting variables:

- [ ] All 3 environment variables are set in Vercel
- [ ] Variables are enabled for Production environment
- [ ] No trailing/leading spaces in variable values
- [ ] Supabase URL is correct (ends with .supabase.co)
- [ ] Anon key is complete (starts with eyJ, very long string)
- [ ] Site URL matches your actual Vercel domain
- [ ] Redeployed without build cache after changes
- [ ] Tested on /auth/debug page first

## 🔍 Debug Information

**To get debug information, visit:**
```
https://your-domain.vercel.app/auth/debug
```

**This page will show you:**
- Environment variable status
- Supabase connection status
- Network connectivity
- Login test results

## 📞 Next Steps

If variables are correct but login still fails:
1. Check the `/auth/debug` page output
2. Check browser console for errors
3. Verify Supabase authentication settings
4. Check if users exist in Supabase Auth dashboard