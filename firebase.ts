import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCu2_IP3n9UC5o-lPzBUiNWdDRrlp9QzXk",
  authDomain: "warhub-29ad0.firebaseapp.com",
  databaseURL: "https://warhub-29ad0-default-rtdb.firebaseio.com",
  projectId: "warhub-29ad0",
  storageBucket: "warhub-29ad0.appspot.com",
  messagingSenderId: "806053850969",
  appId: "1:806053850969:web:588695c23ffa184273e648"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);