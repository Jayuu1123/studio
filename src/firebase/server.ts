// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// When running in a Google Cloud environment like App Hosting,
// the Admin SDK can automatically discover the service account credentials.
// We initialize the app without any arguments.
const adminApp =
  getApps().find((app) => app.name === 'admin') ||
  initializeApp({}, 'admin');


export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);

// A simplified initializer for server components
export function initializeFirebase() {
    return {
        firestore: adminFirestore,
        auth: adminAuth,
    }
}
