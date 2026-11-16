# Melo V2 — Firebase Setup Guide (Package: `com.music.melo`)

This guide walks you through setting up Firebase for Melo V2:
1. **Android Client (`com.music.melo`)** — Authentication & Push Notifications (FCM)
2. **Go Backend** — Firebase Admin SDK for token verification and push delivery
3. **Next.js Web Admin Panel** — Firebase Web SDK for administrator login

---

## Step 1: Open / Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select your existing project).
3. Name it (for example `melo-v2`) and follow the prompts. (Google Analytics is optional).

---

## Step 2: Add Android App (`com.music.melo`)
1. In the Firebase project overview or Project Settings, click **Add app** and select the **Android** icon.
2. Fill in:
   - **Android package name**: `com.music.melo` *(Must match exactly)*
   - **App nickname**: `Melo App`
   - **Debug signing certificate SHA-1**:
     ```
     EA:44:9F:DC:3F:C1:8F:80:D7:90:90:0B:1F:FD:13:22:58:E4:1B:AD
     ```
     *(SHA-256 if prompted: `50:EB:90:BA:D2:41:8D:45:8D:57:52:E7:00:81:36:58:97:44:01:B8:05:16:35:DD:A2:14:B5:9A:56:A0:C4:FB`)*
3. Click **Register app**.
4. Download the `google-services.json` file.
5. Save or copy this file into the Android app directory:
   ```
   app/google-services.json
   ```
6. Click **Next** through the remaining steps and finish.

---

## Step 3: Enable Authentication Sign-In Methods
1. In the left sidebar of the Firebase Console, navigate to **Build** > **Authentication**.
2. Click **Get Started** if you haven't enabled it yet.
3. Open the **Sign-in method** tab:
   - **Email/Password**: Click, toggle **Enable**, and click **Save**.
   - **Google**: Click, toggle **Enable**, choose your Project support email, and click **Save**.

---

## Step 4: Generate Backend Service Account Key (for Go Backend)
1. In the Firebase Console, click the **Gear Icon (Project Settings)** in the top left.
2. Select the **Service accounts** tab.
3. Under **Firebase Admin SDK**, verify **Node.js / Go** is selected and click **Generate new private key**.
4. Confirm by clicking **Generate key**.
5. A JSON credentials file will download (e.g. `melo-v2-firebase-adminsdk-xxxxx.json`).
6. Rename this file to:
   ```
   firebase-service-account.json
   ```
   and place it in the `backend/` directory:
   ```
   backend/firebase-service-account.json
   ```
7. In `backend/.env`, ensure:
   ```env
   FIREBASE_PROJECT_ID=<your-firebase-project-id>
   GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json
   ```

---

## Step 5: Register Web App (for Next.js Admin Panel)
1. Back in Firebase Console **Project Settings** > **General** tab:
2. Scroll down to **Your apps** and click **Add app** > select the **Web (</>)** icon.
3. Enter App nickname: `Melo Admin Web`.
4. (Optional) Leave Firebase Hosting unchecked for now, and click **Register app**.
5. Firebase will display `firebaseConfig` credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
6. Copy these values into `admin/.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=<your-apiKey>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-authDomain>
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-projectId>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storageBucket>
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-messagingSenderId>
   NEXT_PUBLIC_FIREBASE_APP_ID=<your-appId>
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

---

## Summary Checklist
- [x] Neon PostgreSQL tables migrated (17 tables active).
- [x] Android package identifier set to `com.music.melo`.
- [ ] `app/google-services.json` placed.
- [ ] Email/Password and Google sign-in enabled in Firebase Console.
- [ ] `backend/firebase-service-account.json` placed.
- [ ] `admin/.env.local` configured with Firebase Web credentials.
