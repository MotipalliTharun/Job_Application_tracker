# Deployment Guide for Vercel

This guide will help you deploy the Link ATS Tracker application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, for CLI deployment)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Important Notes

⚠️ **Excel File Storage**: This app uses Vercel Blob storage for the Excel file when deployed on Vercel. You'll need to:
- Enable Vercel Blob storage in your Vercel project
- Set up the `BLOB_READ_WRITE_TOKEN` environment variable

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will auto-detect the project settings

3. **Configure Build Settings**
   - **Root Directory**: Leave as default (root)
   - **Framework Preset**: Other
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm run install:all`

4. **Set Environment Variables**
   In Vercel project settings → Environment Variables, add:
   - `BLOB_READ_WRITE_TOKEN`: Get this from Vercel Blob storage settings
   - `VERCEL`: `1` (automatically set by Vercel)
   - `VERCEL_ENV`: `production` (automatically set by Vercel)

5. **Enable Vercel Blob Storage**
   - Go to your Vercel project → Storage
   - Create a new Blob store
   - Copy the `BLOB_READ_WRITE_TOKEN` and add it as an environment variable

6. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add BLOB_READ_WRITE_TOKEN
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Project Structure for Vercel

```
Application_tracker/
├── api/                    # Vercel serverless functions
│   └── applications.ts
├── client/                 # Frontend (React + Vite)
│   └── dist/              # Build output (deployed)
├── server/                 # Backend code (used by serverless functions)
├── vercel.json            # Vercel configuration
└── package.json
```

## Environment Variables

Required environment variables in Vercel:

- `BLOB_READ_WRITE_TOKEN`: Token for Vercel Blob storage access
- `VERCEL`: Automatically set to `1` by Vercel
- `VERCEL_ENV`: Automatically set to `production` by Vercel

## Build Configuration

The `vercel.json` file configures:
- Frontend static build from `client/dist`
- API routes as serverless functions
- Routing rules

## Troubleshooting

### Excel File Not Saving
- Ensure Vercel Blob storage is enabled
- Check that `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify the token has read/write permissions

### API Routes Not Working
- Check that `/api/applications` routes are properly configured
- Verify CORS settings allow your frontend domain
- Check Vercel function logs for errors

### Build Failures
- Ensure all dependencies are in `package.json`
- Check that build commands are correct
- Verify Node.js version compatibility (Vercel uses Node 18+ by default)

## Alternative: Deploy Backend Separately

If you prefer to keep Excel files on a persistent server:

1. **Deploy Frontend to Vercel** (follow steps above)
2. **Deploy Backend to Railway/Render/Heroku**
   - These services provide persistent file storage
   - Update `VITE_API_URL` in frontend to point to backend URL
   - Keep Excel file storage as-is (local filesystem)

## Post-Deployment

After deployment:
1. Test the application at your Vercel URL
2. Verify Excel file operations work correctly
3. Check Vercel function logs for any errors
4. Monitor Vercel Blob storage usage

## Support

For issues:
- Check Vercel deployment logs
- Review Vercel function logs
- Verify environment variables are set correctly
- Ensure Vercel Blob storage is properly configured

