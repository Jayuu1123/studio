// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp();
}

const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
