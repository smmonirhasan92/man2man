# Shared Hosting Deployment Guide for USA Afiliat marking (cPanel)

This guide will help you fix the database issue and deploy the frontend.

## Part 1: Fix Database (Backend)

The backend code is supposed to create tables automatically, but it seems it hasn't happened.

1.  **Upload the Sync Script:**
    *   I have created a script at `backend/scripts/sync-db-manual.js`.
    *   Upload this file to your server folder: `remit-api/scripts/sync-db-manual.js`.

2.  **Run the Script:**
    *   **Option A (Terminal):** If you have terminal access in cPanel:
        ```bash
        cd remit-api
        node scripts/sync-db-manual.js
        ```
    *   **Option B (cPanel Node.js App):**
        *   Go to "Setup Node.js App".
        *   Edit your app.
        *   Temporarily change "Application startup file" to `scripts/sync-db-manual.js`.
        *   Click "Save" and then "Restart" or "Start".
        *   Wait 10-20 seconds.
        *   Check the logs (if available) or check phpMyAdmin to see if tables appeared.
        *   **IMPORTANT:** Change the startup file *back* to `server.js` and click Save/Restart after tables are created.

3.  **Check Logs:**
    *   If tables still don't appear, check the `stderr.log` or `passenger.log` in your `remit-api` folder (use File Manager) to see the error message.

## Part 2: Deploy Frontend (Next.js)

Since you are on shared hosting, the easiest and most stable way to run Next.js is "Static Export".

### 1. Configure for Static Export
Modify `frontend/next.config.ts` (I can do this for you if you want):

```typescript
import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  output: 'export', // <--- ADD THIS
  images: {
    unoptimized: true, // <--- ADD THIS (Required for static export)
  },
};

export default withPWA(nextConfig);
```

### 2. Set Environment Variables
Create a file named `.env.production` in your `frontend` folder locally:

```
NEXT_PUBLIC_API_URL=https://usaaffiliatemarketing.com/api
```

### 3. Build Locally
Run this command in your VS Code terminal (inside `frontend` folder):

```bash
cd frontend
npm run build
```

This will create an `out` folder.

### 4. Upload to cPanel
1.  Go to cPanel File Manager -> `public_html`.
2.  If you want the site at `usaaffiliatemarketing.com`, upload the **contents** of the `out` folder directly to `public_html`.
3.  **Important:** Create a `.htaccess` file in `public_html` to handle routing (so refreshing pages works):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```
