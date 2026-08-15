# SpendWise

SpendWise is an Expo + React Native expense tracker built with Expo Router, Firebase Auth, and Firestore. It currently covers the core personal finance flows: sign up and login, transaction management, search, statistics, profile management, and a chat-based financial assistant.

## Project Status

The app is in active development, but the main user flows are already in place:

- Authentication with Firebase
- Transaction create, update, delete, and search flows
- Weekly, monthly, and yearly spending charts
- Profile view and edit modal
- AI-style financial assistant chat screen

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- Firebase Auth and Firestore
- React Native Gifted Chat
- React Native Gifted Charts

## Features

- Email/password registration and login
- Home dashboard with income, expense, and balance totals
- Add and edit income or expense transactions
- Delete transactions from the edit modal
- Search transactions by type, category, description, or amount
- Weekly, monthly, and yearly analytics charts
- Financial assistant chat experience for spending-related questions
- Profile screen with logout and profile editing entry point

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- An Expo-compatible development environment
- Firebase project credentials
- Ollama installed locally (for the financial assistant)

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create your local env file from the provided template:

```bash
cp .env.example .env
```

Then fill in the required values for your Firebase project and Ollama config.

### Start Ollama (Local LLM)

Pull and run a local model (example with Qwen 2.5 3B):

```bash
ollama pull qwen2.5:3b
ollama serve
```

### Run the App

```bash
npm start
```

You can also target a platform directly:

```bash
npm run android
npm run ios
npm run web
```

## Environment Variables

This project reads config from environment variables. Do not commit your real `.env` file.

Required keys:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_OLLAMA_BASE_URL`
- `EXPO_PUBLIC_OLLAMA_MODEL`

Recommended local defaults:

- `EXPO_PUBLIC_OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `EXPO_PUBLIC_OLLAMA_MODEL=qwen2.5:3b`

## Security Notes

- Firebase and Ollama env values exposed with the `EXPO_PUBLIC_` prefix are available in the client bundle.
- Restrict Firebase usage in Google Cloud / Firebase console as much as possible.
- If you run the app on a physical phone, set `EXPO_PUBLIC_OLLAMA_BASE_URL` to your Mac's LAN IP (not `127.0.0.1`) and keep both devices on the same network.
- If any real secrets were previously committed, rotate them.

## Project Structure

- `app/` - Expo Router screens, tabs, and modal routes
- `components/` - Shared UI components
- `config/` - Environment and Firebase setup
- `constants/` - Theme tokens and static data
- `contexts/` - Authentication context
- `services/` - Firestore, Firebase, image, and assistant logic
- `utils/` - Shared helpers

## Useful Scripts

```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
```
