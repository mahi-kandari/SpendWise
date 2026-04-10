const requireEnvVar = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(
      `[env] Missing ${name}. Add it to your .env file before starting the app.`,
    );
  }

  return value;
};

export const firebaseEnvConfig = {
  apiKey: requireEnvVar(
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  ),
  authDomain: requireEnvVar(
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: requireEnvVar(
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  ),
  storageBucket: requireEnvVar(
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  ),
  messagingSenderId: requireEnvVar(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: requireEnvVar(
    "EXPO_PUBLIC_FIREBASE_APP_ID",
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ),
  measurementId: requireEnvVar(
    "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID",
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  ),
};

export const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
