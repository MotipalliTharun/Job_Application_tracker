# Quick Vercel Deployment Guide

## 🚀 Deploy in 5 Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect settings from `vercel.json`

### Step 3: Configure Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables:

**Add these variables:**
- `BLOB_READ_WRITE_TOKEN` (get from Step 4)
- Vercel automatically sets `VERCEL=1` and `VERCEL_ENV`

### Step 4: Enable Vercel Blob Storage
1. In Vercel Dashboard → Your Project → **Storage** tab
2. Click **"Create Database"** → Select **"Blob"**
3. Name it (e.g., `app-storage`) → **Create**
4. Go to Blob store → **Settings** → Copy `BLOB_READ_WRITE_TOKEN`
5. Add it as environment variable (Step 3)

### Step 5: Deploy
1. Click **"Deploy"** button
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployed URL!

## ✅ Verification Checklist

After deployment, verify:
- [ ] Application loads at your Vercel URL
- [ ] Can add new links
- [ ] Can update application status
- [ ] Excel file operations work (check Vercel Blob storage)
- [ ] No console errors in browser

## 🔧 Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in root `package.json`

**API returns 405?**
- Verify `api/applications/[...path].ts` exists
- Check Vercel function logs

**Excel file not saving?**
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob storage is created
- Review function logs for errors

## 📝 Notes

- The app automatically uses Blob storage on Vercel
- Excel file is stored in Vercel Blob, not local filesystem
- All API routes are serverless functions
- Frontend is served as static files

## 🎉 Done!

Your app is now live on Vercel! 🚀

