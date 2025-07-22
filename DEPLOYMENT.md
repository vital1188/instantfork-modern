# Deployment Guide for InstantFork

This guide covers how to deploy the InstantFork application to various hosting platforms with proper SPA (Single Page Application) routing support.

## 🚀 SPA Routing Configuration

The application uses React Router with `createBrowserRouter` for client-side routing. To prevent 404 errors when refreshing pages or accessing routes directly, the following configurations have been added:

### Files Created:
- `public/_redirects` - Netlify configuration
- `vercel.json` - Vercel configuration  
- `public/.htaccess` - Apache server configuration
- Updated `vite.config.ts` - Build optimizations
- Enhanced `src/router.tsx` - Error boundaries and 404 handling

## 📱 Deployment Platforms

### 1. Netlify Deployment

**Configuration**: `public/_redirects`
```
/*    /index.html   200
```

**Steps**:
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy - the `_redirects` file will handle SPA routing automatically

**Environment Variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY` (optional)

### 2. Vercel Deployment

**Configuration**: `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Steps**:
1. Connect your GitHub repository to Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy - the `vercel.json` file will handle SPA routing

**Environment Variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY` (optional)

### 3. Apache Server Deployment

**Configuration**: `public/.htaccess`

The `.htaccess` file includes:
- SPA routing with fallback to `index.html`
- Security headers
- Gzip compression
- Static asset caching

**Steps**:
1. Build the application: `npm run build`
2. Upload the `dist` folder contents to your Apache server
3. Ensure mod_rewrite is enabled
4. The `.htaccess` file will handle routing automatically

### 4. Nginx Deployment

**Configuration**: Add to your Nginx server block:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

# Security headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 5. GitHub Pages Deployment

**Note**: GitHub Pages doesn't support server-side redirects, so you'll need a workaround:

1. Create `public/404.html` with redirect script:
```html
<!DOCTYPE html>
<html>
<head>
    <script>
        sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
</head>
<body></body>
</html>
```

2. Add to your main `index.html` in the `<head>`:
```html
<script>
    (function() {
        var redirect = sessionStorage.redirect;
        delete sessionStorage.redirect;
        if (redirect && redirect != location.href) {
            history.replaceState(null, null, redirect);
        }
    })();
</script>
```

## 🔧 Build Configuration

### Vite Configuration (`vite.config.ts`)

The configuration includes:
- Build optimizations with manual chunks
- Vendor splitting for better caching
- Development server configuration

### Router Configuration (`src/router.tsx`)

Enhanced with:
- Error boundaries for each route
- 404 Not Found page for unmatched routes
- Graceful error handling

## 🛡️ Security Features

All deployment configurations include security headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control

## 📊 Performance Optimizations

- **Code Splitting**: Vendor, router, and UI libraries are split into separate chunks
- **Gzip Compression**: Enabled for text-based assets
- **Static Asset Caching**: Long-term caching for images, CSS, and JS files
- **Bundle Analysis**: Use `npm run build -- --analyze` to analyze bundle size

## 🧪 Testing Deployment

After deployment, test these scenarios:
1. Direct URL access: `yoursite.com/restaurant-register`
2. Page refresh on any route
3. Browser back/forward navigation
4. Deep linking from external sites

## 🔍 Troubleshooting

### Common Issues:

1. **404 on page refresh**:
   - Ensure the appropriate configuration file is present
   - Check server configuration is applied
   - Verify build output includes the config files

2. **Routes not working**:
   - Check browser console for JavaScript errors
   - Verify all route components are properly imported
   - Ensure React Router is configured correctly

3. **Environment variables not working**:
   - Ensure variables are prefixed with `VITE_`
   - Check they're set in your deployment platform
   - Verify they're not in `.env.local` (not deployed)

## 📝 Environment Variables

Required for full functionality:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key (optional)
```

## 🚀 Quick Deploy Commands

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Netlify (with Netlify CLI)
netlify deploy --prod --dir=dist

# Deploy to Vercel (with Vercel CLI)
vercel --prod
```

---

With these configurations, your InstantFork application will handle page refreshes and direct URL access correctly across all major hosting platforms! 🎉
