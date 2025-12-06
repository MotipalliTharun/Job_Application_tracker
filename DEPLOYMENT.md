# 🚀 Vercel Deployment Guide

Complete guide to deploy Link ATS Tracker to Vercel.

## Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier is fine)
3. **Node.js** - For local testing (optional)

## Step 1: Prepare Your Code

### 1.1 Initialize Git (if not already done)

```bash
cd /Users/macbookair2020i5/Downloads/Application_tracker
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
```

### 1.2 Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it (e.g., `link-ats-tracker`)
3. **Don't** initialize with README, .gitignore, or license
4. Copy the repository URL

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**

### 2.2 Configure Project Settings

Vercel should auto-detect the settings, but verify:

- **Framework Preset**: Other (or Vite if available)
- **Root Directory**: `./` (root of project)
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install && npm run install:all`

### 2.3 Environment Variables

**You don't need to set any environment variables yet** - we'll do this after creating Blob storage.

Click **"Deploy"** to start the first deployment (it may fail without Blob storage, that's okay).

## Step 3: Set Up Vercel Blob Storage

### 3.1 Create Blob Storage

1. In your Vercel project dashboard, go to the **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Blob"**
4. Name it (e.g., `app-storage`)
5. Click **"Create"**

### 3.2 Get Blob Token

1. Click on your Blob store
2. Go to **"Settings"** tab
3. Find **"BLOB_READ_WRITE_TOKEN"**
4. Copy the token value

### 3.3 Add Environment Variable

1. Go back to your project dashboard
2. Go to **"Settings"** → **"Environment Variables"**
3. Click **"Add New"**
4. Add:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste the token you copied)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **"Save"**

## Step 4: Redeploy

After adding the environment variable:

1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic deployment

## Step 5: Verify Deployment

### 5.1 Check Build Logs

1. Go to **"Deployments"** tab
2. Click on the deployment
3. Check **"Build Logs"** for any errors

### 5.2 Test Your Application

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test these features:
   - ✅ Application loads
   - ✅ Can add a single link
   - ✅ Can bulk paste links
   - ✅ Can edit applications
   - ✅ Can change status/priority
   - ✅ Statistics dashboard works
   - ✅ Data persists (add something, refresh page)

### 5.3 Check Function Logs

1. Go to **"Functions"** tab in Vercel dashboard
2. Click on any function
3. Check **"Logs"** for runtime errors

## Troubleshooting

### Build Fails

**Error: Module not found**
- Make sure all dependencies are in root `package.json`
- Check that `installCommand` runs `npm run install:all`

**Error: TypeScript errors**
- Run `npm run build` locally first to catch errors
- Check `tsconfig.json` files are correct

### Runtime Errors

**Error: 500 Internal Server Error**
- Check Vercel function logs
- Verify `BLOB_READ_WRITE_TOKEN` is set correctly
- Check that Blob storage is created

**Error: CORS issues**
- Already handled in code, but verify CORS headers in API routes

**Error: Excel file not saving**
- Verify Blob storage is connected
- Check `BLOB_READ_WRITE_TOKEN` environment variable
- Look at function logs for specific errors

### API Routes Not Working

**Error: 404 on API routes**
- Verify `api/applications/[...path].ts` exists
- Check `vercel.json` configuration
- Ensure routes are in `/api` directory

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Build settings configured
- [ ] Blob storage created
- [ ] `BLOB_READ_WRITE_TOKEN` environment variable set
- [ ] Deployment successful
- [ ] Application tested and working
- [ ] Custom domain configured (optional)

## Post-Deployment

### Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Add your custom domain
3. Follow DNS configuration instructions

### Monitoring

- Check **"Analytics"** tab for usage stats
- Monitor **"Functions"** for performance
- Set up alerts in **"Settings"** → **"Notifications"**

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Yes | Token for Vercel Blob storage access |
| `VERCEL` | Auto | Automatically set to `1` by Vercel |
| `VERCEL_ENV` | Auto | Set to `production`, `preview`, or `development` |

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check function runtime logs
3. Verify all environment variables are set
4. Test locally first: `npm run dev`

## 🎉 Success!

Once deployed, your application will be available at:
- Production: `https://your-app.vercel.app`
- Preview: `https://your-app-git-branch.vercel.app` (for each branch)

Your Excel file will be stored in Vercel Blob storage and persist across deployments!

