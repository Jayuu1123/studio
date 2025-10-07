'use server';
// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

// This is a robust way to initialize the admin app as a singleton.
// It checks if there are any initialized apps. If not, it initializes one.
// If there are, it gets the existing default app.
if (getApps().length === 0) {
  adminApp = initializeApp();
} else {
  adminApp = getApp();
}

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
