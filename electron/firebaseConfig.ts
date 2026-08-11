import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBw8bSFhYEjnUxvDMvI6jAB0RWz5MN8cpo",
  authDomain: "inventory-bot-c33b9.firebaseapp.com",
  projectId: "inventory-bot-c33b9",
  storageBucket: "inventory-bot-c33b9.firebasestorage.app",
  messagingSenderId: "846897034335",
  appId: "1:846897034335:web:03246c3fb2d98f975bd7ea",
  measurementId: "G-F1CVT9RH1V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Realtime Database instance
export const db = getDatabase(app);
