// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * A robust way to initialize the Firebase Admin SDK on the server.
 * This pattern ensures that the app is initialized only once, preventing
 * both "app already exists" and "app does not exist" errors that can
 * occur in a server environment with module caching and hot-reloading.
 */
function getAdminApp(): App {
  // The 'find' method is a reliable way to check for an existing app.
  const alreadyExists = getApps().find(app => app.name === '[DEFAULT]');
  if (alreadyExists) {
    return alreadyExists;
  }
  // If no app exists, initialize a new one. In a managed Google Cloud
  // environment (like App Hosting), initializeApp() automatically discovers
  // the necessary credentials.
  return initializeApp();
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
