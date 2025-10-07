'use server';
// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

// Check if the admin app is already initialized to prevent re-initialization.
if (!getApps().length) {
    // When running in a Google Cloud environment like App Hosting,
    // the Admin SDK can automatically discover the service account credentials.
    // We initialize the app without any arguments.
    adminApp = initializeApp();
} else {
    adminApp = getApp();
}


export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
