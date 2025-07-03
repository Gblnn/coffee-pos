import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  // apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // appId: import.meta.env.VITE_FIREBASE_APP_ID,

  apiKey: "AIzaSyDHM48rqJQKhk7lMTNPm6-7b-jr-TODb0c",
  authDomain: "coffee-pos-aa730.firebaseapp.com",
  projectId: "coffee-pos-aa730",
  storageBucket: "coffee-pos-aa730.firebasestorage.app",
  messagingSenderId: "956277416705",
  appId: "1:956277416705:web:0289d8c6678b533ea07100",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Firebase Authentication persistence with IndexedDB
setPersistence(auth, indexedDBLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence enabled with IndexedDB");
  })
  .catch((error) => {
    console.error("Error enabling Auth persistence:", error);
  });

// Enable Firestore offline persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Firestore offline persistence enabled");
  })
  .catch((error) => {
    if (error.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn("Multiple tabs open, persistence enabled in another tab");
    } else if (error.code === "unimplemented") {
      // The current browser doesn't support persistence
      console.warn("Current browser doesn't support persistence");
    } else {
      console.error("Error enabling Firestore persistence:", error);
    }
  });

export default app;
