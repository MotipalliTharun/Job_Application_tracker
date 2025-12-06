# ✅ Pre-Deployment Checklist

## Before Deploying

### Code Ready
- [x] All TypeScript files compile without errors
- [x] No linting errors
- [x] Server entry point exists (`server/src/index.ts`)
- [x] API routes configured (`api/applications/[...path].ts`)
- [x] Frontend builds successfully
- [x] `vercel.json` configured correctly

### Files to Commit
- [x] All source code files
- [x] `package.json` files (root, client, server)
- [x] `vercel.json`
- [x] `tsconfig.json` files
- [x] Configuration files

### Files NOT to Commit (should be in .gitignore)
- [ ] `node_modules/` (all)
- [ ] `client/dist/`
- [ ] `server/dist/`
- [ ] `data/*.xlsx` (Excel files)
- [ ] `.env` files
- [ ] `*.log` files

## Deployment Steps

### Step 1: Git Setup
```bash
# Check if git is initialized
git status

# If not, initialize:
git init
git add .
git commit -m "Ready for Vercel deployment"
```

### Step 2: GitHub Repository
```bash
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 3: Vercel Import
1. Go to https://vercel.com/new
2. Import from GitHub
3. Select your repository
4. Vercel auto-detects settings from `vercel.json`

### Step 4: First Deploy
- Click "Deploy"
- May fail without Blob storage (that's okay)
- Note the deployment URL

### Step 5: Create Blob Storage
1. Vercel Dashboard → Storage tab
2. Create Database → Blob
3. Name it → Create
4. Settings → Copy `BLOB_READ_WRITE_TOKEN`

### Step 6: Add Environment Variable
1. Settings → Environment Variables
2. Add: `BLOB_READ_WRITE_TOKEN`
3. Paste token value
4. Select all environments
5. Save

### Step 7: Redeploy
1. Deployments tab
2. Latest deployment → ... → Redeploy
3. Wait for completion

### Step 8: Test
- [ ] Visit your Vercel URL
- [ ] Add a link
- [ ] Edit an application
- [ ] Check statistics
- [ ] Refresh page (data should persist)

## Common Issues

### Build Fails
- Check build logs in Vercel
- Verify all dependencies in package.json
- Test build locally: `cd client && npm run build`

### API Returns 500
- Check function logs
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Blob storage is created

### Data Not Persisting
- Verify Blob storage connection
- Check environment variable is set
- Look at function logs for errors

## Success Indicators

✅ Build completes successfully
✅ No errors in build logs
✅ Application loads at Vercel URL
✅ Can add/edit/delete applications
✅ Data persists after refresh
✅ Statistics dashboard works

## Next Steps After Deployment

1. Test all features
2. Set up custom domain (optional)
3. Monitor usage in Analytics
4. Set up notifications (optional)

