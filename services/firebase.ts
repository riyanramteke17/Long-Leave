
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAhm8WZIXiZw_2a575GEDSNqbbQfFPMBXA",
  authDomain: "long-leave.firebaseapp.com",
  databaseURL: "https://long-leave-default-rtdb.firebaseio.com",
  projectId: "long-leave",
  storageBucket: "long-leave.firebasestorage.app",
  messagingSenderId: "691734351642",
  appId: "1:691734351642:web:0ec30bf1f22766408066a3",
  measurementId: "G-EQCBNML1V5"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
