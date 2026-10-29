import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "mindful-carving-f53bd",
  appId: "1:349594666338:web:7f8e46f766e4d967b2983b",
  apiKey: "AIzaSyD_vivWyRZM538nLnatEW3elRlCuj6lK5E",
  authDomain: "mindful-carving-f53bd.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-excellenceservic-b77edaa6-8062-4956-a8e2-fb2f7f1c4f76",
  storageBucket: "mindful-carving-f53bd.firebasestorage.app",
  messagingSenderId: "349594666338",
  measurementId: "",
  oAuthClientId: "349594666338-bi0mlampinslv73r32qkrv8rj614r8k1.apps.googleusercontent.com",
  recaptchaSiteKey: "",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
