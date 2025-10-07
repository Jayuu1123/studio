// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This robust singleton pattern ensures that the Firebase Admin app is initialized only once.
// It checks if there are any existing apps. If not, it initializes a new one.
// If an app already exists, it retrieves the existing one. This prevents re-initialization errors.
const adminApp: App = !getApps().length ? initializeApp() : getApp();

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
