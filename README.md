# Expense Tracker

Expo + React Native expense tracking app with Firebase backend.

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create your local environment file

```bash
cp .env.example .env
```

3. Fill `.env` with your own Firebase and Gemini values

4. Start the app

```bash
npx expo start
```

## Environment Variables

This project now reads all sensitive config from environment variables. Never commit your real `.env` file.

Required keys:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_GEMINI_API_KEY`

## Public Repo Safety Checklist

1. Keep `.env` out of git (already handled in `.gitignore`).
2. Commit only `.env.example` with placeholder values.
3. Rotate any keys that were previously committed.
4. Restrict Firebase API key usage in Google Cloud Console by app/domain as applicable.
5. For strong Gemini key protection, call Gemini from a backend function (server-side) instead of directly from the mobile app.
