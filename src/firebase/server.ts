// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has elevated privileges.
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from './config'; // We can reuse the project ID

// This is a placeholder for service account credentials.
// In a real deployed environment (like Cloud Run or Cloud Functions),
// this would be automatically populated by Google Cloud.
// For local development, you would need to point to a service account JSON file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const adminApp =
  getApps().find((app) => app.name === 'admin') ||
  initializeApp(
    {
      credential: serviceAccount ? cert(serviceAccount) : undefined,
      projectId: firebaseConfig.projectId,
    },
    'admin'
  );


export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);

// A simplified initializer for server components
export function initializeFirebase() {
    return {
        firestore: adminFirestore,
        auth: adminAuth,
    }
}
