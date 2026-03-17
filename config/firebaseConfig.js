import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVvM79GY5HojwJuJgRIMWMdWOFWFggHrA",
  authDomain: "spendwise-a1e35.firebaseapp.com",
  projectId: "spendwise-a1e35",
  storageBucket: "spendwise-a1e35.firebasestorage.app",
  messagingSenderId: "490975609770",
  appId: "1:490975609770:web:60d355437569990c6561d3",
  measurementId: "G-JPGVPYGRPF"
};

const app = initializeApp(firebaseConfig);

// auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// db
export const firestore = getFirestore(app);
