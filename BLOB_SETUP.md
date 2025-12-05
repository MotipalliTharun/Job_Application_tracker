# Quick Vercel Blob Setup

## Steps to Connect Blob Storage

1. **Go to Vercel Dashboard**
   - Open your project: https://vercel.com/dashboard
   - Click on your project

2. **Create Blob Store**
   - Click **"Storage"** in sidebar
   - Click **"Create Database"** → Select **"Blob"**
   - Name it (e.g., `app-storage`) → **"Create"**

3. **Get Token**
   - Open your Blob store
   - Go to **"Settings"** or **"Environment Variables"**
   - Copy the `BLOB_READ_WRITE_TOKEN` value

4. **Add Environment Variable**
   - Project → **Settings** → **Environment Variables**
   - Click **"Add New"**
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Paste the token
   - **Environments**: Select all (Production, Preview, Development)
   - Click **"Save"**

5. **Redeploy**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on latest deployment
   - Or push a new commit

## Done! ✅

The app will automatically use Blob storage on Vercel. No code changes needed.

**Note**: Works automatically - the code detects Vercel environment and uses Blob storage.


