// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

// This robust singleton pattern ensures the Firebase Admin app is initialized only once.
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApp();
}

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
