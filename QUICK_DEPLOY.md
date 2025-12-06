# ⚡ Quick Deploy to Vercel

## 5-Minute Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Click **"Deploy"** (first deploy may fail, that's okay)

### 3. Create Blob Storage
1. Vercel Dashboard → Your Project → **"Storage"** tab
2. **"Create Database"** → Select **"Blob"**
3. Name it → **"Create"**
4. Go to **"Settings"** → Copy `BLOB_READ_WRITE_TOKEN`

### 4. Add Environment Variable
1. Project → **"Settings"** → **"Environment Variables"**
2. Add: `BLOB_READ_WRITE_TOKEN` = (paste token)
3. Select all environments → **"Save"**

### 5. Redeploy
1. **"Deployments"** tab → Latest deployment → **"..."** → **"Redeploy"**
2. Wait for build to complete
3. Visit your URL! 🎉

## That's It!

Your app is now live on Vercel with persistent Excel file storage!

