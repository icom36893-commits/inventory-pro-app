const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set } = require("firebase/database");
const { getAuth, signInAnonymously } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyBw8bSFhYEjnUxvDMvI6jAB0RWz5MN8cpo",
  authDomain: "inventory-bot-c33b9.firebaseapp.com",
  projectId: "inventory-bot-c33b9",
  storageBucket: "inventory-bot-c33b9.firebasestorage.app",
  messagingSenderId: "846897034335",
  appId: "1:846897034335:web:03246c3fb2d98f975bd7ea",
  measurementId: "G-F1CVT9RH1V"
};

async function test() {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  
  // Try unauthenticated first
  try {
    console.log("Trying unauthenticated...");
    await set(ref(db, `active_companies/TEST_TEST`), { test: 1 });
    console.log("Unauthenticated write succeeded!");
  } catch (e) {
    console.error("Unauthenticated write failed:", e.code || e.message);
  }

  // Try anonymous auth
  const auth = getAuth(app);
  try {
    console.log("Trying anonymous auth...");
    await signInAnonymously(auth);
    console.log("Anonymous auth succeeded!");
    await set(ref(db, `active_companies/TEST_TEST`), { test: 1 });
    console.log("Authenticated write succeeded!");
  } catch (e) {
    console.error("Anonymous auth/write failed:", e.code || e.message);
  }

  process.exit();
}
test();
