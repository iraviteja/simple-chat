# Deployment Guide

## Backend Deployment (Render)

1. **Create Render Account**
   - Go to [render.com](https://render.com) and sign up

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `simple-chat` repository

3. **Configure Service**
   - **Name**: simplechat-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

4. **Add Environment Variables**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Click "Generate" for a secure key
   - `NODE_ENV`: production
   - `FRONTEND_URL`: (Add after deploying frontend)

5. **Deploy**
   - Click "Create Web Service"
   - Copy the service URL (e.g., https://simplechat-backend.onrender.com)

## Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com) and sign up

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select `simple-chat`

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: frontend
   - **Build Command**: `yarn build`
   - **Output Directory**: dist

4. **Add Environment Variables**
   - `VITE_API_URL`: Your Render backend URL (e.g., https://simplechat-backend.onrender.com)
   - `VITE_SOCKET_URL`: Same as VITE_API_URL

5. **Deploy**
   - Click "Deploy"
   - Copy the deployment URL

## Post-Deployment Steps

1. **Update Backend FRONTEND_URL**
   - Go to Render dashboard
   - Add environment variable:
   - `FRONTEND_URL`: Your Vercel URL (e.g., https://simplechat.vercel.app)
   - Redeploy the service

2. **Test the Application**
   - Open your Vercel URL
   - Create accounts and test messaging

## Alternative Frontend Deployment (Netlify)

1. **Build locally first**
   ```bash
   cd frontend
   yarn build
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `frontend/dist` folder to deploy
   - Or connect GitHub for auto-deploy

3. **Add Environment Variables in Netlify**
   - Go to Site Settings → Environment Variables
   - Add the same variables as Vercel

## Important Notes

- **File Uploads**: Render's free tier has ephemeral storage. Files will be deleted on restart. Consider using Cloudinary or AWS S3 for production.
- **Sleep Mode**: Free Render services sleep after 15 minutes of inactivity. First request will be slow.
- **MongoDB Atlas**: Make sure to whitelist Render's IP addresses (or allow access from anywhere: 0.0.0.0/0)

## Monitoring

- Render provides logs at: Your Service → Logs
- Vercel provides logs at: Your Project → Functions → Logs