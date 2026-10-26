# Vercel Deployment Guide

This document provides step-by-step instructions for deploying the Dimah PVT LTD Inventory Management System to Vercel.

## Prerequisites

- GitHub repository with the project code (already pushed to: https://github.com/aveocafeandlounge-lgtm/dimah-pvt-ltd.git)
- Vercel account (free tier is sufficient)
- Firebase project configured with the provided credentials

## Deployment Steps

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up using your GitHub account
3. Complete the onboarding process

### 2. Import Project to Vercel

1. Log in to Vercel
2. Click "Add New Project"
3. Click "Import" from your Git provider
4. Select the `dimah-pvt-ltd` repository from the list
5. Click "Import"

### 3. Configure Project Settings

Vercel will automatically detect the project as a Vite project. Configure the following:

#### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### Environment Variables

Add the following environment variables in the Vercel dashboard:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| VITE_FIREBASE_API_KEY | AIzaSyAeYlsIMZQ3jRL1OUWxR51yBVnoRPu1Ybo | Firebase API Key |
| VITE_FIREBASE_AUTH_DOMAIN | dimah-pvt-ltd.firebaseapp.com | Firebase Auth Domain |
| VITE_FIREBASE_PROJECT_ID | dimah-pvt-ltd | Firebase Project ID |
| VITE_FIREBASE_STORAGE_BUCKET | dimah-pvt-ltd.firebasestorage.app | Firebase Storage Bucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | 1050685778163 | Firebase Messaging Sender ID |
| VITE_FIREBASE_APP_ID | 1:1050685778163:web:7e66db3b1b355f43ffaf86 | Firebase App ID |
| VITE_FIREBASE_MEASUREMENT_ID | G-5TLSNL7TC0 | Firebase Measurement ID |

**Note**: All environment variables must start with `VITE_` to be accessible in the Vite client-side application.

### 4. Update Firebase Configuration

Update `src/firebase.ts` to use environment variables:

```typescript
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAeYlsIMZQ3jRL1OUWxR51yBVnoRPu1Ybo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dimah-pvt-ltd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dimah-pvt-ltd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dimah-pvt-ltd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1050685778163",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1050685778163:web:7e66db3b1b355f43ffaf86",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5TLSNL7TC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics };
```

### 5. Deploy

1. Click "Deploy" button in Vercel
2. Wait for the build to complete (usually 1-2 minutes)
3. Vercel will provide a deployment URL (e.g., `https://dimah-pvt-ltd.vercel.app`)

### 6. Configure Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Click "Add Domain"
3. Enter your custom domain (e.g., `inventory.dimah.mv`)
4. Follow the DNS configuration instructions provided by Vercel

## Post-Deployment Checklist

- [ ] Verify the site loads correctly at the Vercel URL
- [ ] Test login functionality in both demo mode and Firebase mode
- [ ] Test CRUD operations for all entities
- [ ] Verify PWA installation works
- [ ] Test mobile responsiveness
- [ ] Verify Firebase Authentication works
- [ ] Verify Firestore data persistence works
- [ ] Apply Firestore Security Rules from FIRESTORE_RULES.md

## Continuous Deployment

Vercel automatically sets up continuous deployment. Every time you push to the `main` branch on GitHub:

1. Vercel will detect the change
2. Build the project
3. Deploy to production
4. Provide a preview URL for the new deployment

## Troubleshooting

### Build Fails

- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript configuration is correct

### Environment Variables Not Working

- Ensure variables start with `VITE_`
- Check that variables are set in the correct environment (Production vs Preview)
- Rebuild the deployment after adding environment variables

### Firebase Authentication Issues

- Verify Firebase project is in production mode
- Check that Firebase Auth is enabled in Firebase Console
- Ensure authorized domains include the Vercel deployment URL

### Firestore Connection Issues

- Verify Firestore is enabled in Firebase Console
- Check Firestore Security Rules
- Ensure the Firebase project ID matches

## Production vs Demo Mode

The application currently defaults to demo mode (`isDemoMode = true` in AppContext). To enable Firebase production mode:

1. Update `src/context/AppContext.tsx`:
```typescript
const [isDemoMode, _setIsDemoMode] = useState(false);
```

2. Or add an environment variable:
```typescript
const [isDemoMode, _setIsDemoMode] = useState(import.meta.env.VITE_DEMO_MODE === 'true');
```

And add `VITE_DEMO_MODE=false` to Vercel environment variables.

## Support

For issues with:
- **Vercel Deployment**: [Vercel Documentation](https://vercel.com/docs)
- **Firebase Configuration**: [Firebase Documentation](https://firebase.google.com/docs)
- **Application Issues**: Check the GitHub repository issues or contact the development team
