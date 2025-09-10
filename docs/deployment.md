# Deployment Guide

## Production Deployment to Vercel

### Prerequisites
1. ✅ Supabase project setup with database schema
2. ✅ Environment variables configured
3. ✅ Code tested locally

### Step 1: Prepare Environment Variables

Create these environment variables in Vercel dashboard:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

**Optional:**
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Step 2: Deploy to Vercel

#### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Method 2: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Step 3: Supabase Configuration

Update Supabase Auth settings:
1. Go to Authentication > URL Configuration
2. Add your Vercel domain to:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback`

### Step 4: Domain Configuration

#### Custom Domain (Optional)
1. Add custom domain in Vercel dashboard
2. Update DNS records
3. Update NEXT_PUBLIC_SITE_URL environment variable

### Step 5: Post-Deployment Verification

Test these endpoints:
- ✅ `https://your-domain.vercel.app` - Homepage
- ✅ `https://your-domain.vercel.app/api/health` - Health check
- ✅ `https://your-domain.vercel.app/api/db-health` - Database check
- ✅ `https://your-domain.vercel.app/manifest.json` - PWA manifest

### Production Optimizations Included

1. **Performance**
   - Image optimization
   - Compression enabled
   - Bundle analysis
   - CSS optimization

2. **Security**
   - Security headers
   - HTTPS enforcement
   - XSS protection
   - Content type protection

3. **SEO**
   - Sitemap generation
   - Robots.txt
   - Meta tags optimization
   - Open Graph tags

4. **PWA**
   - Service worker
   - App manifest
   - Offline capabilities
   - Install prompts

5. **Monitoring**
   - Health check endpoints
   - Error boundaries
   - Analytics integration

### Rollback Strategy

If deployment fails:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Rollback to previous deployment if needed

### Performance Monitoring

Monitor these metrics:
- Page load times
- Core Web Vitals
- Error rates
- Database response times

### Maintenance

Regular tasks:
- Update dependencies monthly
- Monitor Supabase usage
- Review security headers
- Update content and features