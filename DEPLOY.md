# Relay - Deployment Guide

## 🚀 Cloudflare Pages Deployment

### Prerequisites
1. A Cloudflare account
2. Your Firebase project configured

### Deploy Steps

#### 1. Build the Project
```bash
npm run build
```

#### 2. Deploy to Cloudflare Pages

**Option A: Via Cloudflare Dashboard**
1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect your GitHub repository OR upload the `dist` folder
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

**Option B: Via Wrangler CLI**
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist
```

---

## 🔥 Deploy Firestore Rules

### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

---

## 🔒 Security Checklist

- [ ] Firestore rules deployed
- [ ] Environment variables set in Cloudflare
- [ ] Firebase Auth enabled (Email/Password)
- [ ] Firestore database created (production mode)
- [ ] GM user created manually in Firestore

---

## 📋 Post-Deployment

1. **Create GM User:**
   - Register normally at `/register`
   - Go to Firebase Console → Firestore → `users/{uid}`
   - Change `role` from `"receptionist"` to `"gm"`

2. **Create Hotel:**
   - Login as GM
   - Go to `/setup-hotel`
   - Create your hotel

3. **Invite Staff:**
   - Share registration link
   - Staff selects your hotel on setup
