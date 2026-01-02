# 🚀 Verso Deployment Guide

This guide walks you through deploying Verso to production using **Railway** (backend + database) and **Vercel** (frontend).

**Estimated time: 20-30 minutes**
**Cost: ~$5-15/month** after free tiers

---

## Prerequisites

1. A [GitHub](https://github.com) account
2. Your Verso code pushed to a GitHub repository
3. A custom domain (optional but recommended)
4. An [Anthropic API key](https://console.anthropic.com/) for AI recommendations (optional)

---

## Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git repo
cd verso
git init

# Create .gitignore
echo "node_modules/
dist/
__pycache__/
*.db
.env
.env.local
*.pyc" > .gitignore

# Commit everything
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/verso.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### 2.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select your Verso repository
4. Railway will detect the backend folder

### 2.3 Configure Backend Service
1. Click on the deployed service
2. Go to **Settings** tab
3. Set **Root Directory** to: `backend`
4. Set **Start Command** to: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.4 Add PostgreSQL Database
1. Click **"+ New"** in your project
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically sets `DATABASE_URL`

### 2.5 Set Environment Variables
1. Click on your backend service
2. Go to **Variables** tab
3. Add these variables:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ANTHROPIC_API_KEY` | Your key from console.anthropic.com (optional) |

### 2.6 Get Your Backend URL
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `verso-backend-production.up.railway.app`)

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your Verso repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`

### 3.3 Set Environment Variable
1. Expand **"Environment Variables"**
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Railway backend URL (e.g., `https://verso-backend-production.up.railway.app`)

3. Click **"Deploy"**

### 3.4 Get Your Frontend URL
After deployment, Vercel gives you a URL like `verso-frontend.vercel.app`

---

## Step 4: Connect Your Custom Domain

### 4.1 Add Domain to Vercel (for frontend)
1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your domain: `verso.yourdomain.com` or `yourdomain.com`
4. Vercel shows DNS records to add

### 4.2 Update DNS at Your Registrar
Add these DNS records:

**For apex domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain (verso.yourdomain.com):**
```
Type: CNAME
Name: verso
Value: cname.vercel-dns.com
```

### 4.3 (Optional) Custom Domain for Backend
If you want `api.yourdomain.com`:
1. In Railway, go to **Settings** → **Networking**
2. Add custom domain
3. Add CNAME record pointing to Railway

### 4.4 Update CORS (if using custom backend domain)
If your backend has a custom domain, update `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "https://verso.yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Step 5: Verify Deployment

1. **Backend health check**: Visit `https://your-backend-url.up.railway.app/`
   - Should see: `{"message": "Verso API is running", "version": "2.0.0"}`

2. **Frontend**: Visit `https://yourdomain.com`
   - Should see Verso login page

3. **Test registration**: Create an account and log in

4. **Test features**: Add a book, write a review

---

## Troubleshooting

### "CORS error" in browser console
- Check that your frontend's `VITE_API_URL` matches your backend URL exactly
- Verify CORS settings in `main.py` include your frontend domain

### "Database connection failed"
- Check Railway dashboard for PostgreSQL status
- Verify `DATABASE_URL` is set in backend variables

### "Module not found" errors
- Make sure `requirements.txt` includes all dependencies
- Try redeploying the backend

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly in Vercel

---

## Ongoing Costs

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| Railway | $5 credit/month | ~$5-10/month |
| Vercel | Generous free tier | Free for most uses |
| Domain | - | ~$10-15/year |
| Anthropic API | - | ~$5-50/month (usage based) |

**Total: ~$5-15/month** for a small user base

---

## Optional: Set Up CI/CD

Both Railway and Vercel auto-deploy when you push to GitHub. To customize:

### Railway
Create `railway.toml` in backend folder:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/"
```

### Vercel
Already configured via `vercel.json`

---

## Need Help?

- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- FastAPI docs: https://fastapi.tiangolo.com

---

🎉 **Congratulations!** Your Verso instance is now live!
