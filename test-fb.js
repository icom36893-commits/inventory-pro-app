const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

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

async function checkLicense(serial) {
  const licensesRef = collection(db, "licenses");
  const qLicense = query(licensesRef, where("serial", "==", serial));
  const snap = await getDocs(qLicense);
  if (snap.empty) {
    console.log("No license found for", serial);
  } else {
    console.log("License Data for", serial, ":", snap.docs[0].data());
  }
}

async function run() {
  await checkLicense("PRO-2026-QT0SMZR");
  await checkLicense("PRO-2026-VJ08GLB");
  process.exit(0);
}

run();
