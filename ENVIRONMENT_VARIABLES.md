# Environment Variables Guide

## Required for Vercel Deployment

### 1. BLOB_READ_WRITE_TOKEN (Required)

**Purpose**: Token for accessing Vercel Blob storage where Excel file is stored.

**How to get it**:
1. Go to Vercel Dashboard → Your Project
2. Click "Storage" tab
3. Create a Blob store (if not exists)
4. Click on the Blob store
5. Go to "Settings" tab
6. Copy the `BLOB_READ_WRITE_TOKEN` value

**How to set it**:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
3. Name: `BLOB_READ_WRITE_TOKEN`
4. Value: (paste the token)
5. Environment: Select **all** (Production, Preview, Development)
6. Click "Save"

**What happens if missing**:
- App will still work but data won't persist
- Excel file operations will fail silently
- App will create dummy data on each request

## Auto-Set by Vercel

These are automatically set by Vercel - **don't set them manually**:

- `VERCEL=1` - Indicates running on Vercel
- `VERCEL_ENV` - Set to `production`, `preview`, or `development`
- `VERCEL_URL` - Your deployment URL

## Optional Environment Variables

### VITE_API_URL (Optional - for custom API URL)

**Purpose**: Override the API base URL (defaults to `/api/applications`)

**When to use**: Only if you need to point to a different API server

**Default**: `/api/applications` (works automatically on Vercel)

## Verification

After setting environment variables:

1. **Redeploy** your application
2. Check **Function Logs** in Vercel dashboard
3. Look for log messages like:
   - `isVercel: true`
   - `hasBlobToken: true` (should be true if token is set)

## Troubleshooting

**"Blob storage not available" in logs**:
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check it's enabled for the correct environment
- Redeploy after adding the variable

**Data not persisting**:
- Check function logs for Blob errors
- Verify token has read/write permissions
- Ensure Blob store is created

