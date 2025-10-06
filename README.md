# SynergyFlow ERP

This is a Next.js starter project for the SynergyFlow ERP, built with Firebase Studio.

## Getting Started

To get started, take a look at the main application page in `src/app/(app)/dashboard/page.tsx`.

## Running Locally

To run this application on your local machine, follow these steps:

1.  **Install Dependencies**: If you haven't already, open your terminal in the project directory and run:
    ```bash
    npm install
    ```

2.  **Start the Development Server**: Run the following command to start the Next.js development server:
    ```bash
    npm run dev
    ```

3.  **View Your Application**: Open your web browser and navigate to `http://localhost:3000`. You should see the ERP login page.

## Connecting Your Own Database

This application is configured to use Firebase for its database (Firestore) and authentication. To connect it to your own Firebase project, you need to update the configuration file.

1.  **Find Your Firebase Config**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project (or create a new one).
    *   In the project overview, click the **Web** icon (`</>`) to find your app's configuration. If you don't have a web app, create one.
    *   You will see a `firebaseConfig` object. Copy the values from it.

2.  **Update the Configuration File**:
    *   Open the file `src/firebase/config.ts` in your editor.
    *   Replace the existing placeholder values with the values from your own `firebaseConfig` object.

Your `src/firebase/config.ts` file should look something like this with your own project's details:

```ts
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};
```

Once you save the file and restart your local server (`npm run dev`), the application will be connected to your own Firebase project.
