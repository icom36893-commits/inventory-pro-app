const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCbIk4mwmt2VKP_fyKNqcq9W3dttsDn-gw",
  authDomain: "makhzan-pro-licenses.firebaseapp.com",
  projectId: "makhzan-pro-licenses",
  storageBucket: "makhzan-pro-licenses.firebasestorage.app",
  messagingSenderId: "889060817334",
  appId: "1:889060817334:web:0d5a84a1d7aa1b549ae917"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const licensesRef = collection(db, "licenses");
    const snap = await getDocs(query(licensesRef, limit(5)));
    console.log("Empty?", snap.empty, snap.size);
    snap.forEach(doc => {
      console.log(doc.id, "=>", doc.data());
    });
  } catch(e) {
    console.error("ERROR:", e);
  }
  process.exit(0);
}

run();
