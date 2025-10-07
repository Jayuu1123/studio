// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This is the robust way to initialize the Firebase Admin SDK on the server.
// It checks if an app is already initialized; if not, it initializes one.
// This prevents both "app already exists" and "app does not exist" errors.
const adminApp: App = getApps().length
  ? getApp()
  : initializeApp();

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
